<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [...$this->payload, 'id' => $this->id, 'serviceId' => $this->service_id, 'familyMemberId' => $this->family_member_id, 'applicantName' => $this->familyMember?->name, 'applicantNameArabic' => $this->familyMember?->name_arabic, 'archivedAt' => $this->archived_at?->toISOString(), 'serviceVersion' => $this->service_version, 'created' => $this->created_at->toISOString(), 'updatedAt' => $this->updated_at->toISOString()];
    }
}
