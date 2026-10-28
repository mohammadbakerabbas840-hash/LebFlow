
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use App\Services\KnowledgeRetriever;
use App\Services\OfficialResearch;
use App\Services\OpenAIService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;

class AiController extends Controller
{
    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serviceId' => ['nullable', 'exists:services,id'],
            'category' => ['required', 'in:incorrect,outdated,missing,helpful'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::table('assistant_feedback')->insert([
            'user_id' => $request->user()->id,
            'service_id' => $data['serviceId'] ?? null,
            'category' => $data['category'],
            'comment' => $data['comment'] ?? null,
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Feedback recorded.',
        ], 201);
    }

    public function chat(
        ChatRequest $request,
        KnowledgeRetriever $retriever,
        OpenAIService $openAI
    ): JsonResponse {
        $userLock = Cache::lock(
            'assistant:user:'.$request->user()->id,
            100
        );

        if (! $userLock->get()) {
            return response()->json([
                'code' => 'assistant_busy',
            ], 429)->header('Retry-After', '10');
        }

        $slot = null;

        try {
            for ($index = 0; $index < 6; $index++) {
                $candidate = Cache::lock(
                    'assistant:slot:'.$index,
                    100
                );

                if ($candidate->get()) {
                    $slot = $candidate;
                    break;
                }
            }

            if (! $slot) {
                return response()->json([
                    'code' => 'assistant_busy',
                ], 429)->header('Retry-After', '10');
            }

            return $this->answer(
                $request,
                $retriever,
                $openAI
            );
        } finally {
            $slot?->release();
            $userLock->release();
        }
    }

    private function answer(
        ChatRequest $request,
        KnowledgeRetriever $retriever,
        OpenAIService $openAI
    ): JsonResponse {
        $data = $request->validated();

        $locale = $data['locale']
            ?? $request->user()->locale
            ?? 'en';

        $history = $data['history'] ?? [];

        $query = implode(
            "\n",
            array_column(
                array_filter(
                    $history,
                    fn (array $turn): bool =>
                        $turn['role'] === 'user'
                ),
                'content'
            )
        )."\n".$data['message'];

        // Official-source research
        if ($data['research'] ?? false) {
            $limiter = 'research:'.$request->user()->id;

            if (RateLimiter::tooManyAttempts($limiter, 2)) {
                return response()->json([
                    'code' => 'research_rate_limited',
                ], 429)->header('Retry-After', '60');
            }

            RateLimiter::hit($limiter, 60);

            try {
                return response()->json(
                    app(OfficialResearch::class)->answer(
                        $query,
                        $locale
                    )
                );
            } catch (ConnectionException|RuntimeException $error) {
                Log::error('LebFlow official research failed', [
                    'exception_type' => get_class($error),
                    'error_category' => $error instanceof ConnectionException
                        ? 'connection'
                        : 'runtime',
                ]);

                return response()->json([
                    'code' => 'research_unavailable',
                    'message' => 'Official-source research is unavailable. Try the stored service guides.',
                ], 503);
            }
        }

        // Retrieve knowledge evidence
        $evidence = $retriever->retrieve(
            $query,
            $locale,
            $data['serviceId'] ?? null
        );

        if (! $evidence) {
            $answer = [
                'en' => 'I could not find a matching sourced guide. Select a service or name the procedure. I cannot answer from unsupported information.',
                'ar' => 'لم أجد دليلاً مناسباً يستند إلى مصادر. اختر خدمة أو اذكر المعاملة المطلوبة. لا أستطيع الإجابة بمعلومات غير موثّقة.',
                'fr' => 'Je n’ai pas trouvé de guide correspondant avec des sources. Sélectionnez un service ou précisez la démarche. Je ne peux pas répondre sans informations étayées.',
            ][$locale];

            return response()->json([
                'success' => true,
                'answer' => $answer,
                'status' => 'insufficient_evidence',
                'citations' => [],
            ])->header('Cache-Control', 'private, no-store');
        }

        // OpenAI assistant request
        try {
            $result = $openAI->chat(
                $data['message'],
                $evidence,
                $locale,
                $history
            );
        } catch (ConnectionException|RuntimeException $error) {
            Log::error('LebFlow AI assistant request failed', [
                'exception_type' => get_class($error),
                'error_category' => $error instanceof ConnectionException
                    ? 'connection'
                    : 'runtime',
            ]);

            return response()->json([
                'success' => false,
                'code' => 'assistant_unavailable',
                'message' => 'The assistant is temporarily unavailable. Your service guides remain available.',
            ], 503);
        }

        $citations = array_values(
            array_filter(
                $evidence,
                fn (array $item): bool =>
                    in_array(
                        $item['id'],
                        $result['evidenceIds'],
                        true
                    )
            )
        );

        return response()->json([
            'success' => true,
            'answer' => $result['answer'],
            'status' => $result['insufficientEvidence']
                ? 'insufficient_evidence'
                : 'answered',
            'citations' => $citations,
        ])->header('Cache-Control', 'private, no-store');
    }
}
