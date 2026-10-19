<?php

namespace Database\Seeders;

use App\Models\CaseStudy;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Models\LessonDemonstration;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MicrosoftWordCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $school = EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
            $course = Course::firstOrCreate(['slug' => 'microsoft-word-application'], ['name' => 'Microsoft Word Application', 'education_level_id' => $school->id, 'description' => 'Learn Microsoft Word through step-by-step demonstrations, animated formatting examples, practical exercises, and real school-based case studies.', 'category' => 'Computer Applications / Productivity Software', 'difficulty' => 'Beginner to Advanced', 'language' => 'Microsoft Word', 'editor_type' => 'office-word', 'is_published' => true, 'sequential_gating' => true]);
            $data = json_decode(file_get_contents(database_path('data/word-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $i => $name) {
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $i + 1, 'assessment' => []]);
                foreach (array_slice($data['lessons'], $i * 5, 5) as $item) {
                    $lesson = Lesson::firstOrCreate(['course_id' => $course->id, 'position' => $item['position']], ['number' => max(15, Lesson::max('number') ?? 0) + 1, 'slug' => 'word-'.Str::slug($item['title']), 'course_module_id' => $module->id, 'level' => $name, 'title' => $item['title'], 'objectives' => $item['objectives'], 'introduction' => $item['introduction'], 'explanation' => $item['explanation'], 'guided_practice' => $item['guided_practice'], 'activity' => $item['activity'], 'expected_result' => $item['expected_result'], 'application_content' => $item['application_content'], 'quiz' => $item['quiz'], 'auto_complete' => true, 'is_project' => false, 'starter_html' => '', 'starter_css' => '', 'is_published' => true, 'completion_requirements' => 'Read the required content, view the required demonstrations, pass at least 4/5 on the Quick Check, finish all four self-checks and submit the practical document. Teacher grading is not required for normal lesson progression.']);
                    foreach ($item['demonstrations'] as $demo) {
                        LessonDemonstration::firstOrCreate(['lesson_id' => $lesson->id, 'key' => $demo['key']], array_diff_key($demo, ['key' => true]));
                    }
                }
                $case = $data['cases'][$i];
                CaseStudy::firstOrCreate(['slug' => 'word-'.Str::slug($case['title'])], ['number' => max(5, CaseStudy::max('number') ?? 0) + 1, 'course_id' => $course->id, 'course_module_id' => $module->id, 'title' => $case['title'], 'scenario' => $case['brief'], 'objectives' => ['Apply the '.$name.' Word skills in a school-based project', 'Inspect accuracy, privacy and accessibility before submission'], 'requirements' => $case['deliverables'], 'instructions' => $case['brief'], 'concepts' => ['Microsoft Word', $name, 'Document production'], 'expected_features' => $case['deliverables'], 'rubric' => $case['rubric'], 'application_content' => array_diff_key($case, ['rubric' => true]), 'starter_html' => '', 'starter_css' => '', 'is_published' => true]);
            }
        });
    }
}
