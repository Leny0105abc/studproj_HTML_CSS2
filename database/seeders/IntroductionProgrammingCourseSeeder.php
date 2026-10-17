<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\EducationLevel;
use App\Models\Lesson;
use App\Services\ProgrammingExamples;
use App\Services\ProgrammingFlowchart;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntroductionProgrammingCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $college = EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
            // Match an existing course by slug or exact title; preserve its ID and records.
            $course = Course::where('slug', 'introduction-to-programming')->orWhere('name', 'Introduction to Programming')->first();
            if (! $course) {
                $course = Course::create(['slug' => 'introduction-to-programming', 'name' => 'Introduction to Programming', 'education_level_id' => $college->id, 'description' => 'Learn programming logic through problems, algorithms, pseudocode, and flowcharts. Implement one solution in Python, C++17, and Java 17 across 30 lessons and three levels.', 'difficulty' => 'Beginner to Advanced', 'language' => 'Python / C++ / Java', 'editor_type' => 'programming', 'execution_provider' => 'existing-language-sandboxes', 'is_published' => true, 'sequential_gating' => true]);
            }
            $course->update(['editor_type' => 'programming', 'execution_provider' => 'existing-language-sandboxes', 'language' => 'Python / C++ / Java']);
            EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
            $course->educationLevels()->syncWithoutDetaching(EducationLevel::whereIn('slug', ['high-school', 'college'])->pluck('id'));
            $items = json_decode(file_get_contents(database_path('data/programming-course.json')), true, flags: JSON_THROW_ON_ERROR);
            $flowchart = new ProgrammingFlowchart;
            foreach (['Beginner', 'Intermediate', 'Advanced'] as $index => $name) {
                $module = CourseModule::firstOrCreate(['course_id' => $course->id, 'name' => $name], ['position' => $index + 1, 'assessment' => array_merge(...array_map(fn ($item) => array_slice($item['quiz'], 0, 2), array_slice($items, $index * 10, 10)))]);
                foreach (array_slice($items, $index * 10, 10) as $item) {
                    $number = $item['number'];
                    $graph = ProgrammingExamples::make($number);
                    $programs = $flowchart->generate($graph);
                    $plan = $flowchart->plan($graph);
                    // Existing lesson identities and student references remain intact. Seeded material can
                    // be revised explicitly by teachers; reruns preserve their authored programming content.
                    $lesson = Lesson::where('course_id', $course->id)->where('position', $number)->first();
                    if ($lesson?->programming_content) {
                        continue;
                    }
                    $fields = [
                        'course_id' => $course->id, 'course_module_id' => $module->id, 'position' => $number,
                        'title' => $item['title'], 'level' => $name, 'objectives' => $item['objectives'],
                        'introduction' => $item['problem'], 'explanation' => $item['discussion'], 'syntax' => $plan['pseudocode'],
                        'guided_practice' => implode("\n\n", $item['exercises']['guided']), 'activity' => implode("\n\n", $item['exercises']['independent']),
                        'expected_result' => $item['outputs'], 'quiz' => $item['quiz'],
                        'programming_content' => array_diff_key($item, ['quiz' => true]) + ['graph' => $graph, 'plan' => $plan],
                        'starter_python' => $programs['python']['code'], 'example_python' => $programs['python']['code'],
                        'starter_cpp' => $programs['cpp']['code'], 'example_cpp' => $programs['cpp']['code'],
                        'starter_java' => $programs['java']['code'], 'example_java' => $programs['java']['code'],
                        'is_project' => in_array($number, [10, 20, 30]), 'auto_complete' => false,
                        'rubric' => in_array($number, [10, 20, 30]) ? ['analysis_and_plan' => 20, 'flowchart_logic' => 25, 'three_implementations' => 30, 'tests_and_documentation' => 25] : null,
                        'completion_requirements' => 'Submit your plan, graph, three programs, and test notes; score at least 8/10 on the quiz and receive teacher approval.',
                    ];
                    if ($lesson) {
                        $lesson->update($fields);
                    } else {
                        Lesson::create($fields + ['number' => max(15, Lesson::max('number') ?? 0) + 1, 'slug' => 'intro-programming-'.Str::slug($item['title']), 'starter_html' => '', 'starter_css' => '', 'is_published' => true]);
                    }
                }
            }
        });
    }
}
