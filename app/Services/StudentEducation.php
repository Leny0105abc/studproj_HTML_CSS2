<?php

namespace App\Services;

use App\Models\EducationLevel;
use Illuminate\Validation\Rule;

class StudentEducation
{
    public static function messages(): array
    {
        return [
            'education_level_id.required' => 'Education Level is required. Select High School or College.',
            'education_level_id.exists' => 'Invalid education level. Select High School or College.',
            'grade_level.regex' => 'Use Grade 7–12 for High School, or Year 1–6 (for example 1st Year) for College.',
            'confirm_level_change.required' => 'Acknowledge the course-access warning before changing this student’s education level.',
        ];
    }

    public static function rules(array $data): array
    {
        $college = EducationLevel::whereKey($data['education_level_id'] ?? null)->where('slug', 'college')->exists();

        return [
            'education_level_id' => ['required', Rule::exists('education_levels', 'id')->whereIn('slug', ['high-school', 'college'])],
            'grade_level' => ['required', 'string', 'max:30', $college
                ? 'regex:/^(?:[1-6](?:st|nd|rd|th)?(?:\s*Year)?|Year\s*[1-6]|(?:First|Second|Third|Fourth|Fifth|Sixth)\s+Year)$/i'
                : 'regex:/^(?:Grade\s*)?(?:7|8|9|10|11|12)$/i'],
            'section' => 'required|string|max:50',
            'program' => $college ? 'nullable|string|max:100' : 'exclude',
        ];
    }
}
