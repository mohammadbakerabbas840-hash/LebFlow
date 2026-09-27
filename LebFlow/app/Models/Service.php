<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'content', 'conditional_documents'];

    protected function casts(): array
    {
        return ['content' => 'array', 'conditional_documents' => 'array', 'version' => 'integer'];
    }
}
