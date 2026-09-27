<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdentityDocument extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['kind', 'path', 'mime', 'size'];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return ['size' => 'integer', 'malware_clear' => 'boolean', 'scan_report' => 'array', 'scanned_at' => 'datetime'];
    }
}
