<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $guarded = [];

    protected $appends = ['audience_label', 'is_shared'];

    public function scopeInLearningOrder(Builder $query, User $user): Builder
    {
        if ($user->role === 'teacher' || ($user->role === 'student' && $user->educationLevel?->slug === 'college')) {
            $query->orderByRaw('CASE WHEN slug = ? OR name = ? THEN 0 ELSE 1 END', ['introduction-to-programming', 'Introduction to Programming']);
        }

        return $query->orderBy('id');
    }

    public function getIsSharedAttribute(): bool
    {
        return $this->educationLevels->pluck('id')->push($this->education_level_id)->unique()->count() > 1;
    }

    public function getAudienceLabelAttribute(): string
    {
        return $this->is_shared ? 'High School & College' : ($this->educationLevel?->name ?? 'Education Level Not Assigned');
    }

    protected function casts(): array
    {
        return ['education_level_id' => 'integer', 'is_published' => 'boolean', 'sequential_gating' => 'boolean'];
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('position');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }

    public function accessibleTo(User $user): bool
    {
        if ($user->role === 'teacher') {
            return true;
        }

        return $user->role === 'student' && $this->is_published && $this->compatibleWith($user);
    }

    public function educationLevels(): BelongsToMany
    {
        return $this->belongsToMany(EducationLevel::class, 'course_education_levels');
    }

    public function compatibleWith(User $user): bool
    {
        return $user->educationLevel && in_array($user->educationLevel->slug, ['high-school', 'college'], true)
            && ($this->education_level_id === $user->education_level_id || $this->educationLevels->contains('id', $user->education_level_id));
    }
}
