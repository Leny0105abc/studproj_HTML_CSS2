<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WordpressCourseSeeder extends Seeder
{
    public function run(): void
    {
        $contents = json_decode(file_get_contents(database_path('data/wordpress-course.json')), true, flags: JSON_THROW_ON_ERROR);
        if (count($contents) !== 18) {
            throw new \RuntimeException('WordPress requires eighteen authored lessons.');
        }
        DB::transaction(function () use ($contents) {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            $course = Course::firstOrCreate(['slug' => 'wordpress'], ['education_level_id' => $college->id, 'name' => 'WordPress', 'description' => 'Learn WordPress website development, block editing, themes, plugins, forms, users, SEO, security, backups, maintenance, performance, dynamic content, WooCommerce and school portal development.', 'category' => 'Web Development / CMS', 'recommended_prerequisites' => 'HTML & CSS fundamentals recommended. Optional advanced background: basic PHP, SQL/database concepts and Bootstrap/responsive design. Advisory only; teachers may override these recommendations.', 'difficulty' => 'Beginner to Advanced', 'language' => 'WordPress', 'editor_type' => 'wordpress', 'execution_provider' => 'external-authorized-site', 'is_published' => true, 'sequential_gating' => true]);
            if ($course->education_level_id !== $college->id || $course->editor_type !== 'wordpress') {
                throw new \RuntimeException('Existing WordPress slug conflicts; preserve it before resolving.');
            }
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $items = array_slice($contents, $index * 6, 6);
                $assessment = [];
                foreach ($items as $item) {
                    $assessment = array_merge($assessment, array_slice($item['quiz'], 0, 3));
                }
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $index + 1, 'assessment' => $assessment]);
                foreach ($items as $item) {
                    $slug = 'wordpress-'.Str::slug($item['title']);
                    $existing = Lesson::where('slug', $slug)->first();
                    if ($existing && $existing->course_id !== $course->id) {
                        throw new \RuntimeException('WordPress lesson slug belongs to another course.');
                    }
                    Lesson::firstOrCreate(['slug' => $slug], $item + ['number' => max(15, Lesson::max('number') ?? 0) + 1, 'course_id' => $course->id, 'course_module_id' => $module->id, 'auto_complete' => false, 'is_published' => true]);
                }
            }
        });
    }
}
