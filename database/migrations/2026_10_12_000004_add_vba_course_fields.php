<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            foreach (['starter_vba', 'example_vba', 'excel_setup', 'worksheet_layout', 'userform_guide'] as $field) {
                $table->longText($field)->nullable();
            }
        });
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->longText('vba_code')->nullable();
                $table->text('vba_workbook_url')->nullable();
                $table->longText('vba_notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_vba', 'example_vba', 'excel_setup', 'worksheet_layout', 'userform_guide']));
        foreach (['student_lesson_progress', 'submissions'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn(['vba_code', 'vba_workbook_url', 'vba_notes']));
        }
    }
};
