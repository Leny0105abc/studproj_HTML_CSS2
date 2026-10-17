<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $collegeId = DB::table('education_levels')->where('slug', 'college')->value('id');
            if (! $collegeId) {
                return;
            }
            $ids = DB::table('courses')->where('slug', 'introduction-to-programming')->orWhere('name', 'Introduction to Programming')->pluck('id');
            DB::table('courses')->whereIn('id', $ids)->update(['education_level_id' => $collegeId]);
            DB::table('course_education_levels')->whereIn('course_id', $ids)->where('education_level_id', '!=', $collegeId)->delete();
            foreach ($ids as $id) {
                DB::table('course_education_levels')->insertOrIgnore(['course_id' => $id, 'education_level_id' => $collegeId]);
            }
            // Retain enrollments, progress, submissions and feedback for historical review.
        });
    }

    public function down(): void
    {
        $schoolId = DB::table('education_levels')->where('slug', 'high-school')->value('id');
        if ($schoolId) {
            foreach (DB::table('courses')->where('slug', 'introduction-to-programming')->orWhere('name', 'Introduction to Programming')->pluck('id') as $id) {
                DB::table('course_education_levels')->insertOrIgnore(['course_id' => $id, 'education_level_id' => $schoolId]);
            }
        }
    }
};
