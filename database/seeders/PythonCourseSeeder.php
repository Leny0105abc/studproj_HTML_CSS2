<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PythonCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            // Preserve teacher edits when rerun. No existing account or curriculum seeder is invoked.
            $course = Course::firstOrCreate(['slug' => 'python-programming'], [
                'education_level_id' => $college->id, 'name' => 'Python Programming',
                'description' => 'Python Programming develops programming fundamentals, problem solving, logical thinking, and debugging through progressive coding exercises and projects. Learn syntax, input/output, decisions, loops, lists, functions, data structures, files, OOP, modules, APIs, and databases.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'Python', 'editor_type' => 'python', 'execution_provider' => 'pyodide', 'is_published' => true,
            ]);
            $contents = json_decode(file_get_contents(database_path('data/python-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Basic', 'Moderate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 10, 10);
                // Twenty questions sampled from distinct lesson checks; no large question bank.
                $assessment = collect($items)->flatMap(fn ($item) => array_slice($item['quiz'], 0, 2))->values()->all();
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $index + 1, 'assessment' => $assessment]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'python-'.Str::slug($item['title'])], $item + [
                        // The legacy HTML seeder owns numbers 1–15, even on an empty installation.
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
