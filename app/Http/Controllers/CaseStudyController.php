<?php

namespace App\Http\Controllers;

use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CaseStudyController extends Controller
{
    public function index(Request $request): Response
    {
        $htmlCourse = Course::where('slug', 'html-css')->first();
        $allowed = $request->user()->role === 'teacher' || $htmlCourse?->accessibleTo($request->user());
        $htmlLessons = Lesson::where('is_published', true)->where(fn ($q) => $q->where('course_id', $htmlCourse?->id)->orWhereNull('course_id'))->pluck('id');
        $lessonsComplete = $allowed && ($request->user()->role === 'teacher' || $request->user()->lessonProgress()->whereIn('lesson_id', $htmlLessons)->where('status', 'completed')->count() >= $htmlLessons->count());
        $progress = DB::table('case_study_progress')->where('user_id', $request->user()->id)->get()->keyBy('case_study_id');
        $previousComplete = $lessonsComplete;
        $items = CaseStudy::whereNull('course_id')->where('is_published', true)->when(! $allowed, fn ($q) => $q->whereRaw('1 = 0'))->orderBy('number')->get()->map(function ($case) use ($request, $progress, &$previousComplete) {
            $p = $progress->get($case->id);
            $unlocked = $request->user()->role === 'teacher' || $previousComplete;
            $status = $p->status ?? ($unlocked ? 'not_started' : 'locked');
            if ($request->user()->role === 'student') {
                $previousComplete = $status === 'completed';
            }

            return ['id' => $case->id, 'number' => $case->number, 'title' => $case->title, 'scenario' => $case->scenario, 'objectives' => $case->objectives, 'status' => $status, 'unlocked' => $unlocked];
        });

        $applicationCases = CaseStudy::with('course')->whereNotNull('application_content')->where('is_published', true)->orderBy('number')->get()->filter(fn ($c) => $c->course?->accessibleTo($request->user()))->map(fn ($c) => ['id' => $c->id, 'number' => $c->number, 'title' => $c->title, 'scenario' => $c->scenario, 'objectives' => $c->objectives, 'unlocked' => ApplicationWorkspaceController::caseUnlocked($request->user(), $c), 'status' => $progress->get($c->id)?->status ?? 'not_started', 'href' => '/application-case-studies/'.$c->id]);

        return Inertia::render('case-studies/index', ['caseStudies' => $items->concat($applicationCases)->values(), 'lessonsComplete' => $lessonsComplete]);
    }
}
