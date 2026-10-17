<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->json('block_examples')->nullable());
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('scratch_project_url', 255)->nullable();
                $table->text('scratch_notes')->nullable();
            });
        }
        Schema::table('submissions', fn (Blueprint $table) => $table->json('rubric_scores')->nullable());
    }

    public function down(): void
    {
        Schema::table('submissions', fn (Blueprint $table) => $table->dropColumn('rubric_scores'));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['scratch_project_url', 'scratch_notes']));
        }
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn('block_examples'));
    }
};
