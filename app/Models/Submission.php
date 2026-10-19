<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['application_workspace' => 'array', 'programming_workspace' => 'array', 'submitted_at' => 'datetime', 'reviewed_at' => 'datetime', 'wordpress_evidence' => 'array', 'extra_files' => 'array', 'rubric_scores' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function caseStudy(): BelongsTo
    {
        return $this->belongsTo(CaseStudy::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(TeacherFeedback::class)->orderBy('id');
    }
}
