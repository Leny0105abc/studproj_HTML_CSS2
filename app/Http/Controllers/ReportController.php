<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function rows()
    {
        $ids = Lesson::where('is_published', true)->whereHas('course', fn ($q) => $q->where('slug', 'html-css'))->pluck('id');
        $total = max($ids->count(), 1);

        return app(CourseAccess::class)->students(request()->user())->withCount([
            'lessonProgress as completed' => fn ($q) => $q->whereIn('lesson_id', $ids)->where('status', 'completed'),
            'submissions as submissions_count' => fn ($q) => $q->where(fn ($s) => $s->whereIn('lesson_id', $ids)->orWhereHas('caseStudy', fn ($c) => $c->whereHas('course', fn ($course) => $course->where('slug', 'html-css')))),
        ])->orderBy('last_name')->get()->map(fn ($s) => [
            'name' => $s->name, 'username' => $s->username, 'grade' => $s->grade_level, 'section' => $s->section,
            'completed' => $s->completed, 'total' => $total, 'progress' => round($s->completed / $total * 100),
            'submissions' => $s->submissions_count, 'status' => $s->status,
        ]);
    }

    public function index(): Response
    {
        return Inertia::render('reports/index', ['rows' => $this->rows()]);
    }

    public function csv(Request $request): StreamedResponse
    {
        return response()->streamDownload(function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Student', 'Username', 'Grade', 'Section', 'Lessons Completed', 'Total Lessons', 'Progress', 'Submissions', 'Status']);
            foreach ($this->rows() as $row) {
                fputcsv($file, array_map(fn ($value) => is_string($value) && preg_match('/^[\\s]*[=+@-]/', $value) ? "'".$value : $value, $row));
            }
            fclose($file);
        }, 'student-progress-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }
}
