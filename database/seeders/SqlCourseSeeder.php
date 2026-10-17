<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SqlCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'sql-programming'], [
                'education_level_id' => $college->id, 'name' => 'SQL / Database Programming',
                'description' => 'Build relational databases, write queries and reports, and learn integrity, transactions, normalization, indexing, and database security in an isolated SQLite practice lab.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'SQL', 'editor_type' => 'sql',
                'execution_provider' => 'browser-wasm-sqlite', 'is_published' => true, 'sequential_gating' => true,
            ]);
            $contents = json_decode(file_get_contents(database_path('data/sql-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 10, 10);
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], [
                    'position' => $index + 1,
                    'assessment' => collect($items)->flatMap(fn ($item, $lessonIndex) => [$item['quiz'][$lessonIndex % 4], $item['quiz'][($lessonIndex + 1) % 4]])->values()->all(),
                ]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'sql-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
