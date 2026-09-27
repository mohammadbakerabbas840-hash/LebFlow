<?php

namespace App\Models;

use Database\Factories\ServiceRevisionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRevision extends Model
{
    /** @use HasFactory<ServiceRevisionFactory> */
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['content' => 'array', 'previous_content' => 'array', 'base_version' => 'integer', 'author_id' => 'integer', 'reviewer_id' => 'integer'];
    }
}
