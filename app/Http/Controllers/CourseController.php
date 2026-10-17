<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $progress = $request->user()->lessonProgress()->where('status', 'completed')->pluck('lesson_id');

        return Inertia::render('courses/index', ['courses' => Course::with('educationLevel')->inLearningOrder($request->user())->get()->filter(fn ($c) => $c->accessibleTo($request->user()))->values()->map(function ($course) use ($progress) {
            $ids = $course->lessons()->where('is_published', true)->pluck('id');

            return $course->toArray() + ['total' => $ids->count(), 'completed' => $ids->intersect($progress)->count()];
        }), 'isTeacher' => $request->user()->role === 'teacher', 'isCollegeStudent' => $request->user()->role === 'student' && $request->user()->educationLevel?->slug === 'college']);
    }

    public function show(Request $request, Course $course)
    {
        abort_unless($course->accessibleTo($request->user()), 403);

        return app(LessonController::class)->index($request, $course);
    }

    public function update(Request $request, Course $course)
    {
        $course->update($request->validate(['name' => 'required|string|max:150', 'description' => 'required|string|max:5000', 'is_published' => 'required|boolean', 'sequential_gating' => 'required|boolean', 'category' => 'sometimes|nullable|string|max:150', 'recommended_prerequisites' => 'sometimes|nullable|string|max:2000']));

        return back()->with('success', 'Course settings saved.');
    }

    public function assign(Request $request, Course $course)
    {
        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        $student = User::findOrFail($data['user_id']);
        abort_unless($student->role === 'student', 422);
        if (! $course->compatibleWith($student)) {
            throw ValidationException::withMessages(['user_id' => 'Assign an education level and choose a course compatible with that level.']);
        }
        CourseEnrollment::firstOrCreate(['user_id' => $student->id, 'course_id' => $course->id]);

        return back()->with('success', 'Course assigned.');
    }

    public function education(Request $request, User $student)
    {
        return app(StudentController::class)->education($request, $student);
    }

    public function assessment(Request $request, Course $course, CourseModule $module)
    {
        abort_unless($course->accessibleTo($request->user()) && $module->course_id === $course->id, 403);
        $ids = $course->lessons()->where('course_module_id', $module->id)->where('is_published', true)->pluck('id');
        abort_unless($ids->count() && $request->user()->lessonProgress()->whereIn('lesson_id', $ids)->where('status', 'completed')->count() === $ids->count(), 403, 'Complete this module before taking its assessment.');
        $questions = $module->assessment ?? [];
        abort_unless(count($questions), 404);
        $data = $request->validate(['answers' => 'required|array|size:'.count($questions), 'answers.*' => 'required|integer|between:0,3']);
        $score = collect($questions)->filter(fn ($q, $i) => $q['answer'] === $data['answers'][$i])->count();
        \DB::transaction(function () use ($request, $course, $module, $score, $questions) {
            CourseEnrollment::firstOrCreate(['user_id' => $request->user()->id, 'course_id' => $course->id]);
            $enrollment = CourseEnrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->lockForUpdate()->firstOrFail();
            $results = $enrollment->assessment_results ?? [];
            $results[$module->id] = ['score' => $score, 'total' => count($questions), 'passed' => $score >= ceil(count($questions) * .8), 'submitted_at' => now()->toIso8601String()];
            $enrollment->update(['assessment_results' => $results]);
        });

        return back()->with('success', "Assessment score: {$score}/".count($questions));
    }

    public function module(Request $request, Course $course, CourseModule $module)
    {
        abort_unless($module->course_id === $course->id, 404);
        $data = $request->validate(['name' => ['required', Rule::in($course->modules()->pluck('name')->all())], 'position' => 'required|integer|min:1|max:'.$course->modules()->count(), 'assessment' => 'nullable|array|max:25', 'assessment.*.question' => 'required|string', 'assessment.*.choices' => 'required|array|size:4', 'assessment.*.choices.*' => 'required|string', 'assessment.*.answer' => 'required|integer|between:0,3', 'assessment.*.explanation' => 'required|string']);
        $reordering = (int) $module->position !== (int) $data['position'];
        \DB::transaction(function () use ($course, $module, $data, $reordering) {
            $modules = $course->modules()->lockForUpdate()->get()->reject(fn ($m) => $m->id === $module->id)->values();
            $modules->splice($data['position'] - 1, 0, [$module]);
            foreach ($modules as $index => $item) {
                $item->update(['position' => $index + 1]);
            }
            $module->update(Arr::except($data, ['position']));
            // Keep the lesson sequence aligned with the configurable module sequence.
            if ($reordering) {
                $ordered = $modules->flatMap(fn ($item) => $course->lessons()->where('course_module_id', $item->id)->get())->values();
                $positions = $ordered->mapWithKeys(fn ($lesson, $index) => [$lesson->id => $index + 1]);
                foreach ($ordered as $lesson) {
                    if ($lesson->prerequisite_id && $positions->get($lesson->prerequisite_id, PHP_INT_MAX) >= $positions->get($lesson->id)) {
                        throw ValidationException::withMessages(['position' => 'This order conflicts with an explicit prerequisite. Edit that prerequisite first.']);
                    }
                    $lesson->update(['position' => $positions->get($lesson->id)]);
                }
            }
        });

        return back()->with('success', 'Module saved.');
    }
}
