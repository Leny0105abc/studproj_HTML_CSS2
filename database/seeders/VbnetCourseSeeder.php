<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VbnetCourseSeeder extends Seeder
{
    public function run(): void
    {
        $contents = json_decode(file_get_contents(database_path('data/vbnet-course.json')), true, flags: JSON_THROW_ON_ERROR);
        if (count($contents) !== 18) {
            throw new \RuntimeException('VB.NET requires exactly eighteen authored lessons.');
        }
        DB::transaction(function () use ($contents) {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'visual-basic-dotnet'], [
                'education_level_id' => $college->id, 'name' => 'Visual Basic .NET',
                'description' => 'Learn VB.NET programming, Windows Forms, object-oriented programming, file handling, LINQ, ADO.NET databases, validation, secure coding, and complete desktop application development.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'Visual Basic .NET', 'editor_type' => 'vbnet',
                'execution_provider' => 'isolated-dotnet-service', 'is_published' => true, 'sequential_gating' => true,
            ]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'vbnet') {
                throw new \RuntimeException('Existing VB.NET slug belongs to a different course; preserve it before resolving the conflict.');
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
                    Lesson::firstOrCreate(['slug' => 'vbnet-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
