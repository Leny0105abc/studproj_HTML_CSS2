<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AiTutorController;
use App\Http\Controllers\CaseStudyController;
use App\Http\Controllers\CaseStudyLabController;
use App\Http\Controllers\CodeLabController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LearnerProfileController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\PlatformDashboardController;
use App\Http\Controllers\PlatformReportController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubmissionController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CourseController::class, 'landing'])->name('home');
Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
Route::get('programs/{program:slug}', [CourseController::class, 'index'])->name('programs.show');

Route::middleware(['auth', 'verified', 'role:admin,teacher,student'])->group(function () {
    Route::get('learning-profile', [LearnerProfileController::class, 'edit'])->name('learner-profile.edit');
    Route::post('learning-profile', [LearnerProfileController::class, 'update'])->name('learner-profile.update');
    Route::get('learning-profile/picture', [LearnerProfileController::class, 'picture'])->name('learner-profile.picture');
    Route::get('my-courses', [CourseController::class, 'mine'])->name('courses.mine');
    Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');
    Route::get('courses/{course:slug}/{module}/{lesson:slug}', [CourseController::class, 'lesson'])->name('courses.lesson');
    Route::get('activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('lessons', [LessonController::class, 'index'])->name('lessons.index');
    Route::get('case-studies', [CaseStudyController::class, 'index'])->name('case-studies.index');

    Route::middleware('role:student')->group(function () {
        Route::get('learn/{lesson}', [LearningController::class, 'show'])->name('learning.show');
        Route::put('learn/{lesson}/save', [LearningController::class, 'save'])->name('learning.save');
        Route::post('learn/{lesson}/submit', [LearningController::class, 'submit'])->name('learning.submit');
        Route::post('learn/{lesson}/complete', [LearningController::class, 'complete'])->name('learning.complete');
        Route::post('learn/{lesson}/quiz', [LearningController::class, 'quiz'])->name('learning.quiz');
        Route::post('activities/{activity}/submit', [ActivityController::class, 'submit'])->name('activities.submit');
        Route::get('code-lab/{lesson}', [CodeLabController::class, 'show'])->name('code-lab.show');
        Route::put('code-lab/{lesson}/save', [CodeLabController::class, 'save'])->name('code-lab.save');
        Route::post('code-lab/{lesson}/check', [CodeLabController::class, 'check'])->name('code-lab.check');
        Route::post('code-lab/{lesson}/submit', [CodeLabController::class, 'submit'])->name('code-lab.submit');
        Route::post('code-lab/{lesson}/quiz', [CodeLabController::class, 'quiz'])->name('code-lab.quiz');
        Route::post('code-lab/{lesson}/ai', AiTutorController::class)->middleware('throttle:20,1')->name('code-lab.ai');
        Route::get('case-studies/{caseStudy}', [CaseStudyLabController::class, 'show'])->name('case-studies.show');
        Route::put('case-studies/{caseStudy}/save', [CaseStudyLabController::class, 'save'])->name('case-studies.save');
        Route::post('case-studies/{caseStudy}/submit', [CaseStudyLabController::class, 'submit'])->name('case-studies.submit');
    });

    Route::get('activity-files/{response}', [ActivityController::class, 'file'])->name('activities.file');
    Route::middleware('role:teacher,admin')->group(function () {
        Route::post('activity-responses/{response}/review', [ActivityController::class, 'review'])->name('activities.review');
        Route::get('admin', PlatformDashboardController::class)->middleware('can:platform-admin')->name('admin.dashboard');
        Route::get('admin/progress', [PlatformReportController::class, 'index'])->name('admin.progress');
        Route::get('admin/audit-log', [PlatformReportController::class, 'audit'])->middleware('can:platform-admin')->name('admin.audit');
        Route::post('admin/lessons/{lesson}/duplicate', [ManagementController::class, 'duplicate'])->name('admin.lessons.duplicate');
        Route::get('admin/{resource}', [ManagementController::class, 'index'])->name('admin.manage');
        Route::post('admin/{resource}', [ManagementController::class, 'store'])->name('admin.store');
        Route::put('admin/{resource}/{id}', [ManagementController::class, 'update'])->name('admin.update');
        Route::delete('admin/{resource}/{id}', [ManagementController::class, 'destroy'])->name('admin.destroy');
        Route::post('lessons', [LessonController::class, 'store'])->name('lessons.store');
        Route::delete('lessons/{lesson}', [LessonController::class, 'destroy'])->name('lessons.destroy');
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
