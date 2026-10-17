<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('category')->nullable();
            $table->text('recommended_prerequisites')->nullable();
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->text('accessibility_tip')->nullable();
            $table->text('responsive_tip')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('courses', fn (Blueprint $table) => $table->dropColumn(['category', 'recommended_prerequisites']));
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['accessibility_tip', 'responsive_tip']));
    }
};
