<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use App\Services\KnowledgeRetriever;
use App\Services\VectorKnowledge;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VectorKnowledgeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ServiceSeeder::class);
        config(['services.openai.api_key' => 'test', 'knowledge.dimensions' => 3]);
        Http::preventStrayRequests();
    }

    public function test_semantic_search_hydrates_current_service_and_rejects_stale_and_deleted_points(): void
    {
        $vectors = app(VectorKnowledge::class);
        $service = Service::findOrFail('passport');
        Http::fake([
            'api.openai.com/*' => Http::response(['data' => [['index' => 0, 'embedding' => [0.1, 0.2, 0.3]]]]),
            '127.0.0.1:6333/*' => Http::response(['result' => ['points' => [
                ['payload' => ['service_id' => 'passport', 'fingerprint' => $vectors->fingerprint($service)]],
                ['payload' => ['service_id' => 'driving', 'fingerprint' => 'stale']],
                ['payload' => ['service_id' => 'deleted', 'fingerprint' => 'missing']],
            ]]]),
        ]);
        $this->assertSame(['passport'], $vectors->search('travel identity booklet', 'en'));
        $service->update(['content' => array_replace($service->content, ['fees' => ['en' => 'Changed', 'ar' => 'Changed', 'fr' => 'Changed']])]);
        $this->assertSame([], $vectors->search('travel identity booklet', 'en'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'points/query') && $request['filter']['must'][0]['match']['value'] === 'en');
    }

    public function test_semantic_question_without_keyword_retrieves_sourced_evidence(): void
    {
        config(['knowledge.vector_enabled' => true]);
        $this->mock(VectorKnowledge::class)->shouldReceive('search')->once()->andReturn(['passport']);
        $evidence = app(KnowledgeRetriever::class)->retrieve('travel identity booklet', 'en');
        $this->assertSame('passport', $evidence[0]['serviceId']);
        $this->assertNotEmpty($evidence[0]['sources']);
    }

    public function test_vector_outage_falls_back_to_sourced_keyword_guidance(): void
    {
        config(['knowledge.vector_enabled' => true]);
        $this->mock(VectorKnowledge::class)->shouldReceive('search')->once()->andThrow(new \RuntimeException('Unavailable'));
        $this->assertSame('passport', app(KnowledgeRetriever::class)->retrieve('passport renewal', 'en')[0]['serviceId']);
    }

    public function test_embedding_shape_is_validated(): void
    {
        Http::fake(['*' => Http::response(['data' => [['index' => 0, 'embedding' => [0.1]]]])]);
        $this->expectException(\RuntimeException::class);
        app(VectorKnowledge::class)->embed(['public guide']);
    }

    public function test_index_only_sends_public_catalog_and_uses_repeatable_point_ids(): void
    {
        Http::fake(function ($request) {
            if (str_contains($request->url(), 'embeddings')) {
                $rows = [];
                foreach ($request['input'] as $index => $text) {
                    $this->assertStringNotContainsString('private-person@example.com', $text);
                    $rows[] = ['index' => $index, 'embedding' => [0.1, 0.2, 0.3]];
                }

                return Http::response(['data' => $rows]);
            }

            return Http::response(['result' => ['config' => ['params' => ['vectors' => ['size' => 3]]]]]);
        });
        User::factory()->create(['email' => 'private-person@example.com']);
        $count = app(VectorKnowledge::class)->index();
        $this->assertGreaterThan(50, $count);
        $this->assertSame($count, app(VectorKnowledge::class)->index());
        $requests = Http::recorded(fn ($request) => str_contains($request->url(), '/points?'))->values();
        $this->assertSame($requests[0][0]['points'][0]['id'], $requests[Service::count()][0]['points'][0]['id']);
    }
}
