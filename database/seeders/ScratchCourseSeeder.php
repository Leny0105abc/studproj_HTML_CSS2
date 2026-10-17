<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ScratchCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $school = EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
            $course = Course::firstOrCreate(['slug' => 'scratch-programming'], [
                'education_level_id' => $school->id, 'name' => 'Scratch Programming',
                'description' => 'Learn programming visually by creating animations, interactive stories, and games with Scratch. Develop computational thinking, logic, creativity, problem solving, and debugging through sequencing, events, loops, sensing, variables, lists, cloning, custom blocks, and progressively challenging game projects.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'Visual / Block-Based Programming',
                'editor_type' => 'scratch', 'execution_provider' => 'scratch-link', 'is_published' => true,
            ]);
            $contents = json_decode(file_get_contents(database_path('data/scratch-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 10, 10);
                $assessment = collect($items)->flatMap(fn ($item) => array_slice($item['quiz'], 0, 2))->values()->all();
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $index + 1, 'assessment' => $assessment]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'scratch-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
