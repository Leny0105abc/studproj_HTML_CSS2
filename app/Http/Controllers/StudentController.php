<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use App\Services\CourseAccess;
use App\Services\StudentAccountService;
use App\Services\StudentEducation;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function educationReview()
    {
        $students = User::where('role', 'student')->with('educationLevel')->get()->keyBy('id');
        $courses = Course::with(['educationLevel', 'educationLevels'])->get()->keyBy('id');
        $mismatches = CourseEnrollment::all()->filter(fn ($enrollment) => isset($students[$enrollment->user_id], $courses[$enrollment->course_id]) && ! $courses[$enrollment->course_id]->compatibleWith($students[$enrollment->user_id]))
            ->map(fn ($enrollment) => ['id' => $enrollment->id, 'studentId' => $enrollment->user_id, 'student' => $students[$enrollment->user_id]->name, 'level' => $students[$enrollment->user_id]->educationLevelName(), 'course' => $courses[$enrollment->course_id]->name, 'courseLevel' => $courses[$enrollment->course_id]->audience_label])->values();

        return Inertia::render('students/education-review', ['unclassified' => $students->filter(fn ($user) => ! $user->educationLevel || ! in_array($user->educationLevel->slug, ['high-school', 'college'], true))->values()->map->only(['id', 'name', 'username', 'grade_level', 'section']), 'mismatches' => $mismatches]);
    }

    public function index(Request $request): Response
    {
        $query = User::where('role', 'student')->with('educationLevel')->withCount([
            'lessonProgress as completed_count' => fn ($q) => $q->where('status', 'completed'),
            'submissions as awaiting_review_count' => fn ($q) => $q->where('status', 'submitted'),
        ]);
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('username', 'like', "%{$search}%"));
        }
        if ($grade = $request->string('grade')->toString()) {
            $query->where('grade_level', $grade);
        }
        if ($section = $request->string('section')->toString()) {
            $query->where('section', $section);
        }
        $totalLessons = max(Lesson::where('is_published', true)->count(), 1);

        return Inertia::render('students/index', [
            'students' => $query->orderBy('last_name')->paginate(20)->through(fn ($student) => [
                'id' => $student->id, 'name' => $student->name, 'username' => $student->username,
                'educationLevel' => $student->educationLevelName(), 'program' => $student->program,
                'grade' => $student->grade_level, 'section' => $student->section, 'status' => $student->status,
                'completed' => $student->lessonProgress()->whereIn('lesson_id', CourseAccess::lessons($student)->pluck('id'))->where('status', 'completed')->count(), 'progress' => round($student->lessonProgress()->whereIn('lesson_id', CourseAccess::lessons($student)->pluck('id'))->where('status', 'completed')->count() / max(CourseAccess::lessons($student)->count(), 1) * 100),
                'awaitingReview' => $student->awaiting_review_count,
                'lastLogin' => optional($student->last_login_at)->diffForHumans() ?? 'Never',
            ]),
            'filters' => $request->only('search', 'grade', 'section'),
            'educationLevels' => EducationLevel::whereIn('slug', ['high-school', 'college'])->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request, StudentAccountService $accounts)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:80', 'middle_name' => 'nullable|string|max:80',
            'last_name' => 'required|string|max:80', 'lrn' => 'nullable|string|max:30|unique:users,lrn',
        ] + StudentEducation::rules($request->all()), StudentEducation::messages());
        $created = $accounts->create($data);

        return back()->with('credentials', $created['credentials']);
    }

    public function show(User $student): Response
    {
        abort_unless($student->role === 'student', 404);
        $progress = $student->lessonProgress()->get()->keyBy('lesson_id');
        $latestSubmissions = Submission::where('user_id', $student->id)->whereNotNull('lesson_id')
            ->orderByDesc('version')->get()->unique('lesson_id')->keyBy('lesson_id');
        $completedPrevious = true;
        $lessons = CourseAccess::lessons($student)->with('course')->get()
            ->map(function (Lesson $lesson) use ($student, $progress, $latestSubmissions, &$completedPrevious) {
                $item = $progress->get($lesson->id);
                $status = $item?->status ?? 'not_started';
                $unlocked = CourseAccess::unlocked($student, $lesson);
                $completedPrevious = $status === 'completed';

                return [
                    'lesson' => $lesson->only('id', 'number', 'title', 'level'),
                    'moduleLabel' => ($lesson->course?->name ?? 'HTML & CSS').' · '.$lesson->level,
                    'isProject' => $lesson->is_project,
                    'status' => $status,
                    'unlocked' => $unlocked,
                    'quiz_score' => $item?->quiz_score, 'quiz_total' => count($lesson->quiz ?? []),
                    'quiz_passed_at' => $item?->quiz_passed_at,
                    'last_saved_at' => $item?->last_saved_at,
                    'submitted_at' => $item?->submitted_at,
                    'submission' => $latestSubmissions->get($lesson->id)?->only('id', 'version', 'status', 'submitted_at'),
                ];
            });

        return Inertia::render('students/show', [
            'student' => $student->only('id', 'name', 'username', 'grade_level', 'section', 'status', 'last_login_at', 'education_level_id', 'program') + ['education_level' => $student->educationLevelName(), 'has_academic_history' => $this->hasAcademicHistory($student)],
            'educationLevels' => EducationLevel::whereIn('slug', ['high-school', 'college'])->get(['id', 'name', 'slug']),
            'lessons' => $lessons,
            'summary' => [
                'modules' => $lessons->groupBy('moduleLabel')->map(fn ($items) => ['completed' => $items->where('status', 'completed')->count(), 'total' => $items->count()]),
                'levels' => collect(['Basic', 'Moderate', 'Advanced'])->mapWithKeys(fn ($level) => [
                    $level => $lessons->filter(fn ($row) => $row['lesson']['level'] === $level && $row['status'] === 'completed')->count(),
                ]),
                'currentLesson' => ($lessons->first(fn ($row) => $row['status'] !== 'completed'))['lesson']['title'] ?? ($student->hasAssignedEducationLevel() ? 'Course complete' : 'Education Level Not Assigned'),
                'quizAverage' => $lessons->filter(fn ($row) => $row['quiz_score'] !== null)->map(fn ($row) => $row['quiz_score'] / max(1, $row['quiz_total']) * 5)->avg(),
                'finalProjectStatus' => $lessons->last(fn ($row) => $row['isProject'])['status'] ?? ($lessons->first(fn ($row) => $row['lesson']['number'] === 15)['status'] ?? 'not_started'),
            ],
            'submissions' => $student->submissions()->with(['lesson:id,title,level', 'feedback'])->latest('submitted_at')->get(),
            'activity' => $student->activityLogs()->latest('occurred_at')->take(30)->get(),
        ]);
    }

    public function update(Request $request, User $student)
    {
        $student->update($request->validate(['status' => 'required|in:active,disabled,archived']));

        return back()->with('success', 'Student status updated.');
    }

    private function hasAcademicHistory(User $student): bool
    {
        return $student->lessonProgress()->exists() || $student->submissions()->exists()
            || CourseEnrollment::where('user_id', $student->id)->exists();
    }

    public function education(Request $request, User $student)
    {
        abort_unless($student->role === 'student', 404);
        DB::transaction(function () use ($request, $student) {
            $student = User::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $rules = StudentEducation::rules($request->all());
            if ((int) $request->input('education_level_id') !== (int) $student->education_level_id && $this->hasAcademicHistory($student)) {
                $rules['confirm_level_change'] = 'required|accepted';
            }
            $data = $request->validate($rules, StudentEducation::messages());
            $data['program'] = EducationLevel::whereKey($data['education_level_id'])->where('slug', 'college')->exists() ? ($data['program'] ?? null) : null;
            $student->update(Arr::except($data, ['confirm_level_change']));
            Log::info('Student education updated', ['creator_id' => $request->user()->id, 'student_id' => $student->id, 'education_level_id' => $student->education_level_id]);
        });

        return back()->with('success', 'Education level saved. Existing enrollment and learning records were preserved.');
    }

    public function resetPassword(User $student, StudentAccountService $accounts)
    {
        abort_unless($student->role === 'student', 404);
        $password = $accounts->temporaryPassword();
        DB::transaction(function () use ($student, $password) {
            $student->update([
                'password' => Hash::make($password), 'must_change_password' => true,
                'remember_token' => Str::random(60),
            ]);
            if (config('session.driver') === 'database') {
                DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
                    ->where('user_id', $student->id)->delete();
            }
        });

        return back()->with('credentials', ['name' => $student->name, 'username' => $student->username, 'password' => $password]);
    }

    public function destroy(Request $request, User $student)
    {
        abort_unless($student->role === 'student', 404);
        $request->validate(['confirmed' => 'required|accepted']);
        $name = $student->name;

        DB::transaction(function () use ($student) {
            if (config('session.driver') === 'database') {
                DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
                    ->where('user_id', $student->id)->delete();
            }
            DB::table('password_reset_tokens')->where('email', $student->email)->delete();
            // Foreign keys remove this student's progress, submissions, feedback, and passkeys.
            $student->delete();
        });

        return redirect()->route('students.index')->with('success', "{$name}'s account and activity records were deleted.");
    }

    public function unlock(Request $request, User $student, Lesson $lesson)
    {
        $progress = StudentLessonProgress::firstOrNew(['user_id' => $student->id, 'lesson_id' => $lesson->id]);
        if (! $progress->exists) {
            $progress->status = 'not_started';
        }
        $progress->is_manually_unlocked = true;
        $progress->save();

        return back()->with('success', "Lesson {$lesson->number} unlocked for {$student->name}.");
    }
}
