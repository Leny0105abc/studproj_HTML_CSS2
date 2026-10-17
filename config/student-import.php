<?php

return [
    'max_file_kb' => (int) env('STUDENT_IMPORT_MAX_FILE_KB', 5120),
    'max_rows' => (int) env('STUDENT_IMPORT_MAX_ROWS', 100),
    'max_columns' => 20,
    'max_cell_bytes' => 4096,
    'max_expanded_bytes' => 20 * 1024 * 1024,
    'expires_minutes' => 60,
];
