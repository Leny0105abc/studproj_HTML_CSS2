<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->string('program', 100)->nullable());
        Schema::create('course_education_levels', function (Blueprint $table) {
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('education_level_id')->constrained()->cascadeOnDelete();
            $table->primary(['course_id', 'education_level_id']);
        });
        // Retain the established shared audience without changing any course row.
        foreach (DB::table('courses')->where('editor_type', 'programming')->pluck('id') as $courseId) {
            foreach (DB::table('education_levels')->whereIn('slug', ['high-school', 'college'])->pluck('id') as $levelId) {
                DB::table('course_education_levels')->insertOrIgnore(['course_id' => $courseId, 'education_level_id' => $levelId]);
            }
        }
        // Existing student classification, credentials and learning records are untouched.
    }

    public function down(): void
    {
        Schema::dropIfExists('course_education_levels');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('program'));
    }
};
