<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $guarded = [];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function courseLevel(): BelongsTo
    {
        return $this->belongsTo(CourseLevel::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->orderBy('display_order');
    }

    public function usesLegacyLab(): bool
    {
        return ! $this->course_id || $this->course?->slug === 'html-css';
    }

    protected function casts(): array
    {
        return ['objectives' => 'array', 'guide' => 'array', 'quiz' => 'array', 'validation_rules' => 'array', 'auto_complete' => 'boolean', 'is_published' => 'boolean'];
    }

    public function progress(): HasMany
    {
        return $this->hasMany(StudentLessonProgress::class);
    }
}
