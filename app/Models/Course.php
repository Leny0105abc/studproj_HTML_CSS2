<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = ['name', 'slug', 'short_description', 'description', 'icon', 'cover_image', 'difficulty', 'status', 'display_order', 'is_featured', 'editor_type', 'execution_provider', 'progression_rule'];

    protected function casts(): array
    {
        return ['is_featured' => 'boolean'];
    }

    public function educationLevels(): BelongsToMany
    {
        return $this->belongsToMany(EducationLevel::class);
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_teacher');
    }

    public function levels(): HasMany
    {
        return $this->hasMany(CourseLevel::class)->orderBy('display_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position')->orderBy('id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(CaseStudy::class)->orderBy('number');
    }
}
