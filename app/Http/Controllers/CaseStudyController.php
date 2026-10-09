<?php

namespace App\Http\Controllers;

use App\Models\CaseStudy;
use App\Models\Lesson;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CaseStudyController extends Controller
{
    public function index(Request $request): Response
    {
        $courseIds = app(CourseAccess::class)->visible($request->user())->pluck('id');
        $lessonGroups = Lesson::where('is_published', true)->where(fn ($q) => $q->whereIn('course_id', $courseIds)->orWhereNull('course_id'))
            ->get(['id', 'course_id'])->groupBy('course_id');
        $completed = $request->user()->lessonProgress()->where('status', 'completed')->pluck('lesson_id');
        $completeByCourse = $lessonGroups->map(fn ($lessons) => $lessons->every(fn ($lesson) => $completed->contains($lesson->id)));
        $lessonsComplete = $request->user()->role !== 'student' || $completeByCourse->every(fn ($complete) => $complete);
        $progress = DB::table('case_study_progress')->where('user_id', $request->user()->id)->get()->keyBy('case_study_id');
        $previousByCourse = [];
        $items = CaseStudy::where(fn ($q) => $q->whereIn('course_id', $courseIds)->orWhereNull('course_id'))->where('is_published', true)
            ->with('course:id,name,status')->orderBy('number')->get()->filter(fn ($case) => $request->user()->role !== 'student' || ! $case->course || $case->course->status === 'published')
            ->map(function ($case) use ($request, $progress, $completeByCourse, &$previousByCourse) {
                $p = $progress->get($case->id);
                $key = $case->course_id ?? '';
                $unlocked = $request->user()->role !== 'student' || ($previousByCourse[$key] ?? $completeByCourse->get($key, true));
                $status = $p->status ?? ($unlocked ? 'not_started' : 'locked');
                if ($request->user()->role === 'student') {
                    $previousByCourse[$key] = $status === 'completed';
                }

                return ['id' => $case->id, 'number' => $case->number, 'title' => $case->title, 'scenario' => $case->scenario, 'objectives' => $case->objectives,
                    'course' => $case->course?->name, 'status' => $status, 'unlocked' => $unlocked,
                    'url' => $request->user()->role === 'student' ? '/case-studies/'.$case->id : '/admin/projects?search='.urlencode($case->title)];
            });

        return Inertia::render('case-studies/index', ['caseStudies' => $items, 'lessonsComplete' => $lessonsComplete]);
    }
}
