<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class VectorKnowledge
{
    public function fingerprint(Service $service): string
    {
        return hash('sha256', json_encode([$service->content, $service->conditional_documents, config('knowledge.embedding_model'), config('knowledge.dimensions')], JSON_THROW_ON_ERROR));
    }

    public function embed(array $texts): array
    {
        if (! config('services.openai.api_key') || count($texts) > 32 || ! $texts) {
            throw new RuntimeException('Embedding configuration or input is invalid.');
        }
        $response = Http::withToken(config('services.openai.api_key'))->connectTimeout(5)->timeout(30)
            ->post('https://api.openai.com/v1/embeddings', [
                'model' => config('knowledge.embedding_model'), 'input' => $texts,
                'dimensions' => config('knowledge.dimensions'), 'encoding_format' => 'float',
            ]);
        if (! $response->successful()) {
            throw new RuntimeException('Embedding provider unavailable.');
        }
        $rows = $response->json('data');
        if (! is_array($rows) || count($rows) !== count($texts)) {
            throw new RuntimeException('Invalid embedding response.');
        }
        $vectors = [];
        foreach ($rows as $row) {
            $index = $row['index'] ?? null;
            $vector = $row['embedding'] ?? null;
            if (! is_int($index) || $index < 0 || $index >= count($texts) || isset($vectors[$index]) || ! is_array($vector) || count($vector) !== config('knowledge.dimensions')) {
                throw new RuntimeException('Invalid embedding shape.');
            }
            foreach ($vector as $number) {
                if (! is_numeric($number) || ! is_finite((float) $number)) {
                    throw new RuntimeException('Invalid embedding value.');
                }
            }
            $vectors[$index] = array_map('floatval', $vector);
        }
        ksort($vectors);

        return array_values($vectors);
    }

    public function index(): int
    {
        $collection = $this->collection();
        $existing = $this->client()->get($collection);
        if ($existing->status() === 404) {
            if (! $this->client()->put($collection, ['vectors' => ['size' => config('knowledge.dimensions'), 'distance' => 'Cosine']])->successful()) {
                throw new RuntimeException('Could not create vector collection.');
            }
        } elseif (! $existing->successful() || $existing->json('result.config.params.vectors.size') !== config('knowledge.dimensions')) {
            throw new RuntimeException('Vector collection unavailable or dimensions differ.');
        }
        $count = 0;
        foreach (Service::query()->orderBy('id')->get() as $service) {
            $points = [];
            $texts = [];
            foreach (['en', 'ar', 'fr'] as $locale) {
                $content = $this->localize($service->content, $locale);
                foreach (['eligibility', 'documents', 'fees', 'appointments', 'renewal'] as $section) {
                    if (empty($content[$section])) {
                        continue;
                    }
                    $texts[] = mb_substr(json_encode(['service' => $content['title'], 'scope' => $content['scope'] ?? '', 'section' => $section, 'content' => $content[$section]], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 0, 6000);
                    $hex = md5($service->id.':'.$locale.':'.$section);
                    $id = substr($hex, 0, 8).'-'.substr($hex, 8, 4).'-'.substr($hex, 12, 4).'-'.substr($hex, 16, 4).'-'.substr($hex, 20);
                    $points[] = ['id' => $id, 'payload' => ['service_id' => $service->id, 'locale' => $locale, 'section' => $section, 'fingerprint' => $this->fingerprint($service)]];
                }
            }
            if (! $texts) {
                continue;
            }
            $vectors = $this->embed($texts);
            foreach ($points as $index => &$point) {
                $point['vector'] = $vectors[$index];
            }
            unset($point);
            if (! $this->client()->put($collection.'/points?wait=true', ['points' => $points])->successful()) {
                throw new RuntimeException('Vector indexing failed.');
            }
            $count += count($points);
        }

        return $count;
    }

    public function search(string $question, string $locale): array
    {
        $response = $this->client()->post($this->collection().'/points/query', [
            'query' => $this->embed([$question])[0], 'limit' => 12, 'with_payload' => true,
            'score_threshold' => config('knowledge.score_threshold'),
            'filter' => ['must' => [['key' => 'locale', 'match' => ['value' => $locale]]]],
        ]);
        if (! $response->successful()) {
            throw new RuntimeException('Vector search unavailable.');
        }
        $ids = [];
        $points = $response->json('result.points');
        if (! is_array($points)) {
            throw new RuntimeException('Invalid vector search response.');
        }
        foreach ($points as $point) {
            if (! is_array($point) || ! is_array($point['payload'] ?? null) || ! is_string($point['payload']['service_id'] ?? null) || ! is_string($point['payload']['fingerprint'] ?? null)) {
                continue;
            }
            $payload = $point['payload'] ?? [];
            $service = Service::find($payload['service_id'] ?? '');
            // Hydrate current SQL data; stale vector payloads are never evidence.
            if ($service && hash_equals($this->fingerprint($service), $payload['fingerprint'] ?? '')) {
                $ids[] = $service->id;
            }
        }

        return array_slice(array_values(array_unique($ids)), 0, 2);
    }

    private function client(): PendingRequest
    {
        $url = rtrim(config('knowledge.url'), '/');
        if (! filter_var($url, FILTER_VALIDATE_URL) || ! in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)) {
            throw new RuntimeException('Invalid vector database URL.');
        }

        return Http::baseUrl($url)->withHeaders(['api-key' => config('knowledge.api_key') ?? ''])->connectTimeout(2)->timeout(5);
    }

    private function collection(): string
    {
        $name = config('knowledge.collection');
        if (! preg_match('/^[a-zA-Z0-9_-]{1,80}$/', $name)) {
            throw new RuntimeException('Invalid collection name.');
        }

        return '/collections/'.$name;
    }

    private function localize(mixed $value, string $locale): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (isset($value['en'], $value['ar'], $value['fr'])) {
            return $value[$locale];
        }

        return array_map(fn (mixed $item): mixed => $this->localize($item, $locale), $value);
    }
}
