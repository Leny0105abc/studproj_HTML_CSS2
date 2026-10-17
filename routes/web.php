<?php

use App\Http\Controllers\AiTutorController;
use App\Http\Controllers\CaseStudyController;
use App\Http\Controllers\CaseStudyLabController;
use App\Http\Controllers\CodeLabController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CsharpRunController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JavaRunController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScratchWorkspaceController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentImportController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\VbnetRunController;
use App\Http\Controllers\WordpressWorkspaceController;
use Illuminate\Support\Facades\Route;

// Only public, generated runtime assets are exposed with CORS for the opaque sandbox.
Route::get('javascript-runtime-assets/{file}', function (string $file) {
    abort_unless(in_array($file, ['worker.js', 'dom.js', 'quickjs.wasm', 'version.json'], true), 404);
    $path = public_path('javascript-runtime/'.$file);
    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => $file === 'quickjs.wasm' ? 'application/wasm' : ($file === 'version.json' ? 'application/json' : 'text/javascript'),
        'Access-Control-Allow-Origin' => '*', 'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Cache-Control' => $file === 'version.json' ? 'no-store' : 'public, max-age=3600', 'X-Content-Type-Options' => 'nosniff',
    ]);
})->where('file', 'worker\.js|dom\.js|quickjs\.wasm|version\.json');

Route::get('sql-runtime-assets/{file}', function (string $file) {
    abort_unless(in_array($file, ['worker.js', 'sql-wasm.wasm', 'version.json'], true), 404);
    $path = public_path('sql-runtime/'.$file);
    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => $file === 'sql-wasm.wasm' ? 'application/wasm' : ($file === 'version.json' ? 'application/json' : 'text/javascript'),
        'Access-Control-Allow-Origin' => '*', 'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Cache-Control' => $file === 'version.json' ? 'no-store' : 'public, max-age=3600', 'X-Content-Type-Options' => 'nosniff',
    ]);
})->where('file', 'worker\.js|sql-wasm\.wasm|version\.json');

Route::get('cpp-runtime-assets/{file}', function (string $file) {
    abort_unless(in_array($file, ['worker.js', 'version.json', 'runtime-manifest.v1.json', 'bin/clang.wasm.gz', 'bin/lld.wasm.gz', 'bin/memfs.wasm.gz', 'bin/sysroot.tar.gz'], true), 404);
    $path = public_path('cpp-runtime/'.$file);
    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => str_ends_with($file, '.json') ? 'application/json' : ($file === 'worker.js' ? 'text/javascript' : 'application/octet-stream'),
        'Access-Control-Allow-Origin' => '*', 'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Cache-Control' => str_ends_with($file, '.json') ? 'no-store' : 'public, max-age=3600', 'X-Content-Type-Options' => 'nosniff',
    ]);
})->where('file', 'worker\.js|version\.json|runtime-manifest\.v1\.json|bin/(clang\.wasm\.gz|lld\.wasm\.gz|memfs\.wasm\.gz|sysroot\.tar\.gz)');

Route::get('php-runtime-assets/{file}', function (string $file) {
    abort_unless(in_array($file, ['worker.js', 'php.wasm', 'version.json'], true), 404);
    $path = public_path('php-runtime/'.$file);
    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => $file === 'php.wasm' ? 'application/wasm' : ($file === 'version.json' ? 'application/json' : 'text/javascript'),
        'Access-Control-Allow-Origin' => '*', 'Cross-Origin-Resource-Policy' => 'cross-origin',
        'Cache-Control' => $file === 'version.json' ? 'no-store' : 'public, max-age=3600', 'X-Content-Type-Options' => 'nosniff',
    ]);
})->where('file', 'worker\.js|php\.wasm|version\.json');

Route::get('tailwind-runtime-assets/{file}', function (string $file) {
    abort_unless(in_array($file, ['compiler.js', 'version.json'], true), 404);
    $path = public_path('tailwind-runtime/'.$file);
    abort_unless(is_file($path), 404);

    return response()->file($path, ['Content-Type' => $file === 'version.json' ? 'application/json' : 'text/javascript', 'Access-Control-Allow-Origin' => '*', 'Cross-Origin-Resource-Policy' => 'cross-origin', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => $file === 'version.json' ? 'no-store' : 'public, max-age=3600']);
})->where('file', 'compiler\.js|version\.json');

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('wordpress-evidence/{evidence}', [WordpressWorkspaceController::class, 'download'])->whereUuid('evidence')->name('wordpress.evidence');
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('lessons', [LessonController::class, 'index'])->name('lessons.index');
    Route::get('lessons/{lesson}/preview', [LessonController::class, 'preview'])->name('lessons.preview');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');
    Route::get('case-studies', [CaseStudyController::class, 'index'])->name('case-studies.index');

    Route::middleware('role:student')->group(function () {
        Route::post('courses/{course:slug}/modules/{module}/assessment', [CourseController::class, 'assessment'])->name('courses.assessment');
        Route::post('code-lab/{lesson}/programming/generate', [\App\Http\Controllers\ProgrammingWorkspaceController::class, 'generate'])->middleware('throttle:60,1')->name('programming.generate');
        Route::put('code-lab/{lesson}/programming/save', [\App\Http\Controllers\ProgrammingWorkspaceController::class, 'save'])->name('programming.save');
        Route::post('code-lab/{lesson}/programming/submit', [\App\Http\Controllers\ProgrammingWorkspaceController::class, 'submit'])->name('programming.submit');
        Route::get('code-lab/{lesson}', [CodeLabController::class, 'show'])->name('code-lab.show');
        Route::post('code-lab/{lesson}/java/run', JavaRunController::class)->middleware('throttle:6,1')->name('java.run');
        Route::post('code-lab/{lesson}/csharp/run', CsharpRunController::class)->middleware('throttle:6,1')->name('csharp.run');
        Route::post('code-lab/{lesson}/vbnet/run', VbnetRunController::class)->middleware('throttle:6,1')->name('vbnet.run');
        Route::post('code-lab/{lesson}/wordpress/save', [WordpressWorkspaceController::class, 'save'])->middleware('throttle:20,1')->name('wordpress.save');
        Route::post('code-lab/{lesson}/wordpress/submit', [WordpressWorkspaceController::class, 'submit'])->middleware('throttle:10,1')->name('wordpress.submit');
        Route::put('code-lab/{lesson}/scratch', [ScratchWorkspaceController::class, 'save'])->name('scratch.save');
        Route::post('code-lab/{lesson}/scratch', [ScratchWorkspaceController::class, 'submit'])->name('scratch.submit');
        Route::put('code-lab/{lesson}/save', [CodeLabController::class, 'save'])->name('code-lab.save');
        Route::post('code-lab/{lesson}/check', [CodeLabController::class, 'check'])->name('code-lab.check');
        Route::post('code-lab/{lesson}/submit', [CodeLabController::class, 'submit'])->name('code-lab.submit');
        Route::post('code-lab/{lesson}/quiz', [CodeLabController::class, 'quiz'])->name('code-lab.quiz');
        Route::post('code-lab/{lesson}/ai', AiTutorController::class)->middleware('throttle:20,1')->name('code-lab.ai');
        Route::get('case-studies/{caseStudy}', [CaseStudyLabController::class, 'show'])->name('case-studies.show');
        Route::put('case-studies/{caseStudy}/save', [CaseStudyLabController::class, 'save'])->name('case-studies.save');
        Route::post('case-studies/{caseStudy}/submit', [CaseStudyLabController::class, 'submit'])->name('case-studies.submit');
    });

    Route::middleware('role:teacher')->group(function () {
        Route::put('courses/{course:slug}', [CourseController::class, 'update'])->name('courses.update');
        Route::post('courses/{course:slug}/assign', [CourseController::class, 'assign'])->name('courses.assign');
        Route::put('courses/{course:slug}/modules/{module}', [CourseController::class, 'module'])->name('courses.modules.update');
        Route::put('students/{student}/education', [CourseController::class, 'education'])->name('students.education');
        Route::get('lessons/{lesson}/edit', [LessonController::class, 'edit'])->name('lessons.edit');
        Route::put('lessons/{lesson}', [LessonController::class, 'update'])->name('lessons.update');
        Route::post('lessons', [LessonController::class, 'store'])->name('lessons.store');
        Route::delete('lessons/{lesson}', [LessonController::class, 'destroy'])->name('lessons.destroy');
        Route::get('students/education-review', [StudentController::class, 'educationReview'])->name('students.education-review');
        Route::get('students/import', [StudentImportController::class, 'index'])->name('students.import.index');
        Route::get('students/import/template', [StudentImportController::class, 'template'])->name('students.import.template');
        Route::post('students/import/preview', [StudentImportController::class, 'preview'])->middleware('throttle:10,1')->name('students.import.preview');
        Route::get('students/import/{token}', [StudentImportController::class, 'show'])->name('students.import.show');
        Route::post('students/import/{token}', [StudentImportController::class, 'store'])->middleware('throttle:10,1')->name('students.import.store');
        Route::get('students/import/{token}/errors', [StudentImportController::class, 'errors'])->name('students.import.errors');
        Route::resource('students', StudentController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::post('students/{student}/reset-password', [StudentController::class, 'resetPassword'])->middleware('throttle:10,1')->name('students.reset-password');
        Route::post('students/{student}/unlock/{lesson}', [StudentController::class, 'unlock'])->name('students.unlock');
        Route::get('submissions', [SubmissionController::class, 'index'])->name('submissions.index');
        Route::get('submissions/{submission}', [SubmissionController::class, 'show'])->name('submissions.show');
        Route::post('submissions/{submission}/review', [SubmissionController::class, 'review'])->name('submissions.review');
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/progress.csv', [ReportController::class, 'csv'])->name('reports.csv');
    });
});

require __DIR__.'/settings.php';
