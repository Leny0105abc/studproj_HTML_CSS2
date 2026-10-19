<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningEvidence extends Model
{
    protected $table = 'learning_evidence';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['path'];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function caseStudy()
    {
        return $this->belongsTo(CaseStudy::class);
    }
}
