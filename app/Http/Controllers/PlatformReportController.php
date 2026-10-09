<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlatformReportController extends Controller
{
    public function index(Request $request)
    {
        $courses = app(CourseAccess::class)->visible($request->user())->get(['id', 'name']);
        $query = CourseEnrollment::whereIn('course_id', $courses->pluck('id'))->with(['student.educationLevel', 'course']);
        if ($request->filled('course')) {
            $query->where('course_id', $request->integer('course'));
        }
        if ($request->filled('program')) {
            $query->whereHas('student', fn ($q) => $q->where('education_level_id', $request->integer('program')));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('search')) {
            $query->whereHas('student', fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'));
        }
        if ($request->filled('from')) {
            $request->validate(['from' => 'date']);
            $query->whereDate('enrolled_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $request->validate(['to' => 'date']);
            $query->whereDate('enrolled_at', '<=', $request->input('to'));
        }
        $records = $query->orderBy('id')->paginate(20)->withQueryString();
        $records->load(['course.lessons' => fn ($q) => $q->where('is_published', true), 'student.lessonProgress']);
        $records->through(function ($row) {
            $ids = $row->course->lessons->pluck('id');
            $progress = $row->student->lessonProgress->whereIn('lesson_id', $ids);
            $completed = $progress->where('status', 'completed')->count();
            $percent = $progress->filter(fn ($p) => $p->quiz_score !== null)->map(function ($p) use ($row) {
                $questions = count($row->course->lessons->firstWhere('id', $p->lesson_id)?->quiz ?? []);

                return $questions ? $p->quiz_score / $questions * 100 : null;
            })->filter(fn ($score) => $score !== null)->avg();

            return ['student' => $row->student->name, 'program' => $row->student->educationLevel?->name ?? 'High School',
                'course' => $row->course->name, 'status' => $row->status, 'completed' => $completed, 'total' => $ids->count(),
                'progress' => $ids->count() ? round($completed / $ids->count() * 100) : 0,
                'quiz_average' => $percent === null ? null : round($percent)];
        });

        return Inertia::render('platform/reports', ['records' => $records, 'courses' => $courses,
            'programs' => EducationLevel::all(['id', 'name']), 'filters' => $request->only('course', 'program', 'status', 'search', 'from', 'to')]);
    }

    public function audit()
    {
        return Inertia::render('platform/audit', ['records' => ActivityLog::with('user:id,name')->latest('occurred_at')->paginate(30)]);
    }
}
