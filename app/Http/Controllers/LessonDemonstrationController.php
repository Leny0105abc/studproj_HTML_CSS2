<?php

namespace App\Http\Controllers;

use App\Models\CaseStudy;
use App\Models\Lesson;
use App\Models\LessonDemonstration;
use App\Services\CourseAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonDemonstrationController extends Controller
{
    public function store(Request $request, Lesson $lesson, ?LessonDemonstration $demonstration = null)
    {
        abort_unless($lesson->isApplication(), 404);
        abort_if($demonstration && $demonstration->lesson_id !== $lesson->id, 404);
        if (is_string($request->input('steps'))) {
            $request->merge(['steps' => json_decode($request->input('steps'), true)]);
        }
        $data = $request->validate(['title' => 'required|string|max:150', 'description' => 'required|string|max:3000', 'media_type' => 'required|in:step_sequence,interactive_demo,video,animated_image', 'transcript' => 'nullable|string|max:20000', 'steps' => 'required|array|min:2|max:30', 'steps.*.caption' => 'required|string|max:1500', 'steps.*.command' => 'required|string|max:150', 'steps.*.text' => 'nullable|string|max:2000', 'steps.*.effect' => 'nullable|in:normal,selected,bold,italic,underline,font,color,highlight,copy,clear,left,center,right,justify,spacing,first-indent,hanging-indent,bullets,numbering,border,landscape,margins,columns,picture,table,heading,field', 'display_order' => 'required|integer|min:1|max:100', 'is_required' => 'required|boolean', 'status' => 'required|in:published,draft', 'media' => 'nullable|file|mimes:mp4,webm,gif,webp,png,jpg,jpeg|max:20480']);
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $mime = $file->getMimeType();
            abort_unless(($data['media_type'] === 'video' && in_array($mime, ['video/mp4', 'video/webm'])) || ($data['media_type'] === 'animated_image' && in_array($mime, ['image/gif', 'image/webp', 'image/png', 'image/jpeg'])), 422, 'Choose video for an MP4/WebM or animated image for a GIF/WebP/image.');
            $data['asset_path'] = $file->store('lesson-demonstrations', 'local');
        }
        unset($data['media']);
        $data['lesson_id'] = $lesson->id;
        $data['steps'] = array_map(fn ($s) => array_intersect_key($s, array_flip(['caption', 'command', 'text', 'effect'])), $data['steps']);
        if ($demonstration) {
            $demonstration->update($data);
        } else {
            LessonDemonstration::create($data);
        }

        return back()->with('success', 'Demonstration saved.');
    }

    public function media(Request $request, LessonDemonstration $demonstration)
    {
        $lesson = $demonstration->lesson;
        abort_unless($request->user()->role === 'teacher' || ($demonstration->status === 'published' && CourseAccess::unlocked($request->user(), $lesson)), 403);
        abort_unless($demonstration->asset_path && Storage::disk('local')->exists($demonstration->asset_path), 404);

        return Storage::disk('local')->response($demonstration->asset_path, null, ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }

    public function updateCase(Request $request, CaseStudy $caseStudy)
    {
        abort_unless($caseStudy->isApplication(), 404);
        $data = $request->validate(['title' => 'required|string|max:150', 'scenario' => 'required|string|max:10000', 'application_content' => 'required|array', 'application_content.brief' => 'required|string|max:20000', 'application_content.deliverables' => 'required|array|min:1|max:20', 'application_content.deliverables.*' => 'required|string|max:2000', 'application_content.allowed_uploads' => 'required|array', 'application_content.allowed_uploads.*' => 'required|in:docx,dotx,docm,pdf,xlsx,xlsm', 'rubric' => 'required|array|min:1|max:20', 'rubric.*' => 'required|integer|min:0|max:100']);
        abort_unless(array_sum($data['rubric']) === 100, 422, 'Rubric weights must total 100.');
        $caseStudy->update($data);

        return back()->with('success', 'Case study saved.');
    }
}
