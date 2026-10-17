<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseEnrollment extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['assessment_results' => 'array', 'started_at' => 'datetime'];
    }
}
