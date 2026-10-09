<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    protected $fillable = ['lesson_id', 'title', 'instructions', 'activity_type', 'points', 'status', 'display_order'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(ActivityResponse::class);
    }
}
