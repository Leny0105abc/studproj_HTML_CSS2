<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\CourseLevel;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\User;
use App\Services\CourseAccess;
use App\Services\StudentAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ManagementController extends Controller
{
    private function definition(string $resource): array
    {
        $definition = config('platform.resources.'.$resource);
        abort_unless($definition, 404);

        return $definition;
    }

    private function authorizeResource(Request $request, array $definition, ?object $record = null, ?int $courseId = null): void
    {
        if (($definition['admin'] ?? false) || (! $record && ! $courseId)) {
            Gate::authorize('platform-admin');

            return;
        }
        $course = $record instanceof Course ? $record : ($courseId ? Course::findOrFail($courseId) : ($record?->course ?? $record?->lesson?->course));
        if ($course) {
            Gate::authorize('update', $course);
        } else {
            Gate::authorize('platform-admin');
        }
    }

    public function index(Request $request, string $resource)
    {
        $def = $this->definition($resource);
        if ($def['admin'] ?? false) {
            Gate::authorize('platform-admin');
        }
        $query = $def['model']::query();
        if ($resource === 'students' || $resource === 'teachers') {
            $query->where('role', $resource === 'students' ? 'student' : 'teacher');
        }
        $courses = app(CourseAccess::class)->visible($request->user())->orderBy('display_order')->get(['id', 'name']);
        if ($request->user()->role === 'teacher') {
            $ids = $courses->pluck('id');
            if ($resource === 'courses') {
                $query->whereIn('id', $ids);
            } elseif ($resource === 'activities') {
                $query->whereHas('lesson', fn ($q) => $q->whereIn('course_id', $ids));
            } else {
                $query->whereIn('course_id', $ids);
            }
        }
        $nameField = in_array($resource, ['lessons', 'activities', 'projects', 'announcements', 'achievements']) ? 'title' : 'name';
        if ($search = $request->string('search')->trim()->toString()) {
            if ($resource !== 'enrollments') {
                $query->where($nameField, 'like', '%'.$search.'%');
            }
        }
        $records = $query->latest('id')->paginate(20)->withQueryString();
        if ($resource === 'courses') {
            $records->load('educationLevels', 'teachers');
        }
        if ($resource === 'teachers') {
            $records->load('taughtCourses');
        }

        return Inertia::render('platform/manage', [
            'resource' => $resource, 'label' => $def['label'], 'records' => $records,
            'rules' => collect($def['rules'])->reject(fn ($v, $key) => str_contains($key, '.')),
            'options' => [
                'courses' => $courses, 'modules' => CourseLevel::whereIn('course_id', $courses->pluck('id'))->get(['id', 'name', 'course_id']),
                'lessons' => Lesson::whereIn('course_id', $courses->pluck('id'))->get(['id', 'title', 'course_id', 'position']),
                'programs' => EducationLevel::orderBy('display_order')->get(),
                'students' => $request->user()->role === 'admin' ? User::where('role', 'student')->get(['id', 'name']) :
                    User::where('role', 'student')->whereHas('enrollments', fn ($q) => $q->whereIn('course_id', $courses->pluck('id')))->get(['id', 'name']),
                'teachers' => $request->user()->role === 'admin' ? User::where('role', 'teacher')->get(['id', 'name']) : [],
            ],
            'isAdmin' => $request->user()->role === 'admin', 'search' => $search,
        ]);
    }

    private function validated(Request $request, string $resource, ?object $record): array
    {
        $def = $this->definition($resource);
        $rules = $def['rules'];
        if ($resource === 'courses' && $request->user()->role === 'teacher') {
            unset($rules['education_level_ids'], $rules['education_level_ids.*'], $rules['teacher_ids'], $rules['teacher_ids.*']);
        }
        if (isset($rules['slug'])) {
            $rules['slug'] = [...explode('|', $rules['slug']), Rule::unique((new $def['model'])->getTable(), 'slug')->ignore($record?->id)
                ->when($resource === 'modules', fn ($r) => $r->where('course_id', $request->integer('course_id')))];
        }
        if ($resource === 'enrollments') {
            $rules['student_id'] = [...explode('|', $rules['student_id']), Rule::exists('users', 'id')->where('role', 'student'),
                Rule::unique('course_enrollments', 'student_id')->where('course_id', $request->integer('course_id'))->ignore($record?->id)];
        }
        $data = $request->validate($rules);
        $this->authorizeResource($request, $def, $record, $data['course_id'] ?? (isset($data['lesson_id']) ? Lesson::findOrFail($data['lesson_id'])->course_id : null));
        if ($resource === 'activities') {
            Gate::authorize('update', Lesson::findOrFail($data['lesson_id'])->course);
        }
        if ($resource === 'projects') {
            foreach (['concepts', 'expected_features'] as $key) {
                $data[$key] = $data[$key] ?? [];
            }
        }
        if ($resource === 'courses' && $request->user()->role !== 'admin') {
            unset($data['education_level_ids'], $data['teacher_ids']);
        }
        if ($resource === 'courses' && ($data['teacher_ids'] ?? [])) {
            abort_unless(User::whereIn('id', $data['teacher_ids'])->where('role', 'teacher')->count() === count(array_unique($data['teacher_ids'])), 422);
        }
        if ($resource === 'courses' && $data['execution_provider'] === 'browser' && ! in_array($data['editor_type'], ['html', 'javascript', 'none'])) {
            throw ValidationException::withMessages(['execution_provider' => 'Browser execution supports HTML and JavaScript. Other runners stay disabled until a secure provider is integrated.']);
        }
        if ($resource === 'courses' && $record?->slug === 'html-css' &&
            ($data['slug'] !== 'html-css' || $data['editor_type'] !== 'html' || $data['execution_provider'] !== 'browser')) {
            throw ValidationException::withMessages(['editor_type' => 'Keep the existing HTML/CSS course slug, HTML editor and browser provider to preserve its saved work and workflow.']);
        }
        if ($resource === 'lessons') {
            $course = Course::findOrFail($data['course_id']);
            $module = isset($data['course_level_id']) ? CourseLevel::findOrFail($data['course_level_id']) : null;
            if ($module && $module->course_id !== $course->id) {
                throw ValidationException::withMessages(['course_level_id' => 'Choose a module in this course.']);
            }
            if (! empty($data['prerequisite_id'])) {
                $previous = Lesson::findOrFail($data['prerequisite_id']);
                if ($previous->course_id !== $course->id || $previous->position >= $data['position'] || $previous->id === $record?->id) {
                    throw ValidationException::withMessages(['prerequisite_id' => 'A prerequisite must be an earlier lesson in this course.']);
                }
            }
            if ($record && $record->course_id !== $course->id && $record->progress()->exists()) {
                throw ValidationException::withMessages(['course_id' => 'Lessons with student progress cannot move to another course. Duplicate the lesson instead.']);
            }
            foreach ($data['quiz'] ?? [] as $index => $question) {
                validator($question, ['question' => 'required|string|max:5000', 'type' => 'sometimes|in:multiple_choice,true_false,identification,short_answer,code_output,code_completion',
                    'choices' => 'sometimes|array|min:2|max:10', 'choices.*' => 'string|max:2000', 'answer' => 'required',
                    'explanation' => 'nullable|string|max:5000'])->validate();
                if (! is_scalar($question['answer'])) {
                    throw ValidationException::withMessages(['quiz' => 'Answers must be text or a choice number.']);
                }
                if (isset($question['choices']) && ! array_key_exists($question['answer'], $question['choices'])) {
                    throw ValidationException::withMessages(['quiz' => 'Choose a correct answer for question '.($index + 1).'.']);
                }
            }
            if ($course->slug === 'html-css' && ! empty($data['quiz']) && count($data['quiz']) !== 5) {
                throw ValidationException::withMessages(['quiz' => 'The original HTML/CSS workspace requires five multiple-choice questions.']);
            }
            if ($course->slug === 'html-css') {
                foreach ($data['quiz'] ?? [] as $question) {
                    if (($question['type'] ?? 'multiple_choice') !== 'multiple_choice' || count($question['choices'] ?? []) !== 4 || ! is_numeric($question['answer'])) {
                        throw ValidationException::withMessages(['quiz' => 'The existing HTML/CSS quiz needs four choices and a correct choice number for each question.']);
                    }
                }
                $data['passing_score'] = 80;
                $data['attempt_limit'] = null;
                $data['shuffle_questions'] = false;
                $data['shuffle_choices'] = false;
            }
            $data['level'] = $module?->name ?? 'Basic';
            foreach (['introduction', 'explanation', 'guided_practice', 'activity', 'expected_result', 'completion_requirements'] as $key) {
                $data[$key] = $data[$key] ?? '';
            }
        }

        return $data;
    }

    public function store(Request $request, string $resource)
    {
        $data = $this->validated($request, $resource, null);
        $def = $this->definition($resource);
        $credentials = null;
        $record = DB::transaction(function () use ($resource, $def, $data, &$credentials) {
            if ($resource === 'courses') {
                $levels = $data['education_level_ids'];
                $teachers = $data['teacher_ids'] ?? [];
                unset($data['education_level_ids'], $data['teacher_ids']);
                $course = Course::create($data);
                $course->educationLevels()->sync($levels);
                $course->teachers()->sync($teachers);

                return $course;
            }
            if (in_array($resource, ['students', 'teachers'])) {
                $courses = $data['course_ids'] ?? [];
                unset($data['course_ids']);
                $accounts = app(StudentAccountService::class);
                $username = $accounts->username($data['first_name'], $data['last_name']);
                $password = $accounts->temporaryPassword();
                $data += ['name' => $data['first_name'].' '.$data['last_name'], 'username' => $username, 'email' => $username.'@codelab.local',
                    'password' => $password, 'role' => $resource === 'students' ? 'student' : 'teacher', 'email_verified_at' => now(),
                    'must_change_password' => true];
                $user = User::create($data);
                if ($resource === 'teachers') {
                    $user->taughtCourses()->sync($courses);
                }
                $credentials = ['name' => $data['name'], 'username' => $username, 'password' => $password];

                return $user;
            }
            if ($resource === 'lessons' || $resource === 'projects') {
                DB::table('courses')->where('slug', 'html-css')->lockForUpdate()->first();
                $data['number'] = ($def['model']::max('number') ?? 0) + 1;
            }
            if ($resource === 'enrollments') {
                $data['enrolled_at'] = now();
            }
            if ($resource === 'activities') {
                Gate::authorize('update', Lesson::findOrFail($data['lesson_id'])->course);
            }

            return $def['model']::create($data);
        });
        $this->audit($request, $record, 'created');

        return back()->with('success', 'Created successfully.')->with('credentials', $credentials);
    }

    public function update(Request $request, string $resource, int $id)
    {
        $def = $this->definition($resource);
        $record = $def['model']::findOrFail($id);
        if (in_array($resource, ['students', 'teachers'])) {
            abort_unless($record->role === ($resource === 'students' ? 'student' : 'teacher'), 404);
        }
        $this->authorizeResource($request, $def, $record);
        $data = $this->validated($request, $resource, $record);
        DB::transaction(function () use ($resource, $record, $data) {
            if ($resource === 'courses') {
                if (isset($data['education_level_ids'])) {
                    $record->educationLevels()->sync($data['education_level_ids']);
                }
                if (isset($data['teacher_ids'])) {
                    $record->teachers()->sync($data['teacher_ids']);
                }
                unset($data['education_level_ids'], $data['teacher_ids']);
            }
            if ($resource === 'teachers') {
                $record->taughtCourses()->sync($data['course_ids'] ?? []);
                unset($data['course_ids']);
            }
            if (in_array($resource, ['students', 'teachers'])) {
                $data['name'] = $data['first_name'].' '.$data['last_name'];
            }
            if ($resource === 'lessons' && $record->progress()->exists() && ($record->quiz !== ($data['quiz'] ?? null))) {
                throw ValidationException::withMessages(['quiz' => 'This quiz has student progress. Duplicate the lesson to change questions without altering existing results.']);
            }
            $record->update($data);
        });
        $this->audit($request, $record, 'updated');

        return back()->with('success', 'Changes saved.');
    }

    public function destroy(Request $request, string $resource, int $id)
    {
        $def = $this->definition($resource);
        $record = $def['model']::findOrFail($id);
        $this->authorizeResource($request, $def, $record);
        if ($record instanceof Course) {
            Gate::authorize('delete', $record);
        }
        if (in_array($resource, ['students', 'teachers'])) {
            abort_unless($record->role === ($resource === 'students' ? 'student' : 'teacher'), 404);
        }
        $record->update(in_array($resource, ['lessons', 'projects']) ? ['is_published' => false] : ['status' => $resource === 'enrollments' ? 'suspended' : 'archived']);
        $this->audit($request, $record, 'archived');

        return back()->with('success', 'Archived. Existing records and student work are preserved.');
    }

    public function duplicate(Request $request, Lesson $lesson)
    {
        Gate::authorize('update', $lesson->course);
        DB::transaction(function () use ($lesson, $request) {
            DB::table('courses')->where('slug', 'html-css')->lockForUpdate()->first();
            $copy = $lesson->replicate();
            $copy->number = Lesson::max('number') + 1;
            $copy->position = $lesson->course->lessons()->max('position') + 1;
            $copy->slug = $lesson->slug.'-copy-'.Str::lower(Str::random(6));
            $copy->title .= ' (copy)';
            $copy->is_published = false;
            $copy->prerequisite_id = null;
            $copy->save();
            $this->audit($request, $copy, 'duplicated');
        });

        return back()->with('success', 'Draft copy created without copying student progress.');
    }

    private function audit(Request $request, object $record, string $action): void
    {
        ActivityLog::create(['user_id' => $request->user()->id, 'event' => strtolower(class_basename($record)).'_'.$action,
            'subject_type' => $record::class, 'subject_id' => $record->id, 'occurred_at' => now(), 'ip_address' => $request->ip()]);
    }
}
