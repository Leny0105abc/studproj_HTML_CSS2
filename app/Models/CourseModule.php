<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseModule extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['assessment' => 'array'];
    }
}
