<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class IdentityDocumentFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'kind' => 'idPhoto', 'path' => 'identities/'.fake()->uuid().'.enc', 'mime' => 'image/png', 'size' => 100];
    }
}
