<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Http\Client\ConnectionException;

class KnowledgeRetriever
{
    private const ALIASES = [
        'birth' => ['birth', 'newborn', 'naissance', 'nouveau-ne', 'ولادة', 'مولود'],
        'family' => ['family extract', 'family civil', 'extrait familial', 'قيد عائلي'],
        'marriage' => ['marriage', 'mariage', 'زواج'],
        'identity' => ['id card', 'identity card', 'carte identite', 'carte d identite', 'هوية', 'الهوية'],
        'civil' => ['civil status', 'extrait individuel', 'état civil', 'إخراج قيد', 'اخراج قيد', 'قيد فردي'],
        'passport' => ['passport', 'passeport', 'جواز', 'جوازي'],
        'driving' => ['driving', 'driver', 'license', 'licence', 'permis', 'قيادة', 'سواقة', 'رخصة'],
        'police' => ['police', 'criminal record', 'casier', 'سجل عدلي', 'السجل العدلي', 'محكوم'],
        'university' => ['university', 'universitaire', 'diplome', 'جامعة', 'جامعي', 'جامعية', 'شهادة جامعية'],
        'municipality' => ['municipality', 'municipal', 'بلدية', 'بلديه', 'بناء'],
        'professional' => ['professional', 'professionnel', 'نقابة', 'مهنة', 'مزاولة'],
    ];

    public function retrieve(string $question, string $locale, ?string $serviceId = null): array
    {
        $query = $this->normalize($question);
        $matches = [];
        $vectorIds = [];
        if (config('knowledge.vector_enabled') && $serviceId === null) {
            try {
                $vectorIds = app(VectorKnowledge::class)->search($question, $locale);
            } catch (ConnectionException|\RuntimeException) {
                // Sourced keyword retrieval remains available during provider outages.
            }
        }
        foreach (Service::query()->orderBy('id')->get() as $service) {
            if ($serviceId !== null && $service->id !== $serviceId) {
                continue;
            }
            $score = $serviceId === $service->id ? 100 : 0;
            if (in_array($service->id, $vectorIds, true)) {
                $score += 30 - array_search($service->id, $vectorIds, true);
            }
            foreach (self::ALIASES[$service->id] ?? [] as $alias) {
                $term = $this->normalize($alias);
                $plural = preg_match('/^[a-z ]+$/', $term) ? 's?' : '';
                if (preg_match('/(?<![\p{L}\p{N}])'.preg_quote($term, '/').$plural.'(?![\p{L}\p{N}])/u', $query)) {
                    $score += 10;
                }
            }
            if ($score > 0) {
                $matches[] = ['service' => $service, 'score' => $score];
            }
        }
        usort($matches, fn (array $a, array $b): int => $b['score'] <=> $a['score']);
        $evidence = [];
        foreach (array_slice($matches, 0, 2) as $match) {
            $service = $match['service'];
            $content = $this->localize($service->content, $locale);
            $sources = array_values(array_filter($content['sources'] ?? [], fn (array $source): bool => isset($source['url'], $source['title']) && filter_var($source['url'], FILTER_VALIDATE_URL) && parse_url($source['url'], PHP_URL_SCHEME) === 'https'));
            if (! $sources) {
                continue;
            }
            $guide = array_intersect_key($content, array_flip(['scope', 'eligibility', 'documents', 'fees', 'location', 'appointments', 'renewal', 'sourceNote']));
            $evidence[] = [
                'id' => 'service:'.$service->id, 'serviceId' => $service->id,
                'title' => $content['title'], 'evidenceLevel' => $content['evidence'] ?? 'partial',
                'lastReviewedAt' => $content['lastReviewedAt'] ?? null,
                'content' => $guide, 'sources' => $sources,
            ];
        }

        return $evidence;
    }

    private function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        $text = strtr($text, ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ى' => 'ي', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a', 'ç' => 'c']);

        return preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $text);
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
