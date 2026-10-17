<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Services\CourseAccess;
use App\Services\JavaSandbox;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class JavaRunController extends Controller
{
    public function __invoke(Request $request, Lesson $lesson, JavaSandbox $sandbox)
    {
        abort_unless(($lesson->isJava() || $lesson->isProgramming()) && CourseAccess::unlocked($request->user(), $lesson), 403);
        $data = $request->validate(['code' => 'required|string|max:200000', 'input' => 'nullable|string|max:20000']);
        $lock = Cache::lock('java-run:'.$request->user()->id, 40);
        if (! $lock->get()) {
            return response()->json(['message' => 'A Java run is already in progress. Please wait.'], 429);
        }
        try {
            return response()->json($sandbox->run($data['code'], $data['input'] ?? ''));
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        } catch (\Throwable) {
            // Never return service credentials, network diagnostics, or response bodies.
            return response()->json(['message' => 'The Java sandbox could not be reached. Try again later.'], 503);
        } finally {
            $lock->release();
        }
    }
}
