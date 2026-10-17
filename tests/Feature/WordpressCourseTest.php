<?php

use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\StudentLessonProgress;
use App\Models\Submission;
use App\Models\User;
use App\Models\WordpressEvidence;
use Database\Seeders\BootstrapCourseSeeder;
use Database\Seeders\CppCourseSeeder;
use Database\Seeders\CsharpCourseSeeder;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\GoogleAppsScriptCourseSeeder;
use Database\Seeders\JavaCourseSeeder;
use Database\Seeders\JavascriptCourseSeeder;
use Database\Seeders\PhpCourseSeeder;
use Database\Seeders\PythonCourseSeeder;
use Database\Seeders\ScratchCourseSeeder;
use Database\Seeders\SqlCourseSeeder;
use Database\Seeders\VbaCourseSeeder;
use Database\Seeders\VbnetCourseSeeder;
use Database\Seeders\WordpressCourseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    foreach ([CurriculumSeeder::class, PythonCourseSeeder::class, ScratchCourseSeeder::class, PhpCourseSeeder::class, CppCourseSeeder::class, JavaCourseSeeder::class, SqlCourseSeeder::class, JavascriptCourseSeeder::class, VbnetCourseSeeder::class, VbaCourseSeeder::class, GoogleAppsScriptCourseSeeder::class, CsharpCourseSeeder::class, BootstrapCourseSeeder::class] as $seeder) {
        $this->seed($seeder);
    }
});

function wordpressStudent(): User
{
    return User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'college')->value('id')]);
}

function wordpressWork(int $version = 1): array
{
    return ['version' => $version, 'wordpress_practice_url' => 'http://localhost:8080/', 'wordpress_project_url' => 'https://school.example.test/about/', 'wordpress_environment' => 'Authorized local practice; block theme; fictional records.', 'wordpress_notes' => 'Checked headings, page navigation and responsive layout. Screenshots redact account data.', 'evidence_ids' => []];
}

test('wordpress curriculum preserves all thirteen courses and reseeding preserves teacher edits and student work', function () {
    $courses = Course::orderBy('id')->get()->toArray();
    $lessons = Lesson::orderBy('id')->get()->toArray();
    $student = wordpressStudent();
    $progress = StudentLessonProgress::create(['user_id' => $student->id, 'lesson_id' => Lesson::first()->id, 'status' => 'completed', 'html_code' => '<p>Preserve this</p>']);
    $this->seed(WordpressCourseSeeder::class);
    $course = Course::where('slug', 'wordpress')->firstOrFail();
    expect($course->editor_type)->toBe('wordpress');
    expect($course->execution_provider)->toBe('external-authorized-site');
    expect($course->category)->toBe('Web Development / CMS');
    expect($course->modules->pluck('name')->all())->toBe(['Beginner', 'Intermediate', 'Advanced']);
    expect($course->lessons->pluck('position')->all())->toBe(range(1, 18));
    expect($course->lessons->groupBy('level')->map->count()->all())->toBe(['Beginner' => 6, 'Intermediate' => 6, 'Advanced' => 6]);
    foreach ($course->modules as $module) {
        expect($module->assessment)->toHaveCount(18);
    }
    foreach ($course->lessons as $lesson) {
        expect($lesson->quiz)->toHaveCount(5);
        expect($lesson->wordpress_steps)->toContain('6.');
        expect($lesson->auto_complete)->toBeFalse();
        expect($lesson->requiresTeacherReview())->toBeTrue();
        foreach ($lesson->quiz as $question) {
            expect(count(array_unique($question['choices'])))->toBe(4);
        }
        if ($lesson->is_project) {
            expect(array_sum($lesson->rubric))->toBe(100);
        }
    }
    $first = $course->lessons()->first();
    $first->update(['wordpress_steps' => 'Teacher-authored procedures']);
    $this->seed(WordpressCourseSeeder::class);
    expect($course->lessons()->count())->toBe(18);
    expect($first->fresh()->wordpress_steps)->toBe('Teacher-authored procedures');
    expect(Course::where('id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($courses);
    expect(Lesson::where('course_id', '!=', $course->id)->orderBy('id')->get()->toArray())->toBe($lessons);
    expect($progress->fresh()->html_code)->toBe('<p>Preserve this</p>');
});

test('wordpress uses college access enrollment dashboard previews and configurable gating', function () {
    $this->seed(WordpressCourseSeeder::class);
    $student = wordpressStudent();
    $school = User::factory()->create(['role' => 'student', 'education_level_id' => EducationLevel::where('slug', 'high-school')->value('id')]);
    $course = Course::where('slug', 'wordpress')->first();
    [$first, $second] = $course->lessons()->take(2)->get();
    $this->actingAs($student)->get('/courses/wordpress')->assertInertia(fn (Assert $p) => $p->has('lessons', 18)->where('levelProgress.Beginner.total', 6)->where('course.recommended_prerequisites', $course->recommended_prerequisites)->missing('modules.0.assessment.0.answer')->etc());
    $this->get('/dashboard')->assertInertia(fn (Assert $p) => $p->has('courses', 12)->where('summary.remaining', 276)->etc());
    $this->get("/code-lab/{$first->id}")->assertInertia(fn (Assert $p) => $p->component('code-lab/wordpress')->where('workspace.wordpress_evidence', [])->missing('lesson.quiz.0.answer')->etc());
    expect(CourseEnrollment::where('user_id', $student->id)->where('course_id', $course->id)->first()->started_at)->not->toBeNull();
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    $this->get("/lessons/{$second->id}/preview")->assertInertia(fn (Assert $p) => $p->where('unlocked', false)->where('lesson.wordpress_steps', $second->wordpress_steps)->missing('lesson.quiz')->etc());
    $this->actingAs($school)->get('/courses/wordpress')->assertForbidden();
    CourseEnrollment::create(['user_id' => $school->id, 'course_id' => $course->id]);
    // Enrollment is retained; education compatibility remains mandatory.
    $this->get("/code-lab/{$first->id}")->assertForbidden();
    $this->assertDatabaseHas('course_enrollments', ['user_id' => $school->id, 'course_id' => $course->id]);
    $this->actingAs($student);
    $course->update(['sequential_gating' => false]);
    $this->actingAs($student)->get("/code-lab/{$second->id}")->assertOk();
    $course->update(['is_published' => false]);
    $this->get("/code-lab/{$first->id}")->assertForbidden();
});

test('wordpress immutable url submissions require quiz current teacher review and lock approved work', function () {
    $this->seed(WordpressCourseSeeder::class);
    $student = wordpressStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'wordpress')->first();
    $lesson = $course->lessons()->first();
    $second = $course->lessons()->skip(1)->first();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/wordpress/submit", wordpressWork())->assertOk()->assertJsonPath('version', 2);
    $old = Submission::latest('id')->first();
    $this->actingAs($teacher)->postJson("/submissions/{$old->id}/review", ['status' => 'completed'])->assertUnprocessable();
    $answers = array_column($lesson->quiz, 'answer');
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => $answers])->assertOk()->assertJsonPath('completed', false);
    $this->get("/code-lab/{$second->id}")->assertForbidden();
    $changed = wordpressWork(2);
    $changed['wordpress_notes'] = 'Changed evidence notes after initial submission; retested all links.';
    $this->postJson("/code-lab/{$lesson->id}/wordpress/save", $changed)->assertOk()->assertJsonPath('version', 3);
    expect($old->fresh()->status)->toBe('superseded');
    expect($old->fresh()->wordpress_notes)->toBe(wordpressWork()['wordpress_notes']);
    $this->actingAs($teacher)->postJson("/submissions/{$old->id}/review", ['status' => 'completed'])->assertUnprocessable();
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/wordpress/save", $changed)->assertUnprocessable();
    $changed['version'] = 3;
    $this->postJson("/code-lab/{$lesson->id}/wordpress/submit", $changed)->assertOk();
    $current = Submission::latest('id')->first();
    $this->actingAs($teacher)->get("/submissions/{$current->id}")->assertInertia(fn (Assert $p) => $p->where('submission.wordpress_notes', $changed['wordpress_notes'])->where('submission.lesson.course.editor_type', 'wordpress')->etc());
    $this->postJson("/submissions/{$current->id}/review", ['status' => 'completed'])->assertRedirect();
    $this->actingAs($student)->get("/code-lab/{$second->id}")->assertOk();
    $changed['version'] = 4;
    $this->postJson("/code-lab/{$lesson->id}/wordpress/save", $changed)->assertForbidden();
    expect(ActivityLog::where('event', 'lesson_completed')->where('subject_id', $lesson->id)->exists())->toBeTrue();
});

test('wordpress private files are validated owned downloadable and retained in submitted snapshots', function () {
    Storage::fake('local');
    $this->seed(WordpressCourseSeeder::class);
    $student = wordpressStudent();
    $other = wordpressStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'wordpress')->first();
    $lesson = $course->lessons()->first();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $data = wordpressWork();
    $data['wordpress_project_url'] = '';
    $data['evidence_ids'] = '[]';
    $data['files'] = [UploadedFile::fake()->image('redacted-dashboard.png'), UploadedFile::fake()->create('practice-report.pdf', 4, 'application/pdf')];
    $this->post("/code-lab/{$lesson->id}/wordpress/submit", $data, ['Accept' => 'application/json'])->assertOk();
    expect(WordpressEvidence::count())->toBe(2);
    $file = WordpressEvidence::first();
    Storage::disk('local')->assertExists($file->path);
    expect(Submission::latest('id')->first()->wordpress_evidence[0]['id'])->toBe($file->id);
    $this->get("/wordpress-evidence/{$file->id}")->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    $this->actingAs($teacher)->get("/wordpress-evidence/{$file->id}")->assertOk();
    $this->actingAs($other)->get("/wordpress-evidence/{$file->id}")->assertForbidden();
    $this->get("/code-lab/{$lesson->id}")->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/wordpress/save", array_replace(wordpressWork(), ['evidence_ids' => [$file->id]]))->assertUnprocessable();
    $this->actingAs($student)->postJson("/code-lab/{$lesson->id}/wordpress/save", array_replace(wordpressWork(2), ['evidence_ids' => []]))->assertOk();
    Storage::disk('local')->assertExists($file->path);
    $data = wordpressWork(3);
    $data['files'] = [UploadedFile::fake()->create('bad.php', 1, 'text/x-php')];
    $this->post("/code-lab/{$lesson->id}/wordpress/save", $data, ['Accept' => 'application/json'])->assertUnprocessable();
    $data['files'] = [UploadedFile::fake()->image('oversized.png')->size(8193)];
    $this->post("/code-lab/{$lesson->id}/wordpress/save", $data, ['Accept' => 'application/json'])->assertUnprocessable();
    $this->actingAs($other)->get("/code-lab/{$course->lessons()->skip(1)->first()->id}")->assertForbidden();
});

test('wordpress rejects credentials unsafe links empty evidence and programming endpoint bypasses', function () {
    $this->seed(WordpressCourseSeeder::class);
    $lesson = Course::where('slug', 'wordpress')->first()->lessons()->first();
    $this->actingAs(wordpressStudent())->get("/code-lab/{$lesson->id}")->assertOk();
    foreach (['javascript:alert(1)', 'https://user:secret@example.test/', 'https://example.test/?token=secret', 'https://example.test/?%74oken=secret', 'https://example.test/?key=reset-secret'] as $url) {
        $this->postJson("/code-lab/{$lesson->id}/wordpress/save", array_replace(wordpressWork(), ['wordpress_project_url' => $url]))->assertUnprocessable();
    }
    $this->postJson("/code-lab/{$lesson->id}/wordpress/save", wordpressWork() + ['wordpress_password' => 'NeverStoreThis'])->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/wordpress/submit", array_replace(wordpressWork(), ['wordpress_project_url' => null]))->assertUnprocessable();
    $this->putJson("/code-lab/{$lesson->id}/save", ['version' => 1, 'html_code' => '<p>Bypass</p>'])->assertUnprocessable();
    $this->postJson("/code-lab/{$lesson->id}/submit", ['version' => 1, 'html_code' => '<p>Bypass</p>'])->assertUnprocessable();
    expect(Submission::count())->toBe(0);
});

test('wordpress project approval requires every rubric category and logs project grading', function () {
    $this->seed(WordpressCourseSeeder::class);
    $student = wordpressStudent();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $course = Course::where('slug', 'wordpress')->first();
    $course->update(['sequential_gating' => false]);
    $lesson = $course->lessons()->where('is_project', true)->first();
    $this->actingAs($student)->get("/code-lab/{$lesson->id}")->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/wordpress/submit", wordpressWork())->assertOk();
    $this->postJson("/code-lab/{$lesson->id}/quiz", ['answers' => array_column($lesson->quiz, 'answer')])->assertOk();
    $submission = Submission::first();
    $this->actingAs($teacher)->postJson("/submissions/{$submission->id}/review", ['status' => 'completed'])->assertUnprocessable();
    $bad = $lesson->rubric;
    $bad['Website Functionality'] = 21;
    $this->postJson("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $bad])->assertUnprocessable();
    $this->postJson("/submissions/{$submission->id}/review", ['status' => 'completed', 'rubric_scores' => $lesson->rubric])->assertRedirect();
    expect(array_sum($submission->fresh()->rubric_scores))->toBe(100);
    expect(ActivityLog::where('event', 'project_graded')->exists())->toBeTrue();
});

test('existing management edits wordpress procedures advisory prerequisites assessments and unpublished drafts', function () {
    $this->seed(WordpressCourseSeeder::class);
    $course = Course::where('slug', 'wordpress')->first();
    $lesson = $course->lessons()->first();
    $teacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($teacher)->put("/lessons/{$lesson->id}", array_replace($lesson->toArray(), ['wordpress_steps' => 'Updated safe teacher procedure', 'visual_guide' => 'Redacted example description']))->assertRedirect();
    expect($lesson->fresh()->wordpress_steps)->toBe('Updated safe teacher procedure');
    $this->put('/courses/wordpress', ['name' => $course->name, 'description' => $course->description, 'education_level_id' => $course->education_level_id, 'is_published' => true, 'sequential_gating' => false, 'category' => 'Teacher CMS category', 'recommended_prerequisites' => 'Optional editable HTML background'])->assertRedirect();
    expect($course->fresh()->recommended_prerequisites)->toBe('Optional editable HTML background');
    $this->post('/lessons', ['course_id' => $course->id, 'title' => 'WordPress extension draft', 'level' => 'Beginner', 'objectives' => ['Plan', 'Test'], 'activity' => 'Teacher practical activity'])->assertRedirect();
    expect(Lesson::where('title', 'WordPress extension draft')->first()->is_published)->toBeFalse();
    $this->actingAs(wordpressStudent())->put("/lessons/{$lesson->id}", $lesson->toArray())->assertForbidden();
});
