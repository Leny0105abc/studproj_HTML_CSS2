<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CsharpCourseSeeder extends Seeder
{
    public function run(): void
    {
        $contents = json_decode(file_get_contents(database_path('data/csharp-course.json')), true, flags: JSON_THROW_ON_ERROR);
        if (count($contents) !== 18) {
            throw new \RuntimeException('C# requires exactly eighteen authored lessons.');
        }
        DB::transaction(function () use ($contents) {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'csharp-programming'], [
                'education_level_id' => $college->id, 'name' => 'C# Programming',
                'description' => 'Learn C# and .NET programming, collections, object-oriented development, LINQ, generics, events, asynchronous programming, isolated database access, secure application architecture, and complete applications.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'C#', 'editor_type' => 'csharp',
                'execution_provider' => 'isolated-dotnet-service', 'is_published' => true, 'sequential_gating' => true,
            ]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'csharp') {
                throw new \RuntimeException('Existing C# slug belongs to a different course; preserve it before resolving the conflict.');
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
                    Lesson::firstOrCreate(['slug' => 'csharp-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
