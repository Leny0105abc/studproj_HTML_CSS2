<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScratchWorkspaceController extends Controller
{
    public function save(Request $request, Lesson $lesson)
    {
        return $this->persist($request, $lesson, false);
    }

    public function submit(Request $request, Lesson $lesson)
    {
        return $this->persist($request, $lesson, true);
    }

    private function persist(Request $request, Lesson $lesson, bool $submit)
    {
        abort_unless($lesson->isScratch() && CourseAccess::unlocked($request->user(), $lesson), 403);
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'scratch_project_url' => [$submit ? 'required' : 'nullable', 'string', 'max:255', 'regex:~\Ahttps://scratch\.mit\.edu/projects/[1-9][0-9]{0,19}/?\z~'],
            'scratch_notes' => $submit ? 'required|string|min:20|max:10000' : 'nullable|string|max:10000',
        ]);
        $result = DB::transaction(function () use ($request, $lesson, $data, $submit) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->first();
            abort_unless($progress, 422, 'Start the lesson before saving.');
            abort_if($progress->status === 'completed', 403, 'Teacher-approved work is read-only.');
            if ($progress->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version' => 'A newer version exists. Refresh before saving or submitting.']);
            }
            $url = filled($data['scratch_project_url'] ?? null) ? rtrim($data['scratch_project_url'], '/').'/' : null;
            $notes = $data['scratch_notes'] ?? '';
            $changed = $progress->scratch_project_url !== $url || ($progress->scratch_notes ?? '') !== $notes;
            if ($changed || $submit) {
                Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->where('status', 'submitted')->update(['status' => 'superseded']);
            }
            $progress->update([
                'scratch_project_url' => $url, 'scratch_notes' => $notes, 'version' => $progress->version + 1,
                'last_saved_at' => now(), 'status' => $submit ? 'submitted' : ($changed ? 'in_progress' : $progress->status),
                'activity_passed_at' => $submit ? now() : ($changed ? null : $progress->activity_passed_at),
                'submitted_at' => $submit ? now() : $progress->submitted_at,
            ]);
            if ($submit) {
                $submission = Submission::create([
                    'user_id' => $request->user()->id, 'lesson_id' => $lesson->id,
                    'version' => Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->max('version') + 1,
                    'status' => 'submitted', 'scratch_project_url' => $url, 'scratch_notes' => $notes,
                    'html_code' => '', 'css_code' => '', 'submitted_at' => now(),
                ]);
            }
            ActivityLog::create([
                'user_id' => $request->user()->id, 'event' => $submit ? ($lesson->is_project ? 'project_submitted' : 'activity_submitted') : 'workspace_saved',
                'subject_type' => Lesson::class, 'subject_id' => $lesson->id,
                'metadata' => $submit ? ['submission_id' => $submission->id] : [], 'occurred_at' => now(),
            ]);

            return ['version' => $progress->version, 'status' => $progress->status];
        });

        return response()->json($result + ['message' => $submit ? 'Project submitted. Pass the quiz and wait for teacher review.' : 'Project link and notes saved.']);
    }
}
