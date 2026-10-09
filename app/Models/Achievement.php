<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    protected $fillable = ['title', 'description', 'course_id', 'status'];

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('awarded_at');
    }
}
