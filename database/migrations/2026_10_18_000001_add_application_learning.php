<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', fn (Blueprint $t) => $t->json('application_content')->nullable());
        Schema::table('case_studies', function (Blueprint $t) {
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('course_module_id')->nullable()->constrained()->nullOnDelete();
            $t->json('application_content')->nullable();
        });
        foreach (['student_lesson_progress', 'case_study_progress', 'submissions'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->json('application_workspace')->nullable());
        }
        Schema::create('lesson_demonstrations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $t->string('key')->nullable();
            $t->string('title');
            $t->text('description');
            $t->string('media_type')->default('step_sequence');
            $t->string('asset_path')->nullable();
            $t->text('transcript')->nullable();
            $t->json('steps');
            $t->unsignedInteger('display_order')->default(1);
            $t->boolean('is_required')->default(true);
            $t->string('status')->default('published');
            $t->timestamps();
            $t->unique(['lesson_id', 'key']);
        });
        Schema::create('learning_evidence', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lesson_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('case_study_id')->nullable()->constrained()->cascadeOnDelete();
            $t->string('path');
            $t->string('name');
            $t->string('mime');
            $t->unsignedInteger('size');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_evidence');
        Schema::dropIfExists('lesson_demonstrations');
        foreach (['student_lesson_progress', 'case_study_progress', 'submissions'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn('application_workspace'));
        }
        Schema::table('case_studies', function (Blueprint $t) {
            $t->dropConstrainedForeignId('course_id');
            $t->dropConstrainedForeignId('course_module_id');
            $t->dropColumn('application_content');
        });
        Schema::table('lessons', fn (Blueprint $t) => $t->dropColumn('application_content'));
    }
};
