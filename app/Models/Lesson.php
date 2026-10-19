<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $guarded = [];

    public function isApplication(): bool
    {
        return in_array($this->course?->editor_type, ['office-word', 'office-excel'], true);
    }

    public function demonstrations(): HasMany
    {
        return $this->hasMany(LessonDemonstration::class)->orderBy('display_order')->orderBy('id');
    }

    protected function casts(): array
    {
        return ['application_content' => 'array', 'programming_content' => 'array', 'objectives' => 'array', 'guide' => 'array', 'quiz' => 'array', 'block_examples' => 'array', 'validation_rules' => 'array', 'rubric' => 'array', 'is_project' => 'boolean', 'auto_complete' => 'boolean', 'is_published' => 'boolean'];
    }

    public function progress(): HasMany
    {
        return $this->hasMany(StudentLessonProgress::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function isProgramming(): bool
    {
        return $this->course?->editor_type === 'programming';
    }

    public function isWordpress(): bool
    {
        return $this->course?->editor_type === 'wordpress';
    }

    public function isTailwind(): bool
    {
        return $this->course?->editor_type === 'html-tailwind';
    }

    public function isBootstrap(): bool
    {
        return $this->course?->editor_type === 'html-css-bootstrap';
    }

    public function isWebWorkspace(): bool
    {
        return $this->isJavascript() || $this->isBootstrap() || $this->isTailwind();
    }

    public function isPython(): bool
    {
        return $this->course?->editor_type === 'python';
    }

    public function isScratch(): bool
    {
        return $this->course?->editor_type === 'scratch';
    }

    public function requiresTeacherReview(): bool
    {
        return $this->isProgramming() || $this->isTailwind() || $this->isWordpress() || $this->isBootstrap() || $this->isPython() || $this->isScratch() || $this->isPhp() || $this->isCpp() || $this->isJava() || $this->isSql() || $this->isJavascript() || $this->isCsharp() || $this->isVbnet() || $this->isVba() || $this->isGoogleAppsScript();
    }

    public function isGoogleAppsScript(): bool
    {
        return $this->course?->editor_type === 'google-apps-script';
    }

    public function isVba(): bool
    {
        return $this->course?->editor_type === 'vba';
    }

    public function isCsharp(): bool
    {
        return $this->course?->editor_type === 'csharp';
    }

    public function isVbnet(): bool
    {
        return $this->course?->editor_type === 'vbnet';
    }

    public function isJavascript(): bool
    {
        return $this->course?->editor_type === 'javascript';
    }

    public function isSql(): bool
    {
        return $this->course?->editor_type === 'sql';
    }

    public function isJava(): bool
    {
        return $this->course?->editor_type === 'java';
    }

    public function isCpp(): bool
    {
        return $this->course?->editor_type === 'cpp';
    }

    public function isPhp(): bool
    {
        return $this->course?->editor_type === 'php';
    }
}
