<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Submission;
use App\Services\CourseAccess;
use App\Services\CourseProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return app(PlatformDashboardController::class)($request, app(CourseProgress::class));
        }

        if ($user->role === 'teacher') {
            $studentQuery = app(CourseAccess::class)->students($user);
            $courseIds = app(CourseAccess::class)->visible($user)->pluck('id');
            $courseLessons = Lesson::whereIn('course_id', $courseIds)->whereHas('course', fn ($q) => $q->where('slug', 'html-css'))->where('is_published', true)->orderBy('position')->get(['id', 'number', 'title', 'level']);
            $lessonIds = $courseLessons->pluck('id');
            $submissionQuery = Submission::where(fn ($q) => $q->whereHas('lesson', fn ($l) => $l->whereIn('course_id', $courseIds))
                ->orWhereHas('caseStudy', fn ($c) => $c->whereIn('course_id', $courseIds)));
            $students = (clone $studentQuery)->withCount([
                'lessonProgress as lessons_completed_count' => fn ($q) => $q->whereIn('lesson_id', $lessonIds)->where('status', 'completed'),
                'submissions as awaiting_review_count' => fn ($q) => $q->whereIn('lesson_id', $lessonIds)->where('status', 'submitted'),
            ])->with(['lessonProgress' => fn ($q) => $q->whereIn('lesson_id', $lessonIds)->select('id', 'user_id', 'lesson_id', 'status', 'quiz_score')])->latest('last_login_at')->take(8)->get();
            $lessonCount = max($courseLessons->count(), 1);

            return Inertia::render('dashboard', [
                'mode' => 'teacher',
                'summary' => [
                    'totalStudents' => (clone $studentQuery)->count(),
                    'activeStudents' => (clone $studentQuery)->where('status', 'active')->count(),
                    'averageProgress' => round($students->avg(fn ($student) => ($student->lessons_completed_count / $lessonCount) * 100) ?? 0),
                    'awaitingReview' => (clone $submissionQuery)->where('status', 'submitted')->count(),
                    'completedActivities' => (clone $submissionQuery)->where('status', 'completed')->count(),
                    'needsRevision' => (clone $submissionQuery)->where('status', 'needs_revision')->count(),
                ],
                'students' => $students->map(function ($student) use ($courseLessons, $lessonCount) {
                    $progress = $student->lessonProgress->keyBy('lesson_id');
                    $current = $courseLessons->first(fn ($lesson) => ($progress->get($lesson->id)?->status) !== 'completed');
                    $scores = $student->lessonProgress->pluck('quiz_score')->filter(fn ($score) => $score !== null);

                    return [
                        'id' => $student->id, 'name' => $student->name, 'username' => $student->username,
                        'grade' => $student->grade_level, 'section' => $student->section,
                        'completed' => $student->lessons_completed_count,
                        'awaitingReview' => $student->awaiting_review_count,
                        'progress' => round(($student->lessons_completed_count / $lessonCount) * 100),
                        'lastActivity' => optional($student->last_login_at)->diffForHumans() ?? 'Never',
                        'status' => $student->status,
                        'levelProgress' => collect(['Basic', 'Moderate', 'Advanced'])->mapWithKeys(fn ($level) => [
                            $level => $courseLessons->where('level', $level)->filter(fn ($lesson) => $progress->get($lesson->id)?->status === 'completed')->count(),
                        ]),
                        'currentLesson' => $current ? $current->level.' '.((($current->number - 1) % 5) + 1) : 'Course complete',
                        'quizAverage' => $scores->count() ? round($scores->avg() * 20) : null,
                        'finalProjectStatus' => $progress->get($courseLessons->firstWhere('number', 15)?->id)?->status ?? 'not_started',
                    ];
                }),
            ]);
        }

        $lessons = Lesson::where('is_published', true)->orderBy('position')->get();
        $progress = $user->lessonProgress()->get()->keyBy('lesson_id');
        $completed = $progress->where('status', 'completed')->count();
        $nextLesson = $lessons->first(fn ($lesson) => ($progress[$lesson->id]->status ?? 'not_started') !== 'completed');
        $caseCompleted = \DB::table('case_study_progress')->where('user_id', $user->id)->where('status', 'completed')->count();

        return Inertia::render('dashboard', [
            'mode' => 'student',
            'courses' => app(CourseProgress::class)->cards($user),
            'program' => $user->educationLevel?->name ?? 'High School',
            'summary' => [
                'progress' => $lessons->count() ? round(($completed / $lessons->count()) * 100) : 0,
                'completed' => $completed,
                'remaining' => max($lessons->count() - $completed, 0),
                'caseStudies' => $caseCompleted,
                'level' => $nextLesson?->level ?? 'Course complete',
                'lastActivity' => optional($user->activityLogs()->latest('occurred_at')->first()?->occurred_at)->diffForHumans() ?? 'Ready to begin',
            ],
            'nextLesson' => $nextLesson ? ['id' => $nextLesson->id, 'number' => $nextLesson->number, 'title' => $nextLesson->title, 'level' => $nextLesson->level] : null,
            'recentActivity' => $user->activityLogs()->latest('occurred_at')->take(5)->get(['event', 'metadata', 'occurred_at']),
            'teacherReviews' => Submission::where('user_id', $user->id)->whereNotNull('lesson_id')
                ->whereNotNull('reviewed_at')->with(['lesson:id,number,title', 'feedback.teacher:id,name'])
                ->latest('reviewed_at')->take(5)->get()->map(fn ($submission) => [
                    'id' => $submission->id, 'lesson' => $submission->lesson?->only('id', 'number', 'title'),
                    'status' => $submission->status, 'version' => $submission->version,
                    'reviewed_at' => $submission->reviewed_at,
                    'comment' => $submission->feedback->last()?->comment,
                    'teacher' => $submission->feedback->last()?->teacher?->name,
                ]),
        ]);
    }
}
