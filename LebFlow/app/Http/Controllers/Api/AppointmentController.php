<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AppointmentController extends Controller
{
    public function offices(Service $service): JsonResponse
    {
        $catalogue = json_decode(file_get_contents(database_path('data/services.json')), true, 512, JSON_THROW_ON_ERROR);

        return response()->json(['data' => $catalogue['offices'], 'mode' => 'demo']);
    }

    public function slots(Request $request): JsonResponse
    {
        $data = $request->validate(['branchId' => ['required', 'in:demo-beirut,demo-north,demo-south'], 'date' => ['required', 'date_format:Y-m-d']]);
        $day = Carbon::createFromFormat('!Y-m-d', $data['date'], 'Asia/Beirut');
        $slots = $day->isSunday() ? [] : array_values(array_filter(['09:00', '10:30', '12:00', '14:00'], fn (string $time): bool => Carbon::parse($data['date'].' '.$time, 'Asia/Beirut')->isFuture()));

        return response()->json(['data' => $slots, 'mode' => 'demo', 'timezone' => 'Asia/Beirut']);
    }
}
