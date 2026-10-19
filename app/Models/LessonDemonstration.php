<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonDemonstration extends Model
{
    protected $guarded = [];

    protected $hidden = ['asset_path'];

    protected function casts(): array
    {
        return ['steps' => 'array', 'is_required' => 'boolean'];
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
