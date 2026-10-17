<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_vbnet')->nullable();
            $table->longText('example_vbnet')->nullable();
            $table->string('vbnet_mode')->default('console');
            $table->longText('vbnet_form_guide')->nullable();
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('vbnet_code')->nullable();
                $table->text('vbnet_project_url')->nullable();
                $table->longText('vbnet_notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_vbnet', 'example_vbnet', 'vbnet_mode', 'vbnet_form_guide']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['vbnet_code', 'vbnet_project_url', 'vbnet_notes']));
        }
    }
};
