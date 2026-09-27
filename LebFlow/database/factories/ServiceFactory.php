<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    public function definition(): array
    {
        return ['id' => fake()->unique()->slug(2), 'content' => ['title' => ['en' => 'Example', 'ar' => 'مثال', 'fr' => 'Exemple'], 'documents' => []], 'conditional_documents' => []];
    }
}
