<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'name_arabic', 'email', 'password', 'dob', 'id_number', 'locale', 'preferences'])]
#[Hidden(['password', 'remember_token', 'id_number', 'mfa_secret', 'mfa_recovery', 'mfa_last_step'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function cases(): HasMany
    {
        return $this->hasMany(ServiceCase::class);
    }

    public function identityDocuments(): HasMany
    {
        return $this->hasMany(IdentityDocument::class);
    }

    public function familyMembers(): HasMany
    {
        return $this->hasMany(FamilyMember::class);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'dob' => 'date:Y-m-d',
            'id_number' => 'encrypted',
            'preferences' => 'array',
            'is_admin' => 'boolean', 'mfa_confirmed' => 'boolean', 'mfa_secret' => 'encrypted', 'mfa_recovery' => 'encrypted:array', 'email_reminders' => 'boolean', 'auth_version' => 'integer',
        ];
    }
}
