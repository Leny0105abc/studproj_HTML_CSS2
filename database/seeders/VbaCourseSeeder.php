<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VbaCourseSeeder extends Seeder
{
    public function run(): void
    {
        $contents = json_decode(file_get_contents(database_path('data/vba-course.json')), true, flags: JSON_THROW_ON_ERROR);
        if (count($contents) !== 18) {
            throw new \RuntimeException('Excel VBA requires exactly eighteen authored lessons.');
        }
        DB::transaction(function () use ($contents) {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'excel-vba-application'], [
                'education_level_id' => $college->id, 'name' => 'Excel VBA Application',
                'description' => 'Learn Excel automation, VBA macros, variables, ranges, procedures, events, UserForms, arrays, collections, reports, external files, ADO practice databases, performance, macro security, and complete Excel-based applications.',
                'difficulty' => 'Beginner to Advanced', 'language' => 'VBA for Microsoft Excel', 'editor_type' => 'vba',
                'execution_provider' => 'instructional-excel-desktop', 'is_published' => true, 'sequential_gating' => true,
            ]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'vba') {
                throw new \RuntimeException('Existing Excel VBA slug belongs to a different course; preserve it before resolving the conflict.');
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
                    Lesson::firstOrCreate(['slug' => 'vba-'.Str::slug($item['title'])], $item + [
                        'number' => max(15, Lesson::max('number') ?? 0) + 1,
                        'course_id' => $course->id, 'course_module_id' => $module->id,
                        'starter_html' => '', 'starter_css' => '', 'auto_complete' => false, 'is_published' => true,
                    ]);
                }
            }
        });
    }
}
