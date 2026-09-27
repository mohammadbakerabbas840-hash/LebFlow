<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_saturated_assistant_returns_retryable_response_without_provider_call(): void
    {
        Http::preventStrayRequests();
        Http::fake();
        $this->actingAs(User::factory()->create());
        $locks = [];
        for ($index = 0; $index < 6; $index++) {
            $locks[] = $lock = Cache::lock('assistant:slot:'.$index, 100);
            $lock->get();
        }
        $this->postJson('/api/v1/ai/chat', ['message' => 'passport renewal'])->assertStatus(429)->assertHeader('Retry-After', '10');
        Http::assertNothingSent();
        foreach ($locks as $lock) {
            $lock->release();
        }
    }

    public function test_repeat_case_creation_is_idempotent_and_account_scoped(): void
    {
        $this->seed(ServiceSeeder::class);
        $ids = [];
        for ($account = 0; $account < 12; $account++) {
            $user = User::factory()->create();
            $this->actingAs($user);
            $id = $this->postJson('/api/v1/cases', ['serviceId' => 'passport'])->assertCreated()->json('data.id');
            $this->assertSame($id, $this->postJson('/api/v1/cases', ['serviceId' => 'passport'])->assertOk()->json('data.id'));
            foreach ($ids as $other) {
                $this->getJson('/api/v1/cases/'.$other)->assertNotFound();
            }
            $ids[] = $id;
        }
        $this->assertDatabaseCount('service_cases', 12);
    }

    public function test_assistant_user_rate_limit_rejects_excess_without_affecting_guides(): void
    {
        $this->actingAs(User::factory()->create());
        for ($index = 0; $index < 10; $index++) {
            $this->postJson('/api/v1/ai/chat', ['message' => 'unrelated question'])->assertOk();
        }
        $this->postJson('/api/v1/ai/chat', ['message' => 'unrelated question'])->assertStatus(429);
        $this->getJson('/api/v1/services')->assertOk();
    }
}
