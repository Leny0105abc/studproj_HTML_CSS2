<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            foreach (['wordpress_setup', 'wordpress_steps', 'site_structure', 'visual_guide', 'maintenance_tip', 'submission_instructions'] as $field) {
                $table->text($field)->nullable();
            }
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('wordpress_practice_url', 2048)->nullable();
                $table->string('wordpress_project_url', 2048)->nullable();
                $table->text('wordpress_environment')->nullable();
                $table->text('wordpress_notes')->nullable();
                $table->json('wordpress_evidence')->nullable();
            });
        }
        Schema::create('wordpress_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('lesson_id')->constrained();
            $table->string('path');
            $table->string('name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wordpress_evidence');
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['wordpress_practice_url', 'wordpress_project_url', 'wordpress_environment', 'wordpress_notes', 'wordpress_evidence']));
        }
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['wordpress_setup', 'wordpress_steps', 'site_structure', 'visual_guide', 'maintenance_tip', 'submission_instructions']));
    }
};
