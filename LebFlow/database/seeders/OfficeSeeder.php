<?php

namespace Database\Seeders;

use App\Models\Office;
use Illuminate\Database\Seeder;

class OfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Office::firstOrCreate(['id' => 'dgcs-information'], [
            'name' => ['en' => 'DGCS information office', 'ar' => 'مكتب الاستعلام لدى الأحوال الشخصية', 'fr' => 'Bureau d’information de la DGCS'],
            'address' => ['en' => 'Hamra – Sanayeh, Beirut. Contact for the appropriate local registry; this is not necessarily your submission office.', 'ar' => 'الحمراء – الصنائع، بيروت. للاستعلام عن قلم النفوس المختص؛ ليس بالضرورة مكان تقديم طلبك.', 'fr' => 'Hamra – Sanayeh, Beyrouth. Contactez ce bureau pour identifier le registre compétent ; il ne s’agit pas nécessairement du lieu de dépôt.'],
            'services' => ['identity', 'civil', 'birth', 'family', 'marriage'], 'phone' => '+9611741890',
            'source_url' => 'https://www.dgcs.gov.lb/arabic/contact--us', 'reviewed_at' => '2026-09-27',
        ]);
    }
}
