<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequireStudentPasswordChange;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => EnsureRole::class]);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        // Whitespace and blank lines are meaningful Java source/stdin.
        $middleware->trimStrings(except: [fn (Request $request) => $request->is('code-lab/*/java/run')]);

        $middleware->web(append: [
            HandleAppearance::class,
            RequireStudentPasswordChange::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            // An expired session is already signed out. Refresh the page instead
            // of showing Inertia's error dialog for its stale logout request.
            if ($response->getStatusCode() === 419
                && $request->isMethod('post')
                && $request->routeIs('logout')
                && ! $request->user()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return $request->header('X-Inertia')
                    ? Inertia::location(route('login'))
                    : redirect()->route('login', status: 303);
            }

            return $response;
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
