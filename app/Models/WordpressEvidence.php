<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WordpressEvidence extends Model
{
    protected $table = 'wordpress_evidence';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['path'];
}
