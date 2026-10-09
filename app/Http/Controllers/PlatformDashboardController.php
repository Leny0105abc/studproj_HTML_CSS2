<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\User;
use App\Services\CourseAccess;
use App\Services\CourseProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlatformDashboardController extends Controller
{
    public function __invoke(Request $request, CourseProgress $progress)
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return Inertia::render('platform/admin-dashboard', [
                'stats' => [
                    'Students' => User::where('role', 'student')->count(),
                    'Active students' => User::where('role', 'student')->where('status', 'active')->count(),
                    'Courses' => Course::count(), 'Published courses' => Course::where('status', 'published')->count(),
                    'Lessons' => Lesson::count(), 'Activities' => Activity::count(),
                    'Completed courses' => CourseEnrollment::where('status', 'completed')->count(),
                ],
                'programs' => EducationLevel::withCount(['courses'])->get()->map(fn ($level) => [
                    'name' => $level->name, 'students' => User::where('role', 'student')->where('education_level_id', $level->id)->count(),
                    'courses' => $level->courses_count,
                ]),
                'audit' => ActivityLog::with('user:id,name')->latest('occurred_at')->limit(12)->get(),
            ]);
        }
        $cards = $progress->cards($user);
        $ids = app(CourseAccess::class)->visible($user)->where('status', 'published')->pluck('id');

        return Inertia::render('platform/student-dashboard', [
            'courses' => $cards,
            'recentLessons' => $user->lessonProgress()->whereNotNull('last_accessed_at')->whereHas('lesson', fn ($q) => $q->whereIn('course_id', $ids))
                ->with('lesson:id,title,course_id')->latest('last_accessed_at')->limit(5)->get(),
            'achievements' => $user->achievements()->where('status', 'published')->get(['achievements.id', 'title', 'description']),
            'announcements' => Announcement::where('status', 'published')->where(fn ($q) => $q->whereNull('course_id')->orWhereIn('course_id', $ids))->latest()->limit(5)->get(),
            'reviews' => $user->submissions()->whereNotNull('reviewed_at')->with('lesson:id,title', 'feedback.teacher:id,name')->latest('reviewed_at')->limit(5)->get(),
        ]);
    }
}
