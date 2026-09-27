<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Jobs\ScanIdentityDocument;
use App\Models\User;
use App\Services\IdentityStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class IdentityDocumentController extends Controller
{
    public function store(Request $request, IdentityStorage $storage): UserResource
    {
        $data = $request->validate(['kind' => ['required', 'in:idPhoto,extract'], 'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120']]);
        if ($data['kind'] === 'idPhoto') {
            $request->validate(['file' => ['image', 'mimes:jpg,jpeg,png,webp']]);
        }
        $old = null;
        $document = null;
        try {
            DB::transaction(function () use ($request, $storage, $data, &$old, &$document): void {
                User::lockForUpdate()->findOrFail($request->user()->id);
                $old = $request->user()->identityDocuments()->where('kind', $data['kind'])->first();
                $old?->delete();
                $document = $storage->store($request->user(), $data['kind'], $request->file('file'));
                ScanIdentityDocument::dispatch($document->id);
            });
        } catch (\Throwable $error) {
            if ($document) {
                Storage::disk('identity')->delete($document->path);
            }
            throw $error;
        }
        if ($old) {
            Storage::disk('identity')->delete($old->path);
        }

        return new UserResource($request->user()->load('identityDocuments'));
    }

    public function destroy(Request $request, string $document): JsonResponse
    {
        $record = $request->user()->identityDocuments()->findOrFail($document);
        $record->delete();
        Storage::disk('identity')->delete($record->path);

        return response()->json(['message' => 'Document deleted.']);
    }

    public function show(Request $request, string $document): Response
    {
        $record = $request->user()->identityDocuments()->findOrFail($document);
        abort_unless($record->malware_clear && $record->scan_status !== 'rejected', 423, 'This document is quarantined until its safety scan completes.');

        return response(Crypt::decryptString(Storage::disk('identity')->get($record->path)), 200, [
            'Content-Type' => $record->mime, 'Content-Disposition' => 'attachment; filename="'.$record->kind.'"', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
