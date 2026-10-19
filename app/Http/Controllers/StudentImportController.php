<?php

namespace App\Http\Controllers;

use App\Models\EducationLevel;
use App\Services\StudentAccountService;
use App\Services\StudentImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class StudentImportController extends Controller
{
    private function key(string $token): string
    {
        abort_unless(Str::isUuid($token), 404);

        return 'student-import:'.$token;
    }

    private function read(Request $request, string $token): array
    {
        $encrypted = Cache::store('file')->get($this->key($token));
        abort_unless($encrypted, 410, 'This import has expired. Upload the file again.');
        $batch = json_decode(Crypt::decryptString($encrypted), true, flags: JSON_THROW_ON_ERROR);
        abort_unless($batch['owner'] === $request->user()->id, 403);

        return $batch;
    }

    private function save(string $token, array $batch): void
    {
        Cache::store('file')->put($this->key($token), Crypt::encryptString(json_encode($batch, JSON_THROW_ON_ERROR)), now()->addMinutes(config('student-import.expires_minutes')));
    }

    public function index()
    {
        return Inertia::render('students/import', [
            'maxFileKb' => config('student-import.max_file_kb'), 'maxRows' => config('student-import.max_rows'),
            'educationLevels' => EducationLevel::orderBy('id')->get(['id', 'name']),
        ]);
    }

    public function preview(Request $request, StudentImportService $imports)
    {
        $request->validate([
            'file' => ['required', 'file', 'extensions:csv,xlsx', 'mimes:csv,txt,xlsx', 'max:'.config('student-import.max_file_kb')],
        ]);
        $rows = $imports->parse($request->file('file'));
        $token = (string) Str::uuid();
        $this->save($token, ['owner' => $request->user()->id, 'rows' => $rows, 'complete' => false]);

        return redirect()->route('students.import.show', $token);
    }

    public function show(Request $request, string $token, StudentImportService $imports)
    {
        $batch = $this->read($request, $token);
        $credentials = $request->session()->pull('student_import_credentials.'.$token);

        return Inertia::render('students/import', [
            'token' => $token, 'rows' => $batch['complete'] ? $batch['publicRows'] : $imports->publicRows($batch['rows']),
            'summary' => $batch['summary'] ?? $imports->summary($batch['rows']), 'complete' => $batch['complete'],
            'imported' => $batch['imported'] ?? 0,
            // Credentials are removed from the server result before any later reload.
            'credentials' => $credentials ? json_decode(Crypt::decryptString($credentials), true, flags: JSON_THROW_ON_ERROR) : [],
            'maxFileKb' => config('student-import.max_file_kb'), 'maxRows' => config('student-import.max_rows'),
            'educationLevels' => [],
        ])->toResponse($request)->header('Cache-Control', 'no-store, private');
    }

    public function store(Request $request, string $token, StudentImportService $imports, StudentAccountService $accounts)
    {
        return Cache::store('file')->lock($this->key($token).':lock', 180)->block(10, function () use ($request, $token, $imports, $accounts) {
            $batch = $this->read($request, $token);
            if ($batch['complete']) {
                return redirect()->route('students.import.show', $token);
            }
            $credentials = [];
            try {
                $rows = DB::transaction(function () use ($batch, $imports, $accounts, &$credentials) {
                    // Recheck database duplicates at confirmation, not just upload time.
                    $rows = $imports->validateRows($batch['rows']);
                    foreach ($rows as $row) {
                        if ($row['state'] === 'Ready') {
                            $credentials[] = $accounts->create($row['data'])['credentials'];
                        }
                    }

                    return $rows;
                });
            } catch (\Throwable) {
                // No exception payload or student data is written to logs or validation errors.
                Log::warning('Student import rolled back', ['uploaded_by' => $request->user()->id]);
                throw ValidationException::withMessages(['import' => 'Student import could not be completed. No accounts were imported and no existing student records were changed. Upload again to refresh validation.']);
            }
            $summary = $imports->summary($rows);
            $this->save($token, ['owner' => $batch['owner'], 'complete' => true, 'summary' => $summary,
                'publicRows' => $imports->publicRows($rows), 'imported' => count($credentials)]);
            $request->session()->flash('student_import_credentials.'.$token, Crypt::encryptString(json_encode($credentials, JSON_THROW_ON_ERROR)));
            Log::info('Student import completed', ['uploaded_by' => $request->user()->id, 'total_rows' => $summary['total'],
                'successful_rows' => count($credentials), 'skipped_rows' => $summary['duplicates'], 'failed_rows' => $summary['invalid']]);

            return redirect()->route('students.import.show', $token);
        });
    }

    public function errors(Request $request, string $token, StudentImportService $imports)
    {
        $batch = $this->read($request, $token);
        $rows = $batch['complete'] ? $batch['publicRows'] : $imports->publicRows($batch['rows']);

        return response()->streamDownload(function () use ($rows) {
            $stream = fopen('php://output', 'wb');
            fputcsv($stream, ['row_number', 'student_name', 'username', 'error'], escape: '');
            foreach ($rows as $row) {
                if ($row['state'] !== 'Ready') {
                    fputcsv($stream, array_map($this->csvSafe(...), [$row['number'], $row['name'], $row['username'], implode(' ', $row['errors'])]), escape: '');
                }
            }
            fclose($stream);
        }, 'student_import_errors.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store, private']);
    }

    private function csvSafe(mixed $value): string
    {
        $value = (string) $value;

        return preg_match('/^[\s]*[=+@\-]/u', $value) ? "'".$value : $value;
    }

    public function template()
    {
        return response()->streamDownload(function () {
            $book = new Spreadsheet;
            $sheet = $book->getActiveSheet();
            $sheet->setTitle('Students');
            $sheet->fromArray([StudentImportService::HEADERS, ['Alex', '', 'Example', 'alex.example', 'High School', 'Grade 11', '', 'Sample Section', '', '', 'active', '']]);
            $sheet->getStyle('A1:L1')->getFont()->setBold(true);
            foreach (range('A', 'L') as $column) {
                $sheet->getColumnDimension($column)->setWidth(22);
            }
            $instructions = $book->createSheet()->setTitle('Instructions');
            $instructions->fromArray(array_map(fn ($line) => [$line], [
                'Replace the fictitious example in Students before upload. Only the first worksheet is imported.',
                'Required: username, education_level, grade_level, section and either name or first_name + last_name.',
                'Username: letters a-z, digits, dots, underscores or hyphens. Normalized to lowercase; no spaces.',
                'Optional: middle_name, email, password, status. Blank passwords generate secure temporary passwords.',
                'Optional student identifier column: lrn. Format identifiers as text to preserve leading zeroes. Duplicate LRNs are skipped.',
                'Provided passwords: 6–128 characters. Blank passwords generate six-character lowercase/digit passwords. Students must change their password after first login.',
                'Statuses: active (default), disabled, archived. All accounts are students.',
                'Each row must specify High School (high-school) or College. No level is inferred or defaulted.',
                'High School grades: 7–12 or Grade 7–Grade 12. College years: 1st Year–6th Year or Year 1–Year 6. College program is optional.',
                'Grade and section are stored as text, exactly as in Add Student. No automatic course enrollment.',
                'Duplicates are skipped. Existing accounts and progress are never overwritten.',
                'Upload UTF-8 CSV or XLSX values only. Formulas, macros and embedded objects are not accepted.',
                'Maximum '.config('student-import.max_rows').' students; '.config('student-import.max_file_kb').' KB file.',
                'Fix errors in your source file and upload again before confirming. Credentials appear once after import.',
            ]));
            $instructions->getColumnDimension('A')->setWidth(120);
            $book->setActiveSheetIndex(0);
            $writer = new Xlsx($book);
            $writer->setPreCalculateFormulas(false);
            $writer->save('php://output');
            $book->disconnectWorksheets();
        }, 'student_import_template.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Cache-Control' => 'no-store']);
    }
}
