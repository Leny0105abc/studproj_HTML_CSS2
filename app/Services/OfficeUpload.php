<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class OfficeUpload
{
    public static function validate(UploadedFile $file, array $allowed): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fail = fn () => throw ValidationException::withMessages(['files' => 'Upload a valid permitted Word/PDF/Excel document. Maximum expanded Office package: 50 MB.']);
        if (! in_array($extension, $allowed, true)) {
            $fail();
        }
        if ($extension === 'pdf') {
            if (file_get_contents($file->getRealPath(), false, null, 0, 5) !== '%PDF-') {
                $fail();
            }

            return;
        }
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            $fail();
        }
        try {
            if ($zip->numFiles > 5000 || $zip->locateName('[Content_Types].xml') === false || $zip->locateName(in_array($extension, ['xlsx', 'xlsm'], true) ? 'xl/workbook.xml' : 'word/document.xml') === false) {
                $fail();
            }
            $expanded = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                $expanded += $entry['size'];
                if ($expanded > 50 * 1024 * 1024 || preg_match('~(^/|(^|/)\.\.(/|$)|\\\\)~', $entry['name'])) {
                    $fail();
                }
            }
            $types = $zip->getFromName('[Content_Types].xml', 1048576);
            $expected = ['docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml', 'dotx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml', 'docm' => 'application/vnd.ms-word.document.macroEnabled.main+xml', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml', 'xlsm' => 'application/vnd.ms-excel.sheet.macroEnabled.main+xml'];
            if (! str_contains($types ?? '', $expected[$extension] ?? 'INVALID')) {
                $fail();
            }
            if (in_array($extension, ['docx', 'dotx', 'xlsx']) && ($zip->locateName('word/vbaProject.bin') !== false || $zip->locateName('xl/vbaProject.bin') !== false || str_contains($types ?? '', 'macroEnabled') || str_contains($types ?? '', 'vbaProject'))) {
                $fail();
            }
        } finally {
            $zip->close();
        }
    }
}
