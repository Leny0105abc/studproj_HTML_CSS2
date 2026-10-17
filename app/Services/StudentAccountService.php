<?php

namespace App\Services;

use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class StudentAccountService
{
    /** Shared by manual creation and the previewed student import. */
    public function create(array $data): array
    {
        Validator::make($data, StudentEducation::rules($data), StudentEducation::messages())->validate();
        $username = $data['username'] ?? $this->username($data['first_name'], $data['last_name']);
        $password = ($data['password'] ?? '') !== '' ? $data['password'] : $this->temporaryPassword();
        $name = $data['name'] ?? collect([$data['first_name'], $data['middle_name'] ?? null, $data['last_name']])->filter()->join(' ');
        $attributes = Arr::only($data, ['first_name', 'middle_name', 'last_name', 'grade_level', 'section', 'lrn', 'education_level_id', 'program']);
        $attributes['program'] = EducationLevel::whereKey($data['education_level_id'])->where('slug', 'college')->exists() ? ($data['program'] ?? null) : null;
        $user = User::create($attributes + [
            'name' => $name, 'username' => $username,
            'email' => ($data['email'] ?? '') !== '' ? $data['email'] : $username.'@student.local',
            'password' => Hash::make($password), 'role' => 'student', 'status' => $data['status'] ?? 'active',
            'must_change_password' => true, 'email_verified_at' => now(),
        ]);

        Log::info('Student account created', ['creator_id' => auth()->id(), 'student_id' => $user->id, 'education_level_id' => $user->education_level_id]);

        return ['user' => $user, 'credentials' => ['name' => $name, 'username' => $username, 'password' => $password, 'education_level' => $user->educationLevel->name]];
    }

    public function username(string $firstName, string $lastName): string
    {
        $base = Str::lower(Str::ascii($firstName.'.'.$lastName));
        $base = preg_replace('/[^a-z0-9.]/', '', str_replace(' ', '', $base)) ?: 'student';
        $candidate = $base;
        $suffix = 2;

        while (User::where('username', $candidate)->exists()) {
            $candidate = $base.$suffix++;
        }

        return $candidate;
    }

    public function temporaryPassword(): string
    {
        return Str::password(12, symbols: false);
    }
}
