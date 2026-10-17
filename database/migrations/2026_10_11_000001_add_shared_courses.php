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
            $table->timestamps();
        });
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('education_level_id')->constrained();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('difficulty')->default('Beginner to Advanced');
            $table->string('language')->default('HTML/CSS');
            $table->string('editor_type')->default('html');
            $table->string('execution_provider')->default('iframe');
            $table->boolean('is_published')->default(true);
            $table->boolean('sequential_gating')->default(true);
            $table->timestamps();
        });
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('position');
            $table->json('assessment')->nullable();
            $table->timestamps();
            $table->unique(['course_id', 'name']);
        });
        Schema::table('users', fn (Blueprint $table) => $table->foreignId('education_level_id')->nullable()->constrained()->nullOnDelete());
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('course_module_id')->nullable()->constrained()->nullOnDelete();
            $table->longText('starter_python')->nullable();
            $table->longText('example_python')->nullable();
            $table->json('rubric')->nullable();
            $table->boolean('is_project')->default(false);
            $table->foreignId('prerequisite_id')->nullable()->constrained('lessons')->nullOnDelete();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('python_code')->nullable();
                $table->text('program_input')->nullable();
            });
        }
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->json('assessment_results')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'course_id']);
        });
        $now = now();
        $school = DB::table('education_levels')->insertGetId(['name' => 'High School', 'slug' => 'high-school', 'created_at' => $now, 'updated_at' => $now]);
        DB::table('education_levels')->insert(['name' => 'College', 'slug' => 'college', 'created_at' => $now, 'updated_at' => $now]);
        $course = DB::table('courses')->insertGetId(['education_level_id' => $school, 'name' => 'HTML & CSS', 'slug' => 'html-css', 'description' => 'Build accessible web pages with HTML and CSS.', 'created_at' => $now, 'updated_at' => $now]);
        DB::table('users')->where('role', 'student')->update(['education_level_id' => $school]);
        foreach (['Basic', 'Moderate', 'Advanced'] as $index => $level) {
            $module = DB::table('course_modules')->insertGetId(['course_id' => $course, 'name' => $level, 'position' => $index + 1, 'created_at' => $now, 'updated_at' => $now]);
            DB::table('lessons')->where('level', $level)->update(['course_id' => $course, 'course_module_id' => $module]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_enrollments');
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['python_code', 'program_input']));
        }
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('prerequisite_id');
            $table->dropConstrainedForeignId('course_module_id');
            $table->dropConstrainedForeignId('course_id');
            $table->dropColumn(['starter_python', 'example_python', 'rubric', 'is_project']);
        });
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('education_level_id'));
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('education_levels');
    }
};
