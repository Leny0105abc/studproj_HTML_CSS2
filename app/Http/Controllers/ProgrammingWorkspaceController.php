<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Services\CourseAccess;
use App\Services\JavaSandbox;
use App\Services\ProgrammingFlowchart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProgrammingWorkspaceController extends Controller
{
    private function access(Request $request, Lesson $lesson, bool $edit = false): void
    {
        abort_unless($lesson->isProgramming() && CourseAccess::unlocked($request->user(), $lesson), 403);
        if ($edit) {
            abort_if(Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)
                ->where('status', 'completed')->whereNotNull('reviewed_at')->whereNotNull('reviewed_by')->exists(), 403, 'Your teacher completed this lesson. It is read-only.');
        }
    }

    public function show(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        CourseEnrollment::firstOrCreate(['user_id' => $request->user()->id, 'course_id' => $lesson->course_id], ['started_at' => now()]);
        $progress = StudentLessonProgress::firstOrCreate(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id], ['status' => 'in_progress', 'started_at' => now()])->refresh();
        $key = 'programming_quiz.'.$lesson->id;
        $order = $request->session()->get($key);
        if (! $order || count($order) !== count($lesson->quiz)) {
            $order = collect(array_keys($lesson->quiz))->shuffle()->map(fn ($i) => ['question' => $i, 'choices' => collect(range(0, 3))->shuffle()->all()])->all();
            $request->session()->put($key, $order);
        }
        $data = $lesson->toArray();
        $data['quiz'] = array_map(fn ($entry) => ['question' => $lesson->quiz[$entry['question']]['question'], 'choices' => array_map(fn ($i) => $lesson->quiz[$entry['question']]['choices'][$i], $entry['choices'])], $order);
        $next = $lesson->course->lessons()->where('position', '>', $lesson->position)->where('is_published', true)->first();
        $previous = $lesson->course->lessons()->reorder('position', 'desc')->where('position', '<', $lesson->position)->where('is_published', true)->first();

        return Inertia::render('code-lab/programming', [
            'lesson' => $data,
            'initialPrograms' => app(ProgrammingFlowchart::class)->generate($lesson->programming_content['graph']),
            'workspace' => $progress->only('programming_workspace', 'version', 'status', 'quiz_score', 'quiz_passed_at'),
            'readOnly' => Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->where('status', 'completed')->whereNotNull('reviewed_at')->whereNotNull('reviewed_by')->exists(),
            'feedback' => Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->with('feedback.teacher:id,name')->latest('version')->first(),
            'nextLesson' => $next ? ['id' => $next->id, 'title' => $next->title, 'unlocked' => CourseAccess::unlocked($request->user(), $next)] : null,
            'previousLesson' => $previous?->only('id', 'title'),
            'javaExecutionAvailable' => JavaSandbox::available(),
        ]);
    }

    public function generate(Request $request, Lesson $lesson, ProgrammingFlowchart $flowchart)
    {
        $this->access($request, $lesson);
        $data = $request->validate(['graph' => 'required|array']);
        abort_if(strlen(json_encode($data)) > 150000, 422, 'Graph is too large.');
        try {
            return response()->json(['programs' => $flowchart->generate($data['graph'])]);
        } catch (\InvalidArgumentException|\TypeError $error) {
            return response()->json(['message' => $error instanceof \TypeError ? 'Malformed structured configuration.' : $error->getMessage()], 422);
        }
    }

    public function save(Request $request, Lesson $lesson, ProgrammingFlowchart $flowchart)
    {
        return $this->persist($request, $lesson, $flowchart, false);
    }

    public function submit(Request $request, Lesson $lesson, ProgrammingFlowchart $flowchart)
    {
        return $this->persist($request, $lesson, $flowchart, true);
    }

    private function persist(Request $request, Lesson $lesson, ProgrammingFlowchart $flowchart, bool $submit)
    {
        $this->access($request, $lesson, true);
        // Global request trimming must not change source indentation, trailing newlines,
        // empty drafts, or blank input lines. Restore this bounded payload before validation.
        if ($request->isJson()) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw) && isset($raw['workspace']) && is_array($raw['workspace'])) {
                $request->merge(['workspace' => $raw['workspace']]);
            }
        }
        $data = $request->validate([
            'version' => 'required|integer|min:1', 'workspace' => 'required|array',
            'workspace.graph' => 'required|array', 'workspace.codes' => 'required|array:python,cpp,java',
            'workspace.codes.python' => 'present|string|max:200000', 'workspace.codes.cpp' => 'present|string|max:200000', 'workspace.codes.java' => 'present|string|max:200000',
            'workspace.input' => 'present|nullable|string|max:20000', 'workspace.analysis' => 'present|nullable|string|max:20000',
            'workspace.algorithm' => 'present|nullable|string|max:20000', 'workspace.pseudocode' => 'present|nullable|string|max:20000',
            'workspace.documentation' => 'sometimes|nullable|string|max:20000', 'workspace.test_notes' => 'present|nullable|string|max:20000', 'workspace.mode' => 'required|in:learn,guided,challenge',
        ]);
        abort_if(strlen(json_encode($data['workspace'])) > 800000, 422, 'Workspace is too large.');
        $work = array_intersect_key($data['workspace'], array_flip(['graph', 'codes', 'input', 'analysis', 'algorithm', 'pseudocode', 'test_notes', 'documentation', 'mode']));
        try {
            $flowchart->validateShape($work['graph']);
        } catch (\InvalidArgumentException $error) {
            throw ValidationException::withMessages(['graph' => $error->getMessage()]);
        }
        if ($submit) {
            try {
                $flowchart->validate($work['graph']);
            } catch (\InvalidArgumentException|\TypeError $error) {
                throw ValidationException::withMessages(['graph' => $error instanceof \TypeError ? 'Malformed graph.' : $error->getMessage()]);
            }
            foreach (array_merge(['analysis', 'algorithm', 'pseudocode', 'test_notes'], ($lesson->programming_content['number'] ?? 0) === 30 ? ['documentation'] : []) as $field) {
                if (! trim($work[$field] ?? '')) {
                    throw ValidationException::withMessages([$field => 'Complete the analysis, algorithm, pseudocode, and test notes before submitting.']);
                }
            }
            foreach ($work['codes'] as $code) {
                if (! trim($code)) {
                    throw ValidationException::withMessages(['codes' => 'Include a program in each of the three languages.']);
                }
            }
        }
        $progress = DB::transaction(function () use ($request, $lesson, $data, $work, $submit) {
            $progress = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $this->access($request, $lesson, true);
            if ($progress->version !== $data['version']) {
                throw ValidationException::withMessages(['version' => 'A newer save exists. Reload before saving.']);
            }
            if ($progress->programming_workspace !== $work || $submit) {
                Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->whereIn('status', ['submitted', 'quiz_pending', 'needs_revision'])->update(['status' => 'superseded']);
            }
            $fields = ['programming_workspace' => $work, 'python_code' => $work['codes']['python'], 'cpp_code' => $work['codes']['cpp'], 'java_code' => $work['codes']['java'], 'html_code' => $work['codes']['python'], 'program_input' => $work['input'] ?? '', 'last_saved_at' => now(), 'version' => $progress->version + 1];
            if ($submit) {
                $fields += ['status' => 'submitted', 'submitted_at' => now(), 'activity_passed_at' => now()];
                Submission::create(array_diff_key($fields, array_flip(['last_saved_at', 'activity_passed_at', 'version'])) + [
                    'user_id' => $request->user()->id, 'lesson_id' => $lesson->id, 'css_code' => '',
                    'version' => (Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->max('version') ?? 0) + 1,
                ]);
            }
            $progress->update($fields);
            ActivityLog::create(['user_id' => $request->user()->id, 'event' => $submit ? ($lesson->is_project ? 'project_submitted' : 'activity_submitted') : 'workspace_saved', 'subject_type' => Lesson::class, 'subject_id' => $lesson->id, 'metadata' => ['course_id' => $lesson->course_id], 'occurred_at' => now()]);

            return $progress->fresh();
        });

        return response()->json(['version' => $progress->version, 'message' => $submit ? 'Submitted for teacher review. Pass the quiz and receive teacher approval to complete the lesson.' : 'Workspace saved.']);
    }
}
