<?php

namespace App\Services;

use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use ZipArchive;

class StudentImportService
{
    public const HEADERS = ['first_name', 'middle_name', 'last_name', 'username', 'education_level', 'grade_level', 'program', 'section', 'email', 'password', 'status', 'lrn'];

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }

    public function parse(UploadedFile $file): array
    {
        try {
            $raw = strtolower($file->getClientOriginalExtension()) === 'xlsx' ? $this->xlsx($file) : $this->csv($file);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable) {
            $this->fail('The spreadsheet could not be read. Use the CSV or XLSX template.');
        }
        if (! $raw) {
            $this->fail('The file is empty.');
        }
        $headers = array_shift($raw)['values'];
        $aliases = ['student_name' => 'name', 'student name' => 'name', 'grade' => 'grade_level', 'grade level' => 'grade_level'];
        $mapped = [];
        foreach ($headers as $index => $header) {
            $header = Str::lower(trim((string) $header, " \t\n\r\0\x0B\xEF\xBB\xBF"));
            $header = $aliases[$header] ?? str_replace(' ', '_', $header);
            if (! in_array($header, [...self::HEADERS, 'name'], true)) {
                continue; // In particular, an uploaded role is never trusted.
            }
            if (in_array($header, $mapped, true)) {
                $this->fail('Duplicate column: '.$header);
            }
            $mapped[$index] = $header;
        }
        foreach (['username', 'education_level', 'grade_level', 'section'] as $required) {
            if (! in_array($required, $mapped, true)) {
                $this->fail('The required "'.$required.'" column is missing.');
            }
        }
        if (! in_array('name', $mapped, true) && (! in_array('first_name', $mapped, true) || ! in_array('last_name', $mapped, true))) {
            $this->fail('Provide name, or both first_name and last_name columns.');
        }
        $rows = [];
        foreach ($raw as $row) {
            $data = [];
            foreach ($mapped as $index => $header) {
                $data[$header] = trim((string) ($row['values'][$index] ?? ''));
            }
            $data['username'] = Str::lower($data['username']);
            $data['email'] = Str::lower($data['email'] ?? '');
            $data['status'] = Str::lower($data['status'] ?? '') ?: 'active';
            $data['lrn'] = ($data['lrn'] ?? '') !== '' ? $data['lrn'] : null;
            $data['_split_name'] = ($data['name'] ?? '') === '';
            $data['name'] = ($data['name'] ?? '') ?: collect([$data['first_name'] ?? '', $data['middle_name'] ?? '', $data['last_name'] ?? ''])->filter()->join(' ');
            $level = Str::lower($data['education_level'] ?? '');
            $slug = match ($level) {
                'high school', 'high-school' => 'high-school', 'college' => 'college', default => null
            };
            $data['education_level_id'] = $slug ? EducationLevel::where('slug', $slug)->value('id') : null;
            $rows[] = ['number' => $row['number'], 'data' => $data];
        }

        return $this->validateRows($rows);
    }

    public function validateRows(array $rows): array
    {
        $seenUsers = $seenEmails = $seenLrns = [];
        foreach ($rows as &$row) {
            $data = $row['data'];
            $errors = Validator::make($data, array_merge([
                'name' => 'required|string|max:255',
                'first_name' => ($data['_split_name'] ? 'required' : 'nullable').'|string|max:80',
                'middle_name' => 'nullable|string|max:80',
                'last_name' => ($data['_split_name'] ? 'required' : 'nullable').'|string|max:80',
                'username' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9][a-z0-9._-]*$/'],
                'grade_level' => 'required|string|max:30', 'section' => 'required|string|max:50',
                'email' => 'nullable|email:rfc|max:255', 'password' => 'nullable|string|min:6|max:128',
                'status' => 'required|in:active,disabled,archived',
                'education_level' => 'required|string',
                'education_level_id' => 'nullable|exists:education_levels,id',
                'lrn' => 'nullable|string|max:30',
            ], StudentEducation::rules($data)), StudentEducation::messages())->errors()->all();
            if (! ($data['education_level_id'] ?? null)) {
                $errors[] = trim($data['education_level'] ?? '') === '' ? 'Education level is required.' : 'Invalid education level. Use High School or College.';
            }
            $username = Str::lower($data['username']);
            $email = Str::lower($data['email'] ?: $username.'@student.local');
            $duplicates = [];
            if (isset($seenUsers[$username]) || User::whereRaw('LOWER(username) = ?', [$username])->exists()) {
                $duplicates[] = 'Username already exists or is repeated in this file.';
            }
            if (isset($seenEmails[$email]) || User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
                $duplicates[] = 'Email already exists or is repeated in this file.';
            }
            $lrn = Str::lower($data['lrn'] ?? '');
            if ($lrn !== '' && (isset($seenLrns[$lrn]) || User::whereRaw('LOWER(lrn) = ?', [$lrn])->exists())) {
                $duplicates[] = 'LRN already exists or is repeated in this file.';
            }
            $row['state'] = $errors ? 'Invalid' : ($duplicates ? 'Duplicate' : 'Ready');
            $row['errors'] = [...$errors, ...$duplicates];
            // Invalid rows cannot reserve names and block a later valid row.
            if ($row['state'] === 'Ready') {
                $seenUsers[$username] = $seenEmails[$email] = true;
                if ($lrn !== '') {
                    $seenLrns[$lrn] = true;
                }
            }
        }

        return $rows;
    }

    public function summary(array $rows): array
    {
        return ['total' => count($rows), 'ready' => count(array_filter($rows, fn ($r) => $r['state'] === 'Ready')),
            'duplicates' => count(array_filter($rows, fn ($r) => $r['state'] === 'Duplicate')),
            'invalid' => count(array_filter($rows, fn ($r) => $r['state'] === 'Invalid'))];
    }

    public function publicRows(array $rows): array
    {
        return array_map(fn ($r) => ['number' => $r['number'], 'name' => $r['data']['name'], 'username' => $r['data']['username'],
            'class' => $r['data']['grade_level'].' · '.$r['data']['section'], 'email' => $r['data']['email'],
            'educationLevel' => EducationLevel::find($r['data']['education_level_id'])?->name ?? 'Education Level Not Assigned',
            'status' => $r['data']['status'], 'state' => $r['state'], 'errors' => $r['errors']], $rows);
    }

    private function addRow(array &$rows, int $number, array $values): void
    {
        if (! array_filter($values, fn ($v) => trim((string) $v) !== '')) {
            return;
        }
        if (count($values) > config('student-import.max_columns')) {
            $this->fail('Too many columns in the spreadsheet.');
        }
        foreach ($values as $value) {
            if (! mb_check_encoding((string) $value, 'UTF-8') || strlen((string) $value) > config('student-import.max_cell_bytes')) {
                $this->fail('Use UTF-8 text with cells no longer than '.config('student-import.max_cell_bytes').' bytes.');
            }
        }
        $rows[] = ['number' => $number, 'values' => $values];
        if (count($rows) > config('student-import.max_rows') + 1) {
            $this->fail('The file exceeds the '.config('student-import.max_rows').' student limit.');
        }
    }

    private function csv(UploadedFile $file): array
    {
        $stream = fopen($file->getRealPath(), 'rb');
        $rows = [];
        try {
            $number = 0;
            while (($values = fgetcsv($stream, null, ',', '"', '')) !== false) {
                $this->addRow($rows, ++$number, $values);
            }
        } finally {
            fclose($stream);
        }

        return $rows;
    }

    private function xlsx(UploadedFile $file): array
    {
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            $this->fail('Invalid XLSX file.');
        }
        try {
            $expanded = 0;
            if ($zip->numFiles > 1000) {
                $this->fail('The workbook contains too many entries.');
            }
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                $expanded += $entry['size'];
                if ($expanded > config('student-import.max_expanded_bytes')) {
                    $this->fail('The expanded workbook is too large.');
                }
                if (preg_match('~vbaProject|externalLinks/|embeddings/~i', $entry['name'])) {
                    $this->fail('Macros, external workbook links and embedded objects are not supported.');
                }
            }
        } finally {
            $zip->close();
        }
        $reader = new Xlsx;
        $info = $reader->listWorksheetInfo($file->getRealPath());
        if (! $info || $info[0]['totalRows'] > config('student-import.max_rows') + 1 || $info[0]['totalColumns'] > config('student-import.max_columns')) {
            $this->fail('The first worksheet exceeds the configured row or column limit.');
        }
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly($info[0]['worksheetName']);
        $book = $reader->load($file->getRealPath());
        try {
            $sheet = $book->getSheet(0);
            $rows = [];
            foreach ($sheet->getRowIterator() as $row) {
                $values = [];
                foreach ($row->getCellIterator('A', $info[0]['lastColumnLetter']) as $cell) {
                    if ($cell->getDataType() === DataType::TYPE_FORMULA) {
                        $this->fail('Formulas are not supported. Replace formulas with plain values before uploading.');
                    }
                    $value = $cell->getValue(); // Never calculate formulas or follow links.
                    if (is_object($value)) {
                        $value = (string) $value;
                    }
                    $values[] = (string) $value;
                }
                $this->addRow($rows, $row->getRowIndex(), $values);
            }

            return $rows;
        } finally {
            $book->disconnectWorksheets();
        }
    }
}
