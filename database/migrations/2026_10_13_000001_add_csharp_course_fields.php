<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_csharp')->nullable();
            $table->longText('example_csharp')->nullable();
            $table->string('csharp_mode')->nullable();
            $table->longText('csharp_project_guide')->nullable();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('csharp_code')->nullable();
                $table->text('csharp_project_url')->nullable();
                $table->longText('csharp_notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_csharp', 'example_csharp', 'csharp_mode', 'csharp_project_guide']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['csharp_code', 'csharp_project_url', 'csharp_notes']));
        }
    }
};
