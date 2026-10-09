<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseStudy extends Model
{
    protected $guarded = [];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    protected function casts(): array
    {
        return ['objectives' => 'array', 'requirements' => 'array', 'concepts' => 'array', 'expected_features' => 'array', 'rubric' => 'array', 'is_published' => 'boolean'];
    }
}
