<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseStudy extends Model
{
    protected $guarded = [];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'course_module_id');
    }

    public function isApplication(): bool
    {
        return in_array($this->course?->editor_type, ['office-word', 'office-excel'], true);
    }

    protected function casts(): array
    {
        return ['application_content' => 'array', 'objectives' => 'array', 'requirements' => 'array', 'concepts' => 'array', 'expected_features' => 'array', 'rubric' => 'array', 'is_published' => 'boolean'];
    }
}
