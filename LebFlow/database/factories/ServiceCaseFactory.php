<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceCaseFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'service_id' => Service::factory(), 'payload' => ['kind' => 'application', 'stage' => 'Preparing documents', 'documents' => [], 'notApplicable' => [], 'due' => '']];
    }
}
