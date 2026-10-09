<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('education_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status')->default('published')->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->json('grade_options')->nullable();
            $table->json('program_options')->nullable();
            $table->timestamps();
        });
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('difficulty')->default('Beginner');
            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->string('editor_type')->default('none');
            $table->string('execution_provider')->default('none');
            $table->string('progression_rule')->default('completion');
            $table->timestamps();
        });
        Schema::create('course_education_level', function (Blueprint $table) {
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('education_level_id')->constrained()->cascadeOnDelete();
            $table->primary(['course_id', 'education_level_id']);
        });
        Schema::create('course_teacher', function (Blueprint $table) {
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['course_id', 'user_id']);
        });
        Schema::create('course_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->unique(['course_id', 'slug']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('education_level_id')->nullable()->constrained()->nullOnDelete();
            $table->string('school')->nullable();
            $table->string('academic_program')->nullable();
            $table->string('profile_picture')->nullable();
        });
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'course_id']);
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('course_level_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('prerequisite_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->text('short_description')->nullable();
            $table->longText('lesson_content')->nullable();
            $table->text('reflection')->nullable();
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->longText('starter_code')->nullable();
            $table->longText('example_code')->nullable();
            $table->unsignedTinyInteger('passing_score')->default(80);
            $table->unsignedSmallInteger('attempt_limit')->nullable();
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_choices')->default(false);
            $table->index(['course_id', 'position']);
        });
        Schema::table('student_lesson_progress', function (Blueprint $table) {
            $table->longText('source_code')->nullable();
            $table->timestamp('last_accessed_at')->nullable();
            $table->unsignedInteger('quiz_attempts')->default(0);
        });
        Schema::table('submissions', function (Blueprint $table) {
            $table->longText('source_code')->nullable();
        });
        Schema::table('case_studies', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('difficulty')->default('Beginner');
            $table->unsignedInteger('points')->default(100);
            $table->timestamp('due_date')->nullable();
        });
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->text('instructions');
            $table->string('activity_type')->default('written');
            $table->unsignedInteger('points')->default(10);
            $table->string('status')->default('draft');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });
        Schema::create('activity_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('answer')->nullable();
            $table->string('file_path')->nullable();
            $table->string('status')->default('submitted');
            $table->unsignedInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['activity_id', 'student_id']);
        });
        foreach (['announcements', 'achievements'] as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->foreignId('course_id')->nullable()->constrained()->restrictOnDelete();
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }
        Schema::create('achievement_user', function (Blueprint $table) {
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('awarded_at');
            $table->primary(['achievement_id', 'user_id']);
        });
        Schema::table('activity_logs', fn (Blueprint $table) => $table->string('ip_address', 45)->nullable());

        // Only associate existing rows. No IDs, accounts, progress or lesson content are replaced.
        $now = now();
        $school = DB::table('education_levels')->insertGetId([
            'name' => 'High School', 'slug' => 'high-school',
            'description' => 'Programming foundations for secondary learners.', 'status' => 'published', 'display_order' => 1,
            'grade_options' => json_encode(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $college = DB::table('education_levels')->insertGetId([
            'name' => 'College', 'slug' => 'college',
            'description' => 'Programming and software development for higher education.', 'status' => 'published', 'display_order' => 2,
            'grade_options' => json_encode(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']),
            'program_options' => json_encode(['BS Information Technology', 'BS Computer Science', 'BS Information Systems', 'Other']),
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $initial = [
            [$school, 'HTML & CSS', 'html-css', 'html', 'browser', 'Beginner'],
            [$school, 'Scratch Programming', 'scratch-programming', 'scratch', 'none', 'Beginner'],
            [$school, 'Basic JavaScript', 'basic-javascript', 'javascript', 'browser', 'Beginner'],
            [$school, 'Introduction to Programming', 'introduction-to-programming', 'none', 'none', 'Beginner'],
            [$college, 'Python Programming', 'python-programming', 'python', 'none', 'Beginner'],
            [$college, 'Java Programming', 'java-programming', 'java', 'none', 'Intermediate'],
            [$college, 'Visual Basic .NET', 'visual-basic-net', 'vbnet', 'none', 'Beginner'],
            [$college, 'PHP Programming', 'php-programming', 'php', 'none', 'Beginner'],
            [$college, 'SQL / Database Programming', 'sql-database-programming', 'sql', 'none', 'Beginner'],
            [$college, 'C Programming', 'c-programming', 'c', 'none', 'Beginner'],
            [$college, 'C++ Programming', 'cpp-programming', 'cpp', 'none', 'Beginner'],
            [$college, 'JavaScript Programming', 'javascript-programming', 'javascript', 'browser', 'Beginner'],
            [$college, 'Web Development', 'web-development', 'html', 'browser', 'Beginner'],
            [$college, 'Laravel', 'laravel', 'php', 'none', 'Intermediate'],
            [$college, 'React', 'react', 'javascript', 'none', 'Intermediate'],
        ];
        foreach ($initial as $order => [$level, $name, $slug, $editor, $provider, $difficulty]) {
            $id = DB::table('courses')->insertGetId([
                'name' => $name, 'slug' => $slug, 'short_description' => $slug === 'html-css' ? 'Build websites through lessons, quizzes and practical projects.' : 'Course content is being prepared.',
                'status' => $slug === 'html-css' ? 'published' : 'draft', 'display_order' => $order + 1,
                'editor_type' => $editor, 'execution_provider' => $provider, 'difficulty' => $difficulty,
                'is_featured' => $slug === 'html-css', 'created_at' => $now, 'updated_at' => $now,
            ]);
            DB::table('course_education_level')->insert(['course_id' => $id, 'education_level_id' => $level]);
            foreach (['Basic', $slug === 'html-css' ? 'Moderate' : 'Intermediate', 'Advanced'] as $index => $module) {
                $moduleId = DB::table('course_levels')->insertGetId([
                    'course_id' => $id, 'name' => $module, 'slug' => strtolower($module), 'display_order' => $index + 1,
                    'status' => $slug === 'html-css' ? 'published' : 'draft', 'created_at' => $now, 'updated_at' => $now,
                ]);
                if ($slug === 'html-css') {
                    DB::table('lessons')->whereNull('course_id')->where('level', $module)->update(['course_level_id' => $moduleId]);
                }
            }
            if ($slug === 'html-css') {
                DB::table('lessons')->whereNull('course_id')->update(['course_id' => $id]);
                DB::table('case_studies')->whereNull('course_id')->update(['course_id' => $id]);
                DB::table('users')->where('role', 'student')->whereNull('education_level_id')->update(['education_level_id' => $school]);
                DB::table('users')->where('role', 'student')->orderBy('id')->chunkById(200, function ($users) use ($id, $now) {
                    DB::table('course_enrollments')->insert($users->map(fn ($user) => [
                        'student_id' => $user->id, 'course_id' => $id, 'status' => 'active', 'enrolled_at' => $now,
                        'created_at' => $now, 'updated_at' => $now,
                    ])->all());
                });
                foreach (DB::table('users')->where('role', 'teacher')->pluck('id') as $teacher) {
                    DB::table('course_teacher')->insert(['course_id' => $id, 'user_id' => $teacher]);
                }
            }
        }
    }

    public function down(): void
    {
        // SQLite rebuilds tables to drop foreign keys. Disable enforcement for
        // this operation so rebuilding lessons cannot cascade-delete progress.
        Schema::withoutForeignKeyConstraints(fn () => $this->removeAssociations());
    }

    private function removeAssociations(): void
    {
        // Rollback removes new associations, never original learning records.
        Schema::table('activity_logs', fn (Blueprint $table) => $table->dropColumn('ip_address'));
        Schema::dropIfExists('achievement_user');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('activity_responses');
        Schema::dropIfExists('activities');
        Schema::table('case_studies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_id');
            $table->dropColumn(['difficulty', 'points', 'due_date']);
        });
        Schema::table('submissions', fn (Blueprint $table) => $table->dropColumn('source_code'));
        Schema::table('student_lesson_progress', fn (Blueprint $table) => $table->dropColumn(['source_code', 'last_accessed_at', 'quiz_attempts']));
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex(['course_id', 'position']);
            $table->dropConstrainedForeignId('course_id');
            $table->dropConstrainedForeignId('course_level_id');
            $table->dropConstrainedForeignId('prerequisite_id');
            $table->dropColumn(['short_description', 'lesson_content', 'reflection', 'estimated_minutes', 'starter_code', 'example_code', 'passing_score', 'attempt_limit', 'shuffle_questions', 'shuffle_choices']);
        });
        Schema::dropIfExists('course_enrollments');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('education_level_id');
            $table->dropColumn(['school', 'academic_program', 'profile_picture']);
        });
        Schema::dropIfExists('course_teacher');
        Schema::dropIfExists('course_levels');
        Schema::dropIfExists('course_education_level');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('education_levels');
    }
};
