<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\WordpressEvidence;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WordpressWorkspaceController extends Controller
{
    public function save(Request $request, Lesson $lesson)
    {
        return $this->persist($request, $lesson, false);
    }

    public function submit(Request $request, Lesson $lesson)
    {
        return $this->persist($request, $lesson, true);
    }

    public function download(Request $request, WordpressEvidence $evidence)
    {
        abort_unless($request->user()->role === 'teacher' || ($request->user()->role === 'student' && $evidence->user_id === $request->user()->id), 403);
        abort_unless($request->user()->role === 'teacher' || CourseAccess::lessons($request->user())->where('id', $evidence->lesson_id)->exists(), 403);
        abort_unless(Storage::disk('local')->exists($evidence->path), 404);

        return Storage::disk('local')->download($evidence->path, $evidence->name, ['Content-Type' => $evidence->mime, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store', 'Content-Security-Policy' => "sandbox; default-src 'none'"]);
    }

    private function persist(Request $request, Lesson $lesson, bool $submit)
    {
        abort_unless($lesson->isWordpress() && CourseAccess::unlocked($request->user(), $lesson), 403);
        $urlRule = ['nullable', 'url:http,https', 'max:2048', function ($attribute, $value, $fail) {
            if (parse_url($value, PHP_URL_USER) !== null || parse_url($value, PHP_URL_PASS) !== null || preg_match('/(?:password|passwd|secret|token|api[_-]?key|nonce|[?&#]key|[?&#]auth)=/i', rawurldecode($value))) {
                $fail('Use a site link without embedded credentials, secrets or access tokens.');
            }
        }];
        if (is_string($request->input('evidence_ids'))) {
            $decoded = json_decode($request->input('evidence_ids'), true);
            if (is_array($decoded)) {
                $request->merge(['evidence_ids' => $decoded]);
            }
        }
        $data = $request->validate([
            'version' => 'required|integer|min:1', 'wordpress_practice_url' => $urlRule, 'wordpress_project_url' => $urlRule,
            'wordpress_environment' => ($submit ? 'required' : 'nullable').'|string|max:2000',
            'wordpress_notes' => ($submit ? 'required|string|min:20' : 'nullable|string').'|max:20000',
            'evidence_ids' => 'present|array|max:6', 'evidence_ids.*' => 'required|uuid|distinct',
            'files' => 'nullable|array|max:6', 'files.*' => 'required|file|mimes:png,jpg,jpeg,webp,pdf|mimetypes:image/png,image/jpeg,image/webp,application/pdf|max:8192',
            'password' => 'prohibited', 'wordpress_password' => 'prohibited', 'database_password' => 'prohibited', 'hosting_password' => 'prohibited',
        ]);
        $ids = $data['evidence_ids'];
        $owned = WordpressEvidence::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->whereIn('id', $ids)->get()->keyBy('id');
        if (count($ids) !== $owned->count()) {
            throw ValidationException::withMessages(['evidence_ids' => 'Evidence must belong to you and this lesson.']);
        }
        if (count($ids) + count($request->file('files', [])) > 6) {
            throw ValidationException::withMessages(['files' => 'Keep at most six evidence files per version.']);
        }
        if ($submit && ! filled($data['wordpress_project_url'] ?? null) && ! $ids && ! $request->hasFile('files')) {
            throw ValidationException::withMessages(['wordpress_project_url' => 'Submit a website URL or screenshot/PDF evidence for a local or restricted practice site.']);
        }
        $createdPaths = [];
        try {
            $result = DB::transaction(function () use ($request, $lesson, $data, $submit, $owned, &$createdPaths) {
                $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->first();
                abort_unless($progress, 422, 'Start the lesson before saving.');
                abort_if($progress->status === 'completed', 403, 'Teacher-approved work is read-only.');
                if ($progress->version !== (int) $data['version']) {
                    throw ValidationException::withMessages(['version' => 'A newer version exists. Refresh before saving or submitting.']);
                }
                $evidence = [];
                foreach ($data['evidence_ids'] as $id) {
                    $evidence[] = $owned[$id]->only('id', 'name', 'mime', 'size');
                }
                foreach ($request->file('files', []) as $file) {
                    $path = $file->store('wordpress-evidence', 'local');
                    if (! $path) {
                        throw new \RuntimeException('Evidence storage failed.');
                    }
                    $createdPaths[] = $path;
                    $name = Str::limit(preg_replace('/[^\pL\pN ._()-]/u', '_', basename($file->getClientOriginalName())), 180, '');
                    $record = WordpressEvidence::create(['id' => (string) Str::uuid(), 'user_id' => $request->user()->id, 'lesson_id' => $lesson->id, 'path' => $path, 'name' => $name, 'mime' => $file->getMimeType(), 'size' => $file->getSize()]);
                    $evidence[] = $record->only('id', 'name', 'mime', 'size');
                }
                $values = ['wordpress_practice_url' => $data['wordpress_practice_url'] ?? null, 'wordpress_project_url' => $data['wordpress_project_url'] ?? null, 'wordpress_environment' => $data['wordpress_environment'] ?? '', 'wordpress_notes' => $data['wordpress_notes'] ?? '', 'wordpress_evidence' => $evidence];
                $changed = false;
                foreach ($values as $key => $value) {
                    if (($progress->$key ?? ($key === 'wordpress_evidence' ? [] : null)) !== $value) {
                        $changed = true;
                    }
                }
                if ($changed || $submit) {
                    Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->whereIn('status', ['submitted', 'quiz_pending'])->update(['status' => 'superseded']);
                }
                $progress->update($values + ['version' => $progress->version + 1, 'last_saved_at' => now(), 'status' => $submit ? 'submitted' : ($changed ? 'in_progress' : $progress->status), 'activity_passed_at' => $submit ? now() : ($changed ? null : $progress->activity_passed_at), 'submitted_at' => $submit ? now() : $progress->submitted_at]);
                if ($submit) {
                    $submission = Submission::create($values + ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id, 'version' => (Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->max('version') ?? 0) + 1, 'status' => 'submitted', 'html_code' => '', 'css_code' => '', 'submitted_at' => now()]);
                }
                ActivityLog::create(['user_id' => $request->user()->id, 'event' => $submit ? ($lesson->is_project ? 'project_submitted' : 'activity_submitted') : 'workspace_saved', 'subject_type' => Lesson::class, 'subject_id' => $lesson->id, 'metadata' => $submit ? ['submission_id' => $submission->id, 'course_id' => $lesson->course_id] : ['course_id' => $lesson->course_id], 'occurred_at' => now()]);

                return ['version' => $progress->version, 'status' => $progress->status, 'evidence' => $evidence];
            });
        } catch (\Throwable $error) {
            foreach ($createdPaths as $path) {
                Storage::disk('local')->delete($path);
            }throw $error;
        }

        return response()->json($result + ['message' => $submit ? 'Practical evidence submitted. Pass the quiz and wait for teacher review.' : 'Practice site details and evidence saved.']);
    }
}
