<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\PreferencesRequest;
use App\Http\Requests\ProfileRequest;
use App\Http\Resources\UserResource;
use App\Jobs\ScanIdentityDocument;
use App\Models\AccountSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function password(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->forceFill(['password' => $request->validated('password'), 'auth_version' => $request->user()->auth_version + 1])->save();
        Auth::guard('web')->setUser($request->user());
        $request->session()->regenerate();
        $request->session()->put('auth_version', $request->user()->auth_version);
        AccountSession::where('user_id', $request->user()->id)->update(['revoked_at' => now()]);

        return response()->json(['message' => 'Password changed.']);
    }

    public function update(ProfileRequest $request): UserResource
    {
        $data = $request->validated();
        if (array_key_exists('nameArabic', $data)) {
            $data['name_arabic'] = trim($data['nameArabic']);
            unset($data['nameArabic']);
        }
        $request->user()->update($data);
        $identityChanged = $request->user()->wasChanged(['name', 'name_arabic', 'dob']);
        if ($request->user()->wasChanged('email')) {
            $request->user()->forceFill(['email_verified_at' => null, 'email_reminders' => false])->save();
        }
        if ($identityChanged) {
            foreach ($request->user()->identityDocuments as $document) {
                $document->forceFill(['scan_status' => 'pending', 'scan_report' => null])->save();
                ScanIdentityDocument::dispatch($document->id);
            }
        }

        return new UserResource($request->user()->load('identityDocuments'));
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json(['data' => array_replace(['savedServices' => [], 'readNotifications' => [], 'appointmentAlerts' => true, 'expiryAlerts' => true, 'incompleteAlerts' => true, 'updateAlerts' => true], $request->user()->preferences ?? [])]);
    }

    public function savePreferences(PreferencesRequest $request): JsonResponse
    {
        $request->user()->update(['preferences' => array_replace($request->user()->preferences ?? [], $request->validated())]);

        return $this->preferences($request);
    }
}
