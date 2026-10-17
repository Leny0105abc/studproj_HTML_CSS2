<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Services\CourseAccess;
use App\Services\VbnetSandbox;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

class VbnetRunController extends Controller
{
    public function __invoke(Request $request, Lesson $lesson, VbnetSandbox $sandbox)
    {
        abort_unless($lesson->isVbnet() && CourseAccess::unlocked($request->user(), $lesson), 403);
        abort_if($lesson->vbnet_mode === 'winforms', 422, 'Windows Forms runs in Visual Studio on Windows, not in the CodeLab console sandbox.');
        if ($request->isJson()) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw)) {
                $request->merge(Arr::only($raw, ['code', 'input']));
            }
        }
        $data = $request->validate(['code' => 'required|string|max:200000', 'input' => 'nullable|string|max:20000']);
        $lock = Cache::lock('vbnet-run:'.$request->user()->id, 40);
        if (! $lock->get()) {
            return response()->json(['message' => 'A VB.NET run is already in progress.'], 429);
        }
        try {
            return response()->json($sandbox->run($data['code'], $data['input'] ?? ''));
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        } catch (\Throwable) {
            return response()->json(['message' => 'The isolated VB.NET service could not be reached. Try again later.'], 503);
        } finally {
            $lock->release();
        }
    }
}
