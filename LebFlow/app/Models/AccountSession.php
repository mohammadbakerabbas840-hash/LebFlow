<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AccountSession extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['session_hash'];
}
