<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_java')->nullable();
            $table->longText('example_java')->nullable();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->longText('java_code')->nullable());
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_java', 'example_java']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('java_code'));
        }
    }
};
