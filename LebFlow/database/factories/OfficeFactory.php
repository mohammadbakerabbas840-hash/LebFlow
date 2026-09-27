<?php

namespace Database\Factories;

use App\Models\Office;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Office>
 */
class OfficeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->unique()->slug(3),
            'name' => ['en' => 'Test office', 'ar' => 'مكتب تجريبي', 'fr' => 'Bureau fictif'],
            'address' => ['en' => 'Sample address', 'ar' => 'عنوان تجريبي', 'fr' => 'Adresse fictive'],
            'services' => [],
            'source_url' => 'https://example.test/office',
            'reviewed_at' => now()->toDateString(),
        ];
    }
}
