<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Jobs\ScanIdentityDocument;
use App\Models\User;
use App\Services\IdentityStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, IdentityStorage $storage): UserResource
    {
        $documents = [];
        try {
            $user = DB::transaction(function () use ($request, $storage, &$documents): User {
                $data = $request->validated();
                $user = User::create(['name' => $data['name'], 'name_arabic' => trim($data['nameArabic']), 'email' => $data['email'], 'password' => $data['password'], 'dob' => $data['dob'], 'id_number' => $data['idNumber'] ?? null, 'locale' => $data['locale'] ?? 'en']);
                foreach (['idPhoto', 'extract'] as $kind) {
                    if ($request->hasFile($kind)) {
                        $documents[] = $storage->store($user, $kind, $request->file($kind));
                    }
                }
                foreach ($documents as $document) {
                    ScanIdentityDocument::dispatch($document->id);
                }

                return $user;
            });
        } catch (\Throwable $error) {
            foreach ($documents as $document) {
                Storage::disk('identity')->delete($document->path);
            } throw $error;
        }
        Auth::login($user);
        $request->session()->regenerate();

        return new UserResource($user->load('identityDocuments'));
    }

    public function login(Request $request): UserResource|JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $credentials['email'] = strtolower(trim($credentials['email']));
        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['email' => ['The credentials do not match our records.']]);
        }
        $request->session()->regenerate();

        $user = $request->user();
        if ($user->mfa_confirmed) {
            Auth::guard('web')->logout();
            $request->session()->put('mfa_pending', ['id' => $user->id, 'version' => $user->auth_version, 'expires' => now()->addMinutes(5)->timestamp]);

            return response()->json(['data' => ['mfaRequired' => true]]);
        }
        $request->session()->put('auth_version', $user->auth_version);

        return new UserResource($user->load('identityDocuments'));
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->fresh('identityDocuments'));
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }
}
