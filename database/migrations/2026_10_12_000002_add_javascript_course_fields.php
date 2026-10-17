<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('starter_javascript')->nullable();
            $table->longText('example_javascript')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn(['starter_javascript', 'example_javascript']));
    }
};
