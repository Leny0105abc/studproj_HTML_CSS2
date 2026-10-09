<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('codelab:admin {username}', function () {
    $user = User::where('username', $this->argument('username'))->first();
    if (! $user || $user->role === 'student') {
        $this->error('Choose an existing active teacher account. Students cannot be promoted by this command.');

        return 1;
    }
    if ($user->status !== 'active') {
        $this->error('The account must be active.');

        return 1;
    }
    $user->update(['role' => 'admin']);
    $this->info('Administrator access enabled for '.$user->username.'.');

    return 0;
})->purpose('Enable CodeLab administration for an existing teacher without changing credentials');
