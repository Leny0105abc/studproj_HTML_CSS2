<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Services\CourseAccess;
use App\Services\CourseProgress;
use App\Services\LessonAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function landing()
    {
        return Inertia::render('platform/landing', [
            'programs' => EducationLevel::where('status', 'published')->with(['courses' => fn ($q) => $q->where('status', 'published')])->orderBy('display_order')->get(),
            'featured' => Course::where('status', 'published')->where('is_featured', true)->with('educationLevels')->orderBy('display_order')->get(),
        ]);
    }

    public function index(Request $request, ?EducationLevel $program = null)
    {
        abort_if($program && $program->status !== 'published', 404);
        $query = $request->user() ? app(CourseAccess::class)->visible($request->user()) : Course::where('status', 'published')
            ->whereHas('educationLevels', fn ($q) => $q->where('status', 'published'));
        if ($program) {
            $query->whereHas('educationLevels', fn ($q) => $q->whereKey($program->id));
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where('name', 'like', '%'.$search.'%');
        }

        return Inertia::render('courses/index', [
            'courses' => $query->with('educationLevels')->withCount(['lessons' => fn ($q) => $q->where('is_published', true)])->orderBy('display_order')->paginate(12)->withQueryString(),
            'programs' => EducationLevel::where('status', 'published')->orderBy('display_order')->get(['id', 'name', 'slug', 'description']),
            'program' => $program, 'search' => $search,
        ]);
    }

    public function mine(Request $request, CourseProgress $progress)
    {
        return Inertia::render('courses/mine', ['courses' => $progress->cards($request->user())]);
    }

    public function show(Request $request, Course $course, LessonAccess $access)
    {
        Gate::authorize('view', $course);
        app(CourseAccess::class)->enroll($request->user(), $course);
        $course->load('educationLevels', 'levels');
        $progress = $request->user()->lessonProgress()->get()->keyBy('lesson_id');
        $items = $course->lessons()->where('is_published', true)->with('course', 'courseLevel')
            ->where(fn ($q) => $q->whereNull('course_level_id')->orWhereHas('courseLevel', fn ($l) => $l->where('status', 'published')))->get()->map(fn (Lesson $lesson) => [
                'id' => $lesson->id, 'title' => $lesson->title, 'module_id' => $lesson->course_level_id,
                'status' => $progress->get($lesson->id)?->status ?? 'not_started',
                'unlocked' => $access->available($request->user(), $lesson),
                'url' => $request->user()->role !== 'student' ? '/admin/lessons?search='.urlencode($lesson->title) :
                    ($lesson->usesLegacyLab() ? '/code-lab/'.$lesson->id : '/learn/'.$lesson->id),
                'estimated_minutes' => $lesson->estimated_minutes,
            ]);

        return Inertia::render('courses/show', [
            'course' => $course, 'lessons' => $items, 'completed' => $items->where('status', 'completed')->count(),
            'projects' => $course->projects()->where('is_published', true)->get(['id', 'title', 'scenario']),
            'canManage' => Gate::allows('update', $course),
        ]);
    }

    public function lesson(Request $request, Course $course, string $module, Lesson $lesson)
    {
        abort_unless($lesson->course_id === $course->id && $lesson->courseLevel?->slug === $module, 404);
        app(LessonAccess::class)->authorize($request->user(), $lesson);

        return redirect($lesson->usesLegacyLab() ? '/code-lab/'.$lesson->id : '/learn/'.$lesson->id);
    }
}
