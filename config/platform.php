<?php

use App\Models\Achievement;
use App\Models\Activity;
use App\Models\Announcement;
use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseLevel;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\User;

return [
    'editors' => ['html', 'javascript', 'python', 'java', 'php', 'sql', 'vbnet', 'c', 'cpp', 'scratch', 'none'],
    'providers' => ['browser', 'pyodide', 'sandbox_api', 'sql_sandbox', 'none'],
    'resources' => [
        'education-levels' => [
            'model' => EducationLevel::class, 'label' => 'Education levels', 'admin' => true,
            'rules' => ['name' => 'required|string|max:150', 'slug' => 'required|alpha_dash|max:150', 'description' => 'nullable|string|max:10000',
                'status' => 'required|in:draft,published,archived', 'display_order' => 'required|integer|min:0|max:65000',
                'grade_options' => 'nullable|array', 'grade_options.*' => 'string|max:80', 'program_options' => 'nullable|array', 'program_options.*' => 'string|max:150'],
        ],
        'courses' => [
            'model' => Course::class, 'label' => 'Courses',
            'rules' => ['name' => 'required|string|max:150', 'slug' => 'required|alpha_dash|max:150',
                'short_description' => 'nullable|string|max:500', 'description' => 'nullable|string|max:50000',
                'icon' => 'nullable|string|max:50', 'cover_image' => 'nullable|string|starts_with:/images/,/media/|max:255',
                'difficulty' => 'required|in:Beginner,Intermediate,Advanced', 'status' => 'required|in:draft,published,archived',
                'display_order' => 'required|integer|min:0|max:65000', 'is_featured' => 'boolean',
                'editor_type' => 'required|in:html,javascript,python,java,php,sql,vbnet,c,cpp,scratch,none',
                'execution_provider' => 'required|in:browser,pyodide,sandbox_api,sql_sandbox,none',
                'progression_rule' => 'required|in:completion,activity,quiz,teacher_unlock,none',
                'education_level_ids' => 'required|array|min:1', 'education_level_ids.*' => 'integer|exists:education_levels,id',
                'teacher_ids' => 'sometimes|array', 'teacher_ids.*' => 'integer|exists:users,id'],
        ],
        'modules' => [
            'model' => CourseLevel::class, 'label' => 'Modules',
            'rules' => ['course_id' => 'required|integer|exists:courses,id', 'name' => 'required|string|max:150', 'slug' => 'required|alpha_dash|max:150',
                'description' => 'nullable|string|max:10000', 'display_order' => 'required|integer|min:0|max:65000', 'status' => 'required|in:draft,published,archived'],
        ],
        'lessons' => [
            'model' => Lesson::class, 'label' => 'Lessons',
            'rules' => ['course_id' => 'required|integer|exists:courses,id', 'course_level_id' => 'nullable|integer|exists:course_levels,id',
                'title' => 'required|string|max:150', 'slug' => 'required|alpha_dash|max:150', 'short_description' => 'nullable|string|max:500',
                'position' => 'required|integer|min:1|max:65000', 'is_published' => 'required|boolean',
                'objectives' => 'required|array|min:1', 'objectives.*' => 'string|max:2000',
                'introduction' => 'nullable|string|max:50000', 'explanation' => 'nullable|string|max:50000',
                'lesson_content' => 'nullable|string|max:100000', 'guided_practice' => 'nullable|string|max:50000',
                'activity' => 'nullable|string|max:50000', 'expected_result' => 'nullable|string|max:10000',
                'completion_requirements' => 'nullable|string|max:10000', 'reflection' => 'nullable|string|max:10000',
                'estimated_minutes' => 'nullable|integer|min:1|max:1440', 'prerequisite_id' => 'nullable|integer|exists:lessons,id',
                'starter_code' => 'nullable|string|max:200000', 'example_code' => 'nullable|string|max:200000',
                'example_html' => 'nullable|string|max:200000', 'example_css' => 'nullable|string|max:200000',
                'starter_html' => 'nullable|string|max:200000', 'starter_css' => 'nullable|string|max:200000',
                'activity_html' => 'nullable|string|max:200000', 'activity_css' => 'nullable|string|max:200000',
                'quiz' => 'nullable|array|max:100', 'passing_score' => 'required|integer|between:1,100',
                'attempt_limit' => 'nullable|integer|between:1,1000', 'shuffle_questions' => 'boolean', 'shuffle_choices' => 'boolean'],
        ],
        'activities' => [
            'model' => Activity::class, 'label' => 'Activities',
            'rules' => ['lesson_id' => 'required|integer|exists:lessons,id', 'title' => 'required|string|max:150', 'instructions' => 'required|string|max:50000',
                'activity_type' => 'required|in:coding,written,multiple_choice,true_false,identification,short_answer,code_completion,debugging,project,reflection,file',
                'points' => 'required|integer|between:0,10000', 'status' => 'required|in:draft,published,archived', 'display_order' => 'required|integer|min:0|max:65000'],
        ],
        'projects' => [
            'model' => CaseStudy::class, 'label' => 'Projects',
            'rules' => ['course_id' => 'required|integer|exists:courses,id', 'title' => 'required|string|max:150', 'slug' => 'required|alpha_dash|max:150',
                'scenario' => 'required|string|max:10000', 'instructions' => 'required|string|max:50000',
                'objectives' => 'required|array', 'requirements' => 'required|array', 'concepts' => 'nullable|array',
                'expected_features' => 'nullable|array', 'rubric' => 'required|array', 'difficulty' => 'required|in:Beginner,Intermediate,Advanced',
                'points' => 'required|integer|between:0,10000', 'due_date' => 'nullable|date', 'is_published' => 'required|boolean',
                'starter_html' => 'nullable|string|max:200000', 'starter_css' => 'nullable|string|max:200000'],
        ],
        'enrollments' => [
            'model' => CourseEnrollment::class, 'label' => 'Enrollments',
            'rules' => ['student_id' => 'required|integer|exists:users,id', 'course_id' => 'required|integer|exists:courses,id',
                'status' => 'required|in:active,suspended,completed'],
        ],
        'students' => [
            'model' => User::class, 'label' => 'Student profiles', 'admin' => true,
            'rules' => ['first_name' => 'required|string|max:80', 'last_name' => 'required|string|max:80',
                'education_level_id' => 'nullable|integer|exists:education_levels,id', 'grade_level' => 'nullable|string|max:30',
                'school' => 'nullable|string|max:150', 'academic_program' => 'nullable|string|max:150',
                'section' => 'nullable|string|max:50', 'status' => 'required|in:active,disabled,archived'],
        ],
        'teachers' => [
            'model' => User::class, 'label' => 'Teachers', 'admin' => true,
            'rules' => ['first_name' => 'required|string|max:80', 'last_name' => 'required|string|max:80',
                'status' => 'required|in:active,disabled,archived', 'course_ids' => 'sometimes|array', 'course_ids.*' => 'integer|exists:courses,id'],
        ],
        'announcements' => [
            'model' => Announcement::class, 'label' => 'Announcements', 'admin' => true,
            'rules' => ['title' => 'required|string|max:150', 'description' => 'nullable|string|max:10000', 'course_id' => 'nullable|integer|exists:courses,id', 'status' => 'required|in:draft,published,archived'],
        ],
        'achievements' => [
            'model' => Achievement::class, 'label' => 'Achievements', 'admin' => true,
            'rules' => ['title' => 'required|string|max:150', 'description' => 'nullable|string|max:10000', 'course_id' => 'nullable|integer|exists:courses,id', 'status' => 'required|in:draft,published,archived'],
        ],
    ],
];
