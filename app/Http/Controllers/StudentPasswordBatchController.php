<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\StudentAccountService;
use App\Services\StudentCredentialPdf;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StudentPasswordBatchController extends Controller
{
    public const CACHE_PREFIX = 'student-password-batch:';

    public function store(Request $request, StudentAccountService $accounts)
    {
        $data = $request->validate([
            'student_ids' => 'required|array|list|min:1|max:100',
            'student_ids.*' => ['required', 'integer', 'distinct', Rule::exists('users', 'id')->where('role', 'student')],
        ]);
        $token = (string) Str::uuid();
        $expires = now()->addMinutes(30);
        try {
            $rows = DB::transaction(function () use ($request, $accounts, $data, $token, $expires) {
                $students = User::where('role', 'student')->whereIn('id', $data['student_ids'])->orderBy('id')->lockForUpdate()->get();
                if ($students->count() !== count($data['student_ids'])) {
                    throw ValidationException::withMessages(['student_ids' => 'A selected student is no longer available. Refresh the list and try again.']);
                }
                $rows = [];
                $fingerprints = [];
                foreach ($students as $student) {
                    $password = $accounts->temporaryPassword();
                    $student->update(['password' => $password, 'must_change_password' => true, 'remember_token' => Str::random(60)]);
                    $rows[] = ['id' => $student->id, 'name' => $student->name, 'username' => $student->username, 'password' => $password];
                    $fingerprints[$student->id] = hash('sha256', $student->password);
                }
                if (config('session.driver') === 'database') {
                    DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))->whereIn('user_id', $students->modelKeys())->delete();
                }
                $payload = ['teacher_id' => $request->user()->id, 'session' => hash('sha256', $request->session()->getId()), 'generated_at' => now()->toIso8601String(), 'expires_at' => $expires->getTimestamp(), 'rows' => $rows, 'fingerprints' => $fingerprints];
                if (! Cache::put(self::CACHE_PREFIX.$token, Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR)), $expires)) {
                    throw new \RuntimeException('The password list could not be saved. No passwords were changed.');
                }
                ActivityLog::create(['user_id' => $request->user()->id, 'event' => 'student_passwords_generated', 'subject_type' => User::class, 'metadata' => ['student_ids' => $students->modelKeys(), 'count' => $students->count()], 'occurred_at' => now()]);

                return $rows;
            });
        } catch (\Throwable $exception) {
            Cache::forget(self::CACHE_PREFIX.$token);
            throw $exception;
        }

        return response()->json(['credentials' => $rows, 'download_url' => route('students.password-batches.download', $token, absolute: false), 'expires_at' => $expires->toIso8601String()], 201)->header('Cache-Control', 'private, no-store')->header('Pragma', 'no-cache');
    }

    public function download(Request $request, string $token, StudentCredentialPdf $pdf)
    {
        $encrypted = Cache::get(self::CACHE_PREFIX.$token);
        abort_unless(is_string($encrypted), 410, 'This password list has expired. Generate a new list for the selected students.');
        try {
            $batch = json_decode(Crypt::decryptString($encrypted), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            abort(410, 'This password list is no longer available.');
        }
        abort_unless($batch['teacher_id'] === $request->user()->id && hash_equals($batch['session'], hash('sha256', $request->session()->getId())), 403);
        abort_if(now()->getTimestamp() >= $batch['expires_at'], 410, 'This password list has expired.');
        $students = User::whereIn('id', array_column($batch['rows'], 'id'))->get()->keyBy('id');
        foreach ($batch['rows'] as $row) {
            $student = $students->get($row['id']);
            abort_unless($student && $student->role === 'student' && $student->username === $row['username'] && hash_equals($batch['fingerprints'][$row['id']], hash('sha256', $student->password)), 409, 'A student password or account changed after this list was generated. Generate a new list before downloading.');
        }

        return response($pdf->render($batch['rows'], $batch['generated_at']))->withHeaders(['Content-Type' => 'application/pdf', 'Content-Disposition' => 'attachment; filename="student-passwords.pdf"', 'Cache-Control' => 'private, no-store', 'Pragma' => 'no-cache', 'X-Content-Type-Options' => 'nosniff']);
    }
}
