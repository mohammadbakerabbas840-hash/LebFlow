<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceRevision;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceRevision>
 */
class ServiceRevisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'author_id' => User::factory(),
            'base_version' => 1,
            'content' => ['title' => ['en' => 'Example revision', 'ar' => 'تعديل تجريبي', 'fr' => 'Révision fictive']],
            'previous_content' => ['title' => ['en' => 'Example', 'ar' => 'مثال', 'fr' => 'Exemple']],
            'status' => 'draft',
            'reason' => 'Synthetic editorial revision for testing.',
        ];
    }
}
