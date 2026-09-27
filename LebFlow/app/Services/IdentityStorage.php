<?php

namespace App\Services;

use App\Models\IdentityDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IdentityStorage
{
    public function store(User $user, string $kind, UploadedFile $file): IdentityDocument
    {
        $path = 'identities/'.$user->id.'/'.Str::uuid().'.enc';
        $bytes = $file->getContent();
        Storage::disk('identity')->put($path, Crypt::encryptString($bytes));
        try {
            return $user->identityDocuments()->create(['kind' => $kind, 'path' => $path, 'mime' => $file->getMimeType(), 'size' => strlen($bytes)]);
        } catch (\Throwable $error) {
            Storage::disk('identity')->delete($path);
            throw $error;
        }
    }
}
