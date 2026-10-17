<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_sql')->nullable();
            $table->longText('example_sql')->nullable();
            $table->longText('sql_seed')->nullable();
            $table->text('dialect_note')->nullable();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->longText('sql_code')->nullable());
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_sql', 'example_sql', 'sql_seed', 'dialect_note']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('sql_code'));
        }
    }
};
