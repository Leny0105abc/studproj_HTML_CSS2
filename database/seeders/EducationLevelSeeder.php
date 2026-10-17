<?php

namespace Database\Seeders;

use App\Models\EducationLevel;
use Illuminate\Database\Seeder;

class EducationLevelSeeder extends Seeder
{
    public function run(): void
    {
        EducationLevel::firstOrCreate(['slug' => 'high-school'], ['name' => 'High School']);
        EducationLevel::firstOrCreate(['slug' => 'college'], ['name' => 'College']);
    }
}
