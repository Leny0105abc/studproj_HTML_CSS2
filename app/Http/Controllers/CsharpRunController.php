<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Services\CourseAccess;
use App\Services\CsharpSandbox;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

class CsharpRunController extends Controller
{
    public function __invoke(Request $request, Lesson $lesson, CsharpSandbox $sandbox)
    {
        abort_unless($lesson->isCsharp() && CourseAccess::unlocked($request->user(), $lesson), 403);
        abort_if($lesson->csharp_mode !== 'console', 422, 'Desktop/web projects run in the learner development environment, not in the CodeLab console sandbox.');
        if ($request->isJson()) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw)) {
                $request->merge(Arr::only($raw, ['code', 'input']));
            }
        }
        $data = $request->validate(['code' => 'required|string|max:200000', 'input' => 'nullable|string|max:20000']);
        $lock = Cache::lock('csharp-run:'.$request->user()->id, 40);
        if (! $lock->get()) {
            return response()->json(['message' => 'A C# run is already in progress.'], 429);
        }
        try {
            return response()->json($sandbox->run($data['code'], $data['input'] ?? ''));
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        } catch (\Throwable) {
            return response()->json(['message' => 'The isolated C# service could not be reached. Try again later.'], 503);
        } finally {
            $lock->release();
        }
    }
}
