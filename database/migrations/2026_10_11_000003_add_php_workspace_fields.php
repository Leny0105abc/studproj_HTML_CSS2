<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_php')->nullable();
            $table->longText('example_php')->nullable();
            $table->text('security_note')->nullable();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('php_code')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_php', 'example_php', 'security_note']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('php_code'));
        }
    }
};
