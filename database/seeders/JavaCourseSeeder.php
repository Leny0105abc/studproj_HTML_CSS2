<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JavaCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'java-programming'], [
                'education_level_id' => $college->id, 'name' => 'Java Programming',
                'description' => 'Learn Java programming, object-oriented development, collections, databases, APIs, multithreading, and application design. Progress from syntax, input/output, arrays, and methods to encapsulation, inheritance, polymorphism, generics, streams, safe file handling, JDBC, secure coding, and practical student information systems.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'Java', 'editor_type' => 'java',
                'execution_provider' => 'isolated-java-service', 'is_published' => true, 'sequential_gating' => true,
            ]);
            $contents = json_decode(file_get_contents(database_path('data/java-course.json')), true, flags: JSON_THROW_ON_ERROR);
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 10, 10);
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], [
                    'position' => $index + 1,
                    'assessment' => collect($items)->flatMap(fn ($item, $lessonIndex) => [$item['quiz'][$lessonIndex % 4], $item['quiz'][($lessonIndex + 1) % 4]])->values()->all(),
                ]);
                foreach ($items as $item) {
                    Lesson::firstOrCreate(['slug' => 'java-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
