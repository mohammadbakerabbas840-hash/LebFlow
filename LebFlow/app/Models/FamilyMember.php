<?php

namespace App\Models;

use Database\Factories\FamilyMemberFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    /** @use HasFactory<FamilyMemberFactory> */
    use HasFactory;

    use HasUuids;

    protected $fillable = ['name', 'name_arabic', 'dob', 'relationship'];

    protected function casts(): array
    {
        return ['name' => 'encrypted', 'name_arabic' => 'encrypted', 'dob' => 'encrypted'];
    }
}
