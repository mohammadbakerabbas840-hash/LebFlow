<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OfficialResearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['knowledge.research_enabled' => true, 'services.openai.api_key' => 'test', 'services.openai.model' => 'test-model']);
        $this->actingAs(User::factory()->create(['name' => 'Private Person', 'email' => 'private@example.com']));
        Http::preventStrayRequests();
    }

    private function reply(string $url = 'https://www.dgcs.gov.lb/arabic/identitycard'): array
    {
        return ['status' => 'completed', 'output' => [['type' => 'message', 'content' => [['type' => 'output_text', 'text' => 'Apply at the civil registry. [source]', 'annotations' => [['type' => 'url_citation', 'url' => $url, 'title' => 'DGCS', 'start_index' => 29, 'end_index' => 37]]]]]]];
    }

    public function test_research_returns_clickable_official_citations_without_private_account_data(): void
    {
        $body = $this->reply();
        $body['output'][0]['content'][0]['annotations'][0]['end_index'] = mb_strlen($body['output'][0]['content'][0]['text']);
        Http::fake(['api.openai.com/*' => Http::response($body)]);
        $this->postJson('/api/v1/ai/chat', ['message' => 'How can parents apply for a child ID?', 'research' => true, 'locale' => 'ar'])->assertOk()->assertJsonPath('status', 'researched')->assertJsonPath('annotations.0.title', 'DGCS');
        Http::assertSent(function ($request) {
            $this->assertFalse($request['store']);
            $this->assertContains('dgcs.gov.lb', $request['tools'][0]['filters']['allowed_domains']);
            $this->assertStringNotContainsString('private@example.com', $request->body());

            return str_contains($request['instructions'], 'Arabic');
        });
    }

    public function test_non_official_citation_is_rejected_including_domain_spoofing(): void
    {
        Http::fake(['*' => Http::response($this->reply('https://dgcs.gov.lb.evil.example/'))]);
        $this->postJson('/api/v1/ai/chat', ['message' => 'ID requirements', 'research' => true])->assertStatus(503)->assertJsonMissingPath('answer');
    }

    public function test_uncited_or_incomplete_research_is_not_presented_as_verified(): void
    {
        $reply = $this->reply();
        $reply['output'][0]['content'][0]['annotations'] = [];
        Http::fake(['*' => Http::response($reply)]);
        $this->postJson('/api/v1/ai/chat', ['message' => 'ID requirements', 'research' => true])->assertStatus(503);
    }

    public function test_research_has_a_separate_cost_limit(): void
    {
        Http::fake(['*' => Http::response([], 503)]);
        for ($index = 0; $index < 2; $index++) {
            $this->postJson('/api/v1/ai/chat', ['message' => 'ID requirements', 'research' => true])->assertStatus(503);
        }
        $this->postJson('/api/v1/ai/chat', ['message' => 'ID requirements', 'research' => true])->assertStatus(429);
        Http::assertSentCount(2);
    }

    public function test_malformed_provider_output_returns_generic_failure_without_leaking_data(): void
    {
        Http::fake(['*' => Http::response(['status' => 'completed', 'output' => 'private-provider-diagnostic'])]);
        $this->postJson('/api/v1/ai/chat', ['message' => 'ID requirements', 'research' => true])->assertStatus(503)->assertDontSee('private-provider-diagnostic');
    }
}
