<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = json_decode(file_get_contents(database_path('data/services.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($catalog['services'] as $id => $content) {
            $service = Service::firstOrNew(['id' => $id]);
            if (! $service->exists || $service->version === 1) {
                $service->fill(['content' => $content, 'conditional_documents' => $catalog['conditionalDocuments'][$id]])->save();
            }
        }
    }
}
