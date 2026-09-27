<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function directory(Request $request): JsonResponse
    {
        $data = $request->validate(['serviceId' => ['required', 'exists:services,id'], 'locale' => ['required', 'in:en,ar,fr']]);
        $offices = Office::all()->filter(fn ($office): bool => in_array($data['serviceId'], $office->services, true));

        return response()->json(['data' => $offices->values()->map(fn ($office): array => $this->localize($office->toArray(), $data['locale']))]);
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => Service::all()->map(fn (Service $service): array => ['id' => $service->id, 'title' => $service->content['title'], 'category' => $service->content['category'], 'content' => $service->content])]);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        $locale = $request->validate(['locale' => ['sometimes', 'in:en,ar,fr']])['locale'] ?? 'en';

        return response()->json(['data' => ['id' => $service->id, ...$this->localize($service->content, $locale), 'source' => $this->localize($service->content['sources'][0], $locale)]]);
    }

    private function localize(mixed $value, string $locale): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (isset($value['en'],$value['ar'],$value['fr'])) {
            return $value[$locale];
        }

        return array_map(fn ($item): mixed => $this->localize($item, $locale), $value);
    }
}
