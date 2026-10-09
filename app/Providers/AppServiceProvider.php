<?php

namespace App\Providers;

use App\Models\Course;
use App\Models\User;
use App\Policies\CoursePolicy;
use App\Services\CourseAccess;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Gate::policy(Course::class, CoursePolicy::class);
        Gate::define('platform-admin', fn (User $user) => $user->role === 'admin' && $user->status === 'active');
        Gate::define('manage-student', fn (User $user, User $student) => $user->status === 'active' && in_array($user->role, ['admin', 'teacher']) &&
            app(CourseAccess::class)->students($user)->whereKey($student->id)->exists());
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->when(! config('lab.offline'), fn (Password $rule) => $rule->uncompromised())
            : null,
        );
    }
}
