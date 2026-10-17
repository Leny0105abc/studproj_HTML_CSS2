<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PhpCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'php-programming'], [
                'education_level_id' => $college->id, 'name' => 'PHP Programming',
                'description' => 'Learn server-side web programming, databases, authentication, APIs, and secure PHP application development. Progress from syntax, variables, control structures, arrays, and functions to forms, sessions, MySQL, object-oriented programming, MVC, and practical web applications.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'PHP', 'editor_type' => 'php',
                'execution_provider' => 'browser-wasm', 'is_published' => true, 'sequential_gating' => true,
            ]);
            $contents = json_decode(file_get_contents(database_path('data/php-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 10, 10);
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], [
                    'position' => $index + 1,
                    'assessment' => collect($items)->flatMap(fn ($item) => array_slice($item['quiz'], 0, 2))->values()->all(),
                ]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'php-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
