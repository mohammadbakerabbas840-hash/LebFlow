<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveCaseRequest;
use App\Http\Resources\CaseResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CaseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return CaseResource::collection($request->user()->cases()->with('familyMember')->whereNull('archived_at')->latest()->get());
    }

    public function store(SaveCaseRequest $request): CaseResource
    {
        $data = $request->validated();
        $slot = isset($data['familyMemberId']) ? 'family:'.$data['familyMemberId'] : 'self';
        $existing = $request->user()->cases()->where('service_id', $data['serviceId'])->where('case_slot', $slot)->first();
        if ($existing) {
            return new CaseResource($existing);
        }
        $payload = $this->normalize($data, Service::findOrFail($data['serviceId']));
        $case = $request->user()->cases()->createOrFirst(['service_id' => $data['serviceId'], 'case_slot' => $slot], ['payload' => $payload, 'family_member_id' => $data['familyMemberId'] ?? null, 'service_version' => Service::findOrFail($data['serviceId'])->version]);

        return new CaseResource($case);
    }

    public function show(Request $request, string $case): CaseResource
    {
        return new CaseResource($request->user()->cases()->findOrFail($case));
    }

    public function update(SaveCaseRequest $request, string $case): CaseResource
    {
        return DB::transaction(function () use ($request, $case): CaseResource {
            $record = $request->user()->cases()->lockForUpdate()->findOrFail($case);
            abort_if($record->archived_at, 409, 'Archived cases are read-only.');
            $patch = $request->validated();
            $payload = $this->normalize(array_replace($record->payload, $patch), $record->service);
            if (! array_key_exists('appointment', $patch) && isset($record->payload['appointment'])) {
                $payload['appointment'] = $record->payload['appointment'];
            }
            $record->update(['payload' => $payload]);
            DB::table('case_events')->insert(['service_case_id' => $record->id, 'type' => 'updated', 'value' => $payload['stage'], 'created_at' => now()]);

            return new CaseResource($record);
        });
    }

    private function normalize(array $data, Service $service): array
    {
        unset($data['serviceId'], $data['familyMemberId']);
        $data = array_replace(['kind' => 'application', 'stage' => 'Preparing documents', 'documents' => [], 'notApplicable' => [], 'due' => ''], $data);
        if (isset($data['passportAnswers'])) {
            $data['notApplicable'] = array_values(array_diff($data['notApplicable'], ['guardian']));
            if ($data['passportAnswers']['ageBand'] === 'adult') {
                $data['notApplicable'][] = 'guardian';
            }
        }
        $allowed = collect($service->content['documents'])->filter(fn ($d): bool => (! ($d['renewalOnly'] ?? false) || $data['kind'] === 'renewal') && (! ($d['applicationOnly'] ?? false) || $data['kind'] === 'application'))->pluck('id')->all();
        $data['documents'] = array_values(array_intersect(array_diff($data['documents'], $data['notApplicable']), $allowed));
        $data['due'] = $data['due'] ?? '';
        if (($data['appointment']['mode'] ?? null) === 'demo') {
            $data['appointment']['reference'] = 'DEMO-'.Str::lower(Str::random(8));
        }

        return $data;
    }

    public function archive(Request $request, string $case): JsonResponse
    {
        DB::transaction(function () use ($request, $case): void {
            $record = $request->user()->cases()->lockForUpdate()->findOrFail($case);
            $record->update(['archived_at' => now(), 'case_slot' => 'archived:'.$record->id]);
        });

        return response()->json(['message' => 'Case archived.']);
    }

    public function history(Request $request, string $case): JsonResponse
    {
        $record = $request->user()->cases()->findOrFail($case);

        return response()->json(['data' => DB::table('case_events')->where('service_case_id', $record->id)->orderByDesc('id')->limit(100)->get()]);
    }

    public function archives(Request $request): AnonymousResourceCollection
    {
        return CaseResource::collection($request->user()->cases()->with('familyMember')->whereNotNull('archived_at')->latest()->limit(200)->get());
    }
}
