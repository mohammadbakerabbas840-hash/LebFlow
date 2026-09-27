<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FamilyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->familyMembers()->oldest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:120'], 'name_arabic' => ['required', 'string', 'min:2', 'max:120'], 'dob' => ['required', 'date_format:Y-m-d', 'before_or_equal:today', 'after:1900-01-01'], 'relationship' => ['required', 'in:child,dependent'], 'guardianConsent' => ['accepted']]);

        return DB::transaction(function () use ($request, $data): JsonResponse {
            User::lockForUpdate()->findOrFail($request->user()->id);
            abort_if($request->user()->familyMembers()->count() >= 20, 422, 'The family-member limit is 20.');

            return response()->json(['data' => $request->user()->familyMembers()->create(collect($data)->except('guardianConsent')->all())], 201);
        });
    }

    public function destroy(Request $request, string $member): JsonResponse
    {
        $record = $request->user()->familyMembers()->findOrFail($member);
        abort_if($request->user()->cases()->where('family_member_id', $member)->exists(), 409, 'This family member has case history and cannot be deleted.');
        $record->delete();

        return response()->json(['message' => 'Family member removed.']);
    }
}
