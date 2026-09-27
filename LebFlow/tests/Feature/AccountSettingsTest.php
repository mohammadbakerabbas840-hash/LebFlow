<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ServiceSeeder::class);
    }

    public function test_profile_and_preferences_are_scoped_to_the_signed_in_account(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user)->patchJson('/api/v1/me', ['name' => 'Changed Name', 'email' => strtoupper($other->email)])->assertUnprocessable();
        $this->patchJson('/api/v1/me', ['email' => ' Revised@Example.com '])->assertOk()->assertJsonPath('data.email', 'revised@example.com');
        $this->patchJson('/api/v1/me', ['name' => 'Changed Name', 'locale' => 'fr', 'idNumber' => 'OVERWRITE'])->assertOk()->assertJsonPath('data.name', 'Changed Name');
        $this->assertNull($user->fresh()->id_number);
        $this->assertNotSame('Changed Name', $other->fresh()->name);
        $this->patchJson('/api/v1/preferences', ['appointmentAlerts' => false, 'savedServices' => ['police']])->assertOk();
        $this->getJson('/api/v1/preferences')->assertJsonPath('data.appointmentAlerts', false)->assertJsonPath('data.savedServices', ['police']);
        $this->patchJson('/api/v1/preferences', ['savedServices' => ['invented']])->assertUnprocessable();
        $this->actingAs($other)->getJson('/api/v1/preferences')->assertJsonPath('data.savedServices', []);
    }

    public function test_password_change_requires_current_password_and_confirmation(): void
    {
        $this->withHeader('Origin', 'http://127.0.0.1:5176');
        $user = User::factory()->create(['password' => 'original-password-123']);
        $this->actingAs($user)->putJson('/api/v1/me/password', ['current_password' => 'wrong', 'password' => 'replacement-password-123', 'password_confirmation' => 'replacement-password-123'])->assertUnprocessable();
        $this->putJson('/api/v1/me/password', ['current_password' => 'original-password-123', 'password' => 'replacement-password-123', 'password_confirmation' => 'replacement-password-123'])->assertOk();
        $this->assertTrue(Hash::check('replacement-password-123', $user->fresh()->password));
        $this->assertSame(Auth::guard('web')->hashPasswordForCookie($user->fresh()->password), session('password_hash_web'));
        $this->assertSame($user->fresh()->auth_version, session('auth_version'));
    }

    public function test_appointment_reference_survives_checklist_changes_and_slots_are_demo_only(): void
    {
        $this->actingAs(User::factory()->create());
        $response = $this->postJson('/api/v1/cases', ['serviceId' => 'driving', 'appointment' => ['date' => '2099-10-02', 'time' => '09:00', 'mode' => 'demo', 'branchId' => 'demo-beirut', 'reference' => 'FORGED']])->assertCreated();
        $reference = $response->json('data.appointment.reference');
        $this->assertStringStartsWith('DEMO-', $reference);
        $this->patchJson('/api/v1/cases/'.$response->json('data.id'), ['stage' => 'Processing'])->assertOk()->assertJsonPath('data.appointment.reference', $reference);
        $this->getJson('/api/v1/services/driving/offices')->assertOk()->assertJsonPath('mode', 'demo')->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/appointment-slots?branchId=demo-beirut&date=2020-01-01')->assertOk()->assertJsonPath('data', []);
        $this->getJson('/api/v1/appointment-slots?branchId=official&date=2099-10-02')->assertUnprocessable();
    }

    public function test_notifications_follow_owned_cases_and_preferences(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($owner)->postJson('/api/v1/cases', ['serviceId' => 'police'])->assertCreated();
        $notification = $this->getJson('/api/v1/notifications')->assertOk()->assertJsonCount(1, 'data')->json('data.0.id');
        $this->patchJson('/api/v1/preferences', ['readNotifications' => [$notification]])->assertOk();
        $this->getJson('/api/v1/notifications')->assertJsonPath('data.0.read', true);
        $this->patchJson('/api/v1/preferences', ['incompleteAlerts' => false])->assertOk();
        $this->getJson('/api/v1/notifications')->assertJsonCount(0, 'data');
        $this->actingAs($other)->getJson('/api/v1/notifications')->assertJsonCount(0, 'data');
    }
}
