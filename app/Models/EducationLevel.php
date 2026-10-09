<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EducationLevel extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'status', 'display_order', 'grade_options', 'program_options'];

    protected function casts(): array
    {
        return ['grade_options' => 'array', 'program_options' => 'array'];
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class);
    }
}
