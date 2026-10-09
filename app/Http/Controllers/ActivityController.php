<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityResponse;
use App\Services\CourseAccess;
use App\Services\LessonAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $courses = app(CourseAccess::class)->visible($request->user());
        if ($request->user()->role === 'student') {
            $courses->where('status', 'published');
        }
        $ids = $courses->pluck('id');
        $query = Activity::whereHas('lesson', fn ($q) => $q->whereIn('course_id', $ids)->where('is_published', true))->with('lesson.course', 'lesson.courseLevel');
        if ($request->user()->role === 'student') {
            $query->where('status', 'published')->with(['responses' => fn ($q) => $q->where('student_id', $request->user()->id)]);
        } else {
            $query->with('responses.student:id,name');
        }

        $activities = $query->paginate(20)->through(function ($activity) use ($request) {
            $activity->setAttribute('locked', $request->user()->role === 'student' && ! app(LessonAccess::class)->available($request->user(), $activity->lesson));
            if ($activity->locked) {
                $activity->instructions = 'Complete the prerequisite lesson to open this activity.';
            }

            return $activity;
        });

        return Inertia::render('activities/index', ['activities' => $activities, 'isManager' => $request->user()->role !== 'student']);
    }

    public function submit(Request $request, Activity $activity)
    {
        app(LessonAccess::class)->authorize($request->user(), $activity->lesson);
        abort_unless($activity->status === 'published', 404);
        $data = $request->validate(['answer' => 'required_without:file|nullable|string|max:50000',
            'file' => 'nullable|file|max:5120|mimes:pdf,txt,zip,png,jpg,jpeg']);
        $existing = $activity->responses()->where('student_id', $request->user()->id)->first();
        abort_if($existing?->status === 'completed', 403, 'This activity has already been reviewed.');
        $path = $request->file('file')?->store('activity-files', 'local');
        $activity->responses()->updateOrCreate(['student_id' => $request->user()->id], [
            'answer' => $data['answer'] ?? null, 'file_path' => $path ?? $existing?->file_path, 'status' => 'submitted',
            'score' => null, 'feedback' => null, 'reviewed_by' => null,
        ]);
        if ($path && $existing?->file_path) {
            Storage::disk('local')->delete($existing->file_path);
        }

        return back()->with('success', 'Activity submitted for review.');
    }

    public function review(Request $request, ActivityResponse $response)
    {
        Gate::authorize('update', $response->activity->lesson->course);
        $data = $request->validate(['status' => 'required|in:completed,needs_revision', 'score' => 'required|integer|min:0|max:'.$response->activity->points,
            'feedback' => 'nullable|string|max:5000']);
        $response->update($data + ['reviewed_by' => $request->user()->id]);

        return back()->with('success', 'Activity reviewed.');
    }

    public function file(Request $request, ActivityResponse $response)
    {
        if ($request->user()->id !== $response->student_id) {
            Gate::authorize('update', $response->activity->lesson->course);
        }
        abort_unless($response->file_path && Storage::disk('local')->exists($response->file_path), 404);

        return Storage::disk('local')->download($response->file_path);
    }
}
