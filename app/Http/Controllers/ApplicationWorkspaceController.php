<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CaseStudy;
use App\Models\CourseEnrollment;
use App\Models\LearningEvidence;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Services\CourseAccess;
use App\Services\OfficeUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ApplicationWorkspaceController extends Controller
{
    public static function caseUnlocked($user, CaseStudy $case): bool
    {
        if (! $case->isApplication() || (! $case->is_published && $user->role !== 'teacher') || ! $case->course->accessibleTo($user)) {
            return false;
        }
        if ($user->role === 'teacher' || ! $case->course->sequential_gating) {
            return true;
        }
        $ids = Lesson::where('course_module_id', $case->course_module_id)->where('is_published', true)->pluck('id');

        return $ids->count() === 5 && $user->lessonProgress()->whereIn('lesson_id', $ids)->where('status', 'completed')->count() === $ids->count();
    }

    private function access(Request $request, Lesson|CaseStudy $subject): void
    {
        abort_unless($subject->isApplication(), 404);
        abort_unless($subject instanceof Lesson ? CourseAccess::unlocked($request->user(), $subject) : self::caseUnlocked($request->user(), $subject), 403, 'Complete the required lessons first.');
    }

    private function identity(Lesson|CaseStudy $subject): array
    {
        return [$subject instanceof Lesson ? 'student_lesson_progress' : 'case_study_progress', $subject instanceof Lesson ? 'lesson_id' : 'case_study_id'];
    }

    private function log(Request $request, $subject, string $event): void
    {
        ActivityLog::create(['user_id' => $request->user()->id, 'event' => $event, 'subject_type' => $subject::class, 'subject_id' => $subject->id, 'occurred_at' => now()]);
    }

    public function lesson(Request $request, Lesson $lesson)
    {
        return $this->show($request, $lesson);
    }

    public function caseStudy(Request $request, CaseStudy $caseStudy)
    {
        return $this->show($request, $caseStudy);
    }

    private function show(Request $request, Lesson|CaseStudy $subject)
    {
        $this->access($request, $subject);
        [$table,$key] = $this->identity($subject);
        $teacher = $request->user()->role === 'teacher';
        $query = DB::table($table)->where('user_id', $request->user()->id)->where($key, $subject->id);
        $progress = $teacher ? null : $query->first();
        if (! $teacher && ! $progress) {
            DB::table($table)->insert(['user_id' => $request->user()->id, $key => $subject->id, 'status' => 'in_progress', 'version' => 1, 'started_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            $progress = $query->first();
            $this->log($request, $subject, $subject instanceof Lesson ? 'lesson_started' : 'case_study_started');
            if ($subject instanceof Lesson && $request->user()->lessonProgress()->whereHas('lesson', fn ($q) => $q->where('course_module_id', $subject->course_module_id))->count() === 1) {
                $this->log($request, $subject, 'module_started');
            }
        }
        if (! $teacher) {
            if ($progress->status === 'not_started') {
                $query->update(['status' => 'in_progress', 'started_at' => $progress->started_at ?? now(), 'updated_at' => now()]);
                $progress = DB::table($table)->where('id', $progress->id)->first();
                $this->log($request, $subject, $subject instanceof Lesson ? 'lesson_started' : 'case_study_started');
            }
            $enrollment = CourseEnrollment::firstOrCreate(['user_id' => $request->user()->id, 'course_id' => $subject->course_id]);
            if (! $enrollment->started_at) {
                $enrollment->update(['started_at' => now()]);
                $this->log($request, $subject, 'course_started');
            }
        }
        $data = $subject->toArray();
        if ($subject instanceof Lesson) {
            $data['quiz'] = collect($subject->quiz ?? [])->map(fn ($q) => ['question' => $q['question'], 'choices' => $q['choices']])->all();
        }
        $next = $subject instanceof Lesson ? Lesson::where('course_id', $subject->course_id)->where('position', '>', $subject->position)->where('is_published', true)->orderBy('position')->first() : null;
        $cases = CaseStudy::where('course_id', $subject->course_id)->whereNotNull('application_content')->orderBy('number')->get()->map(fn ($c) => ['id' => $c->id, 'title' => $c->title, 'unlocked' => self::caseUnlocked($request->user(), $c)]);

        return Inertia::render('code-lab/application', ['audienceLabel' => $subject->course->audience_label, 'subject' => $data, 'isCase' => $subject instanceof CaseStudy, 'isTeacher' => $teacher, 'workspace' => json_decode($progress->application_workspace ?? '{}', true), 'version' => $progress->version ?? 1, 'status' => $progress->status ?? 'preview', 'demonstrations' => $subject instanceof Lesson ? $subject->demonstrations()->when(! $teacher, fn ($q) => $q->where('status', 'published'))->get() : [], 'nextLesson' => $next ? ['id' => $next->id, 'title' => $next->title, 'unlocked' => CourseAccess::unlocked($request->user(), $next)] : null, 'caseStudies' => $cases, 'latestSubmission' => $teacher ? null : Submission::where('user_id', $request->user()->id)->where($key, $subject->id)->with('feedback')->latest('version')->first()]);
    }

    public function saveLesson(Request $request, Lesson $lesson)
    {
        return $this->persist($request, $lesson);
    }

    public function saveCase(Request $request, CaseStudy $caseStudy)
    {
        return $this->persist($request, $caseStudy);
    }

    private function persist(Request $request, Lesson|CaseStudy $subject)
    {
        $this->access($request, $subject);
        [$table,$key] = $this->identity($subject);
        foreach (['evidence_ids', 'mastery'] as $json) {
            if (is_string($request->input($json))) {
                $request->merge([$json => json_decode($request->input($json), true)]);
            }
        }
        $data = $request->validate(['version' => 'required|integer|min:1', 'submit' => 'required|boolean', 'notes' => 'nullable|string|max:20000', 'evidence_ids' => 'present|array|max:8', 'evidence_ids.*' => 'required|uuid|distinct', 'mastery' => 'present|array|list|size:4', 'mastery.*' => 'required|boolean', 'files' => 'nullable|array|max:8', 'files.*' => 'required|file|max:10240']);
        $owned = LearningEvidence::where('user_id', $request->user()->id)->where($key, $subject->id)->whereIn('id', $data['evidence_ids'])->get();
        if ($owned->count() !== count($data['evidence_ids']) || $owned->count() + count($request->file('files', [])) > 8) {
            throw ValidationException::withMessages(['evidence_ids' => 'Use at most eight files belonging to you and this activity.']);
        }
        foreach ($request->file('files', []) as $file) {
            OfficeUpload::validate($file, $subject->application_content['allowed_uploads'] ?? ['docx', 'pdf']);
        }
        $paths = [];
        try {
            $result = DB::transaction(function () use ($request, $subject, $table, $key, $data, $owned, &$paths) {
                $query = DB::table($table)->where('user_id', $request->user()->id)->where($key, $subject->id);
                $p = $query->lockForUpdate()->first();
                abort_unless($p, 422, 'Open the activity first.');
                if ($subject instanceof Lesson && ! $p->last_saved_at) {
                    $this->log($request, $subject, 'exercise_started');
                }
                if ($p->version !== (int) $data['version']) {
                    throw ValidationException::withMessages(['version' => 'A newer save exists. Refresh this page.']);
                }
                $latest = Submission::where('user_id', $request->user()->id)->where($key, $subject->id)->latest('version')->first();
                abort_if($latest?->reviewed_at && $latest->status === 'completed', 403, 'Teacher-approved work is read-only.');
                $state = json_decode($p->application_workspace ?? '{}', true);
                $files = $owned->map(fn ($f) => $f->only('id', 'name', 'mime', 'size'))->all();
                foreach ($request->file('files', []) as $file) {
                    $path = $file->store('learning-evidence', 'local');
                    if (! $path) {
                        throw new \RuntimeException('File storage failed.');
                    }$paths[] = $path;
                    $record = LearningEvidence::create(['id' => (string) Str::uuid(), 'user_id' => $request->user()->id, $key => $subject->id, 'path' => $path, 'name' => Str::limit(preg_replace('/[^\pL\pN ._()-]/u', '_', basename($file->getClientOriginalName())), 180, ''), 'mime' => $file->getMimeType(), 'size' => $file->getSize()]);
                    $files[] = $record->only('id', 'name', 'mime', 'size');
                }
                if ($data['submit']) {
                    $required = $subject instanceof Lesson ? $subject->demonstrations()->where('status', 'published')->where('is_required', true)->pluck('id')->all() : [];
                    if (! $files || ! ($state['content_viewed'] ?? false) || array_diff($required, $state['demonstrations_viewed'] ?? []) || count(array_filter($data['mastery'])) !== 4 || mb_strlen(trim($data['notes'] ?? '')) < 20) {
                        throw ValidationException::withMessages(['submit' => 'Read the lesson, view required demonstrations, complete all four self-checks, attach your document and write at least 20 characters of reflection.']);
                    }
                }
                $state = array_merge($state, ['notes' => $data['notes'] ?? '', 'files' => $files, 'mastery' => $data['mastery']]);
                Submission::where('user_id', $request->user()->id)->where($key, $subject->id)->whereNull('reviewed_at')->update(['status' => 'superseded']);
                $complete = $data['submit'] && $subject instanceof Lesson && (bool) $p->quiz_passed_at;
                $values = ['application_workspace' => json_encode($state), 'status' => $complete ? 'completed' : ($data['submit'] ? 'submitted' : 'in_progress'), 'version' => $p->version + 1, 'last_saved_at' => now(), 'completed_at' => $complete ? now() : null, 'updated_at' => now()];
                if ($subject instanceof Lesson) {
                    $values['activity_passed_at'] = $data['submit'] ? now() : null;
                }
                if ($data['submit']) {
                    $values['submitted_at'] = now();
                }
                $query->update($values);
                if ($data['submit']) {
                    Submission::create(['user_id' => $request->user()->id, $key => $subject->id, 'version' => ($latest?->version ?? 0) + 1, 'status' => $complete ? 'completed' : 'submitted', 'application_workspace' => $state, 'html_code' => '', 'css_code' => '', 'submitted_at' => now()]);
                }
                $this->log($request, $subject, $data['submit'] ? ($subject instanceof Lesson ? 'exercise_submitted' : 'case_study_submitted') : 'workspace_saved');
                if ($complete) {
                    $this->log($request, $subject, 'lesson_completed');
                }

                return ['version' => $p->version + 1, 'workspace' => $state, 'status' => $values['status'], 'message' => $complete ? 'Great work. You are ready for the next lesson.' : ($data['submit'] ? 'Submitted. Complete the Quick Check; case studies receive teacher grading.' : 'Draft saved.')];
            });
        } catch (\Throwable $e) {
            foreach ($paths as $path) {
                Storage::disk('local')->delete($path);
            }throw $e;
        }

        return response()->json($result);
    }

    public function viewed(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $data = $request->validate(['demonstration_id' => 'nullable|integer']);
        $demo = isset($data['demonstration_id']) ? $lesson->demonstrations()->where('status', 'published')->findOrFail($data['demonstration_id']) : null;
        DB::transaction(function () use ($request, $lesson, $demo) {
            $p = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $state = $p->application_workspace ?? [];
            if ($demo) {
                $state['demonstrations_viewed'] = array_values(array_unique([...($state['demonstrations_viewed'] ?? []), $demo->id]));
            } else {
                $state['content_viewed'] = true;
            }
            $p->update(['application_workspace' => $state]);
            $this->log($request, $lesson, $demo ? 'demonstration_viewed' : 'lesson_content_viewed');
        });

        return response()->json(['message' => 'Learning checkpoint recorded.']);
    }

    public function caseViewed(Request $request, CaseStudy $caseStudy)
    {
        $this->access($request, $caseStudy);
        DB::transaction(function () use ($request, $caseStudy) {
            $q = DB::table('case_study_progress')->where('user_id', $request->user()->id)->where('case_study_id', $caseStudy->id);
            $p = $q->lockForUpdate()->first();
            abort_unless($p, 422);
            $s = json_decode($p->application_workspace ?? '{}', true);
            $s['content_viewed'] = true;
            $q->update(['application_workspace' => json_encode($s)]);
        });

        return response()->json(['message' => 'Case study brief read.']);
    }

    public function quiz(Request $request, Lesson $lesson)
    {
        $this->access($request, $lesson);
        $questions = $lesson->quiz ?? [];
        abort_unless(count($questions) === 5, 404);
        abort_if(Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->where('status', 'completed')->whereNotNull('reviewed_at')->exists(), 403, 'Teacher-approved work is read-only.');
        $data = $request->validate(['answers' => 'required|array|list|size:5', 'answers.*' => 'required|integer|between:0,3']);
        $score = collect($questions)->filter(fn ($q, $i) => $q['answer'] === $data['answers'][$i])->count();
        DB::transaction(function () use ($request, $lesson, $score, $data) {
            $p = StudentLessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->lockForUpdate()->firstOrFail();
            $passed = $score >= 4 || $p->quiz_passed_at;
            $complete = $passed && $p->activity_passed_at;
            $p->update(['quiz_score' => $score, 'quiz_answers' => $data['answers'], 'quiz_passed_at' => $passed ? ($p->quiz_passed_at ?? now()) : null, 'status' => $complete ? 'completed' : $p->status, 'completed_at' => $complete ? ($p->completed_at ?? now()) : null]);
            $this->log($request, $lesson, 'quick_check_completed');
            if ($complete) {
                Submission::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->where('status', 'submitted')->update(['status' => 'completed']);
                $this->log($request, $lesson, 'lesson_completed');
            }
        });

        return response()->json(['score' => $score, 'total' => 5, 'passed' => $score >= 4, 'feedback' => collect($questions)->map(fn ($q, $i) => ['correct' => $q['answer'] === $data['answers'][$i], 'explanation' => $q['explanation']]), 'message' => $score >= 4 ? 'Quick Check passed. Submit your exercise to finish.' : 'Review the demonstration and try the activity again.']);
    }

    public function download(Request $request, LearningEvidence $evidence)
    {
        $subject = $evidence->lesson ?? $evidence->caseStudy;
        abort_unless($subject && $subject->isApplication(), 404);
        abort_unless($request->user()->role === 'teacher' || ($evidence->user_id === $request->user()->id && $subject->course->accessibleTo($request->user())), 403);
        abort_unless(Storage::disk('local')->exists($evidence->path), 404);

        return Storage::disk('local')->download($evidence->path, $evidence->name, ['Content-Type' => 'application/octet-stream', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store', 'Content-Security-Policy' => "sandbox; default-src 'none'"]);
    }
}
