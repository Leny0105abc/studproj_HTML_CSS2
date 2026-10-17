<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JavascriptCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'javascript-programming'], [
                'education_level_id' => $college->id, 'name' => 'JavaScript Programming',
                'description' => 'Learn JavaScript from variables, operators, conditions, arrays, and functions to objects, DOM events, modules, classes, asynchronous programming, APIs, storage, testing, and interactive student applications.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'JavaScript', 'editor_type' => 'javascript',
                'execution_provider' => 'browser-javascript-sandbox', 'is_published' => true, 'sequential_gating' => true,
            ]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'javascript') {
                throw new \RuntimeException('The javascript-programming slug belongs to a different course. Preserve it and choose a separate College slug before seeding.');
            }
            $contents = json_decode(file_get_contents(database_path('data/javascript-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 6, 6);
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], [
                    'position' => $index + 1,
                    'assessment' => collect($items)->flatMap(fn ($item, $i) => [$item['quiz'][$i % 5], $item['quiz'][($i + 1) % 5]])->values()->all(),
                ]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'college-javascript-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
