<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $preferences = $request->user()->preferences ?? [];
        $today = Carbon::today('Asia/Beirut')->toDateString();
        $soon = Carbon::today('Asia/Beirut')->addDays(30)->toDateString();
        $items = [];
        foreach ($request->user()->cases()->whereNull('archived_at')->with('service')->get() as $case) {
            $payload = $case->payload;
            $add = function (string $title, string $suffix, ?string $date = null) use (&$items, $preferences, $case): void {
                $id = $case->id.':'.$suffix;
                $items[] = ['id' => $id, 'serviceId' => $case->service_id, 'title' => $title, 'date' => $date, 'read' => in_array($id, $preferences['readNotifications'] ?? [], true)];
            };
            if (($preferences['updateAlerts'] ?? true) && ! $case->updated_at->equalTo($case->created_at)) {
                $add('updated', $case->updated_at->toISOString());
            }
            if (($preferences['updateAlerts'] ?? true) && $case->service_version < $case->service->version) {
                $add('updated', 'requirements:'.$case->service->version);
            }
            if (($preferences['expiryAlerts'] ?? true) && ! empty($payload['expiresOn']) && $payload['expiresOn'] <= $soon) {
                $add('expiryNotice', 'expiry:'.$payload['expiresOn'], $payload['expiresOn']);
            }
            if ($payload['stage'] === 'Completed') {
                continue;
            }
            $appointment = $payload['appointment'] ?? null;
            if (($preferences['appointmentAlerts'] ?? true) && $appointment && $appointment['date'] >= $today && $appointment['date'] <= $soon) {
                $add('appointmentNotice', 'appointment:'.$appointment['date'].':'.$appointment['time'], $appointment['date']);
            }
            $required = collect($case->service->content['documents'])->filter(fn (array $doc): bool => (! ($doc['renewalOnly'] ?? false) || $payload['kind'] === 'renewal') && (! ($doc['applicationOnly'] ?? false) || $payload['kind'] === 'application'))->pluck('id')->all();
            if (($preferences['incompleteAlerts'] ?? true) && array_diff($required, $payload['documents'], $payload['notApplicable'])) {
                $add('incompleteNotice', 'incomplete');
            }
        }

        return response()->json(['data' => $items]);
    }
}
