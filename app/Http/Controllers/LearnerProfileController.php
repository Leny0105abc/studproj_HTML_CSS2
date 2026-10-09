<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LearnerProfileController extends Controller
{
    public function edit(Request $request)
    {
        return Inertia::render('platform/profile', ['profile' => $request->user()->only('first_name', 'last_name', 'grade_level', 'section', 'school', 'academic_program', 'profile_picture'),
            'program' => $request->user()->educationLevel, 'pictureUrl' => $request->user()->profile_picture ? route('learner-profile.picture') : null]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['first_name' => 'nullable|string|max:80', 'last_name' => 'nullable|string|max:80', 'grade_level' => 'nullable|string|max:30',
            'section' => 'nullable|string|max:50', 'school' => 'nullable|string|max:150', 'academic_program' => 'nullable|string|max:150',
            'picture' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048']);
        if ($request->hasFile('picture')) {
            $data['profile_picture'] = $request->file('picture')->store('profile-pictures', 'local');
        }
        unset($data['picture']);
        $previous = $request->user()->profile_picture;
        $request->user()->update($data);
        if (isset($data['profile_picture']) && $previous) {
            Storage::disk('local')->delete($previous);
        }

        return back()->with('success', 'Learning profile updated.');
    }

    public function picture(Request $request)
    {
        $path = $request->user()->profile_picture;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path), ['X-Content-Type-Options' => 'nosniff']);
    }
}
