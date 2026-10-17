<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TailwindCourseSeeder extends Seeder
{
    public function run(): void
    {
        $contents = json_decode(file_get_contents(database_path('data/tailwind-course.json')), true, flags: JSON_THROW_ON_ERROR);
        if (count($contents) !== 18) {
            throw new \RuntimeException('Tailwind CSS requires eighteen authored lessons.');
        }
        DB::transaction(function () use ($contents) {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'tailwind-css'], ['education_level_id' => $college->id, 'name' => 'Tailwind CSS', 'description' => 'Learn utility-first CSS, responsive layouts, Flexbox, Grid, forms, state variants, animation, dark mode, design systems and Tailwind-powered interface development.', 'category' => 'Web Development / Front-End', 'recommended_prerequisites' => 'HTML & CSS fundamentals; basic JavaScript recommended before Advanced interactive topics. Optional React fundamentals for external React activities. Advisory only; teachers can change these recommendations.', 'difficulty' => 'Beginner to Advanced', 'language' => 'Tailwind CSS', 'editor_type' => 'html-tailwind', 'execution_provider' => 'browser-tailwind-sandbox', 'is_published' => true, 'sequential_gating' => true]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'html-tailwind') {
                throw new \RuntimeException('Existing Tailwind CSS slug belongs to a different course; preserve it before resolving the conflict.');
            }
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 6, 6);
                $assessment = [];
                foreach ($items as $i => $item) {
                    for ($q = 0; $q < 3; $q++) {
                        $assessment[] = $item['quiz'][($i + $q) % 5];
                    }
                }
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $index + 1, 'assessment' => $assessment]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'tailwind-'.Str::slug($item['title'])], $item + ['number' => max(15, Lesson::max('number') ?? 0) + 1, 'course_id' => $course->id, 'course_module_id' => $module->id, 'auto_complete' => false, 'is_published' => true]);
                }
            }
        });
    }
}
