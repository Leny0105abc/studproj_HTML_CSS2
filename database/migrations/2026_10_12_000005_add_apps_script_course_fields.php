<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            foreach (['starter_apps_script', 'example_apps_script', 'workspace_setup', 'form_setup', 'sheet_setup', 'authorization_note', 'quota_note'] as $field) {
                $table->longText($field)->nullable();
            }
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('apps_script_code')->nullable();
                $table->text('apps_script_project_url')->nullable();
                $table->longText('apps_script_notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_apps_script', 'example_apps_script', 'workspace_setup', 'form_setup', 'sheet_setup', 'authorization_note', 'quota_note']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['apps_script_code', 'apps_script_project_url', 'apps_script_notes']));
        }
    }
};
