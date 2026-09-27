<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'nameArabic' => $this->name_arabic, 'email' => $this->email, 'dob' => $this->dob?->format('Y-m-d'),
            'idNumberMasked' => $this->id_number ? '•••• '.mb_substr($this->id_number, -3) : null, 'locale' => $this->locale,
            'identityVerified' => false, 'documents' => $this->identityDocuments->map(fn ($document): array => ['id' => $document->id, 'kind' => $document->kind, 'mime' => $document->mime, 'size' => $document->size, 'scanStatus' => $document->scan_status, 'reviewStatus' => $document->review_status, 'reviewReason' => $document->review_reason, 'downloadAvailable' => $document->malware_clear && $document->scan_status !== 'rejected'])->all()];
    }
}
