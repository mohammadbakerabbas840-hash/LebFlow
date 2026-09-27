<?php

namespace Tests\Feature;

use App\Models\ServiceCase;
use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackendApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('identity');
        $this->seed(ServiceSeeder::class);
    }

    private function registration(): array
    {
        return ['name' => 'Sample Citizen', 'nameArabic' => 'مواطن تجريبي', 'email' => 'sample@example.com', 'password' => 'sample-password-123', 'password_confirmation' => 'sample-password-123', 'dob' => '1995-04-02', 'idNumber' => 'SAMPLE-12345', 'consent' => true, 'locale' => 'ar', 'idPhoto' => UploadedFile::fake()->image('identity.png'), 'extract' => UploadedFile::fake()->image('extract.png')];
    }

    public function test_catalogue_is_public_and_localized(): void
    {
        $this->getJson('/api/v1/services')->assertOk()->assertJsonCount(11, 'data');
        $this->getJson('/api/v1/services/driving?locale=ar')->assertOk()->assertJsonPath('data.title', 'رخصة القيادة');
        $this->getJson('/api/v1/services/passport?locale=fr')->assertOk()->assertJsonPath('data.title', 'Demande de passeport');
        $this->getJson('/api/v1/services/missing')->assertNotFound();
    }

    public function test_registration_encrypts_identity_and_logs_in_without_exposing_it(): void
    {
        $this->post('/api/v1/auth/register', $this->registration(), ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.identityVerified', false)->assertJsonMissingPath('data.idNumber')->assertJsonMissingPath('data.password');
        $user = User::firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('sample-password-123', $user->password));
        $this->assertNotSame('SAMPLE-12345', $user->getRawOriginal('id_number'));
        $this->assertSame('SAMPLE-12345', $user->id_number);
        $this->assertCount(2, $user->identityDocuments);
        $document = $user->identityDocuments->first();
        Storage::disk('identity')->assertExists($document->path);
        $this->assertStringNotContainsString('PNG', Storage::disk('identity')->get($document->path));
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.locale', 'ar');
        $this->getJson('/api/v1/identity-documents/'.$document->id)->assertStatus(423);
        $document->forceFill(['malware_clear' => true, 'scan_status' => 'needs_review'])->save();
        $this->get('/api/v1/identity-documents/'.$document->id)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_parent_can_register_without_id_number_or_identity_uploads_and_start_child_document_requests(): void
    {
        $data = $this->registration();
        unset($data['idPhoto'], $data['extract'], $data['idNumber']);
        $this->postJson('/api/v1/auth/register', $data)->assertCreated()->assertJsonPath('data.nameArabic', 'مواطن تجريبي')->assertJsonPath('data.idNumberMasked', null)->assertJsonCount(0, 'data.documents');
        $this->postJson('/api/v1/cases', ['serviceId' => 'identity'])->assertCreated();
        $this->postJson('/api/v1/cases', ['serviceId' => 'civil'])->assertCreated();
        $this->assertDatabaseCount('identity_documents', 0);
    }

    public function test_registration_requires_names_in_both_languages(): void
    {
        $data = $this->registration();
        unset($data['nameArabic']);
        $this->postJson('/api/v1/auth/register', $data)->assertUnprocessable()->assertJsonValidationErrors('nameArabic');
    }

    public function test_failed_logins_do_not_consume_registration_quota(): void
    {
        for ($index = 0; $index < 5; $index++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'missing@example.com', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'missing@example.com', 'password' => 'incorrect'])->assertStatus(429);
        $data = $this->registration();
        unset($data['idPhoto'], $data['extract'], $data['idNumber']);
        $this->postJson('/api/v1/auth/register', $data)->assertCreated();
    }

    public function test_registration_rejects_disguised_optional_files(): void
    {
        $data = $this->registration();
        unset($data['extract']);
        $data['idPhoto'] = UploadedFile::fake()->createWithContent('fake.png', 'not an image')->mimeType('text/plain');
        $this->post('/api/v1/auth/register', $data, ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors(['idPhoto']);
        $this->assertDatabaseCount('users', 0);
        $this->assertSame([], Storage::disk('identity')->allFiles());
    }

    public function test_failed_upload_rolls_back_the_account_and_previous_file(): void
    {
        Storage::shouldReceive('disk')->with('identity')->andReturnSelf();
        Storage::shouldReceive('put')->once()->andReturnTrue();
        Storage::shouldReceive('put')->once()->andThrow(new \RuntimeException('Storage failure'));
        Storage::shouldReceive('delete')->once()->andReturnTrue();
        $this->post('/api/v1/auth/register', $this->registration(), ['Accept' => 'application/json'])->assertServerError();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('identity_documents', 0);
    }

    public function test_guest_and_cross_user_access_are_denied(): void
    {
        $this->getJson('/api/v1/cases')->assertUnauthorized();
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $case = ServiceCase::factory()->create(['user_id' => $owner->id, 'service_id' => 'police']);
        $document = $owner->identityDocuments()->create(['kind' => 'idPhoto', 'path' => 'private.enc', 'mime' => 'image/png', 'size' => 10]);
        $this->actingAs($other)->getJson('/api/v1/cases')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/cases/'.$case->id)->assertNotFound();
        $this->patchJson('/api/v1/cases/'.$case->id, ['stage' => 'Completed'])->assertNotFound();
        $this->getJson('/api/v1/identity-documents/'.$document->id)->assertNotFound();
    }

    public function test_cases_persist_validate_documents_and_normalize_passport_conditions(): void
    {
        $this->actingAs(User::factory()->create());
        $response = $this->postJson('/api/v1/cases', ['serviceId' => 'passport', 'kind' => 'renewal', 'documents' => ['form', 'guardian'], 'passportAnswers' => ['route' => 'renewal', 'ageBand' => 'adult', 'hasPrevious' => 'yes']])->assertCreated()->assertJsonPath('data.documents', ['form'])->assertJsonPath('data.notApplicable', ['guardian']);
        $id = $response->json('data.id');
        $this->patchJson('/api/v1/cases/'.$id, ['stage' => 'Processing', 'due' => '2099-10-02', 'expiresOn' => '2099-10-03'])->assertOk()->assertJsonPath('data.stage', 'Processing');
        $this->patchJson('/api/v1/cases/'.$id, ['documents' => ['secret-document']])->assertUnprocessable();
        $this->patchJson('/api/v1/cases/'.$id, ['stage' => 'Issued officially'])->assertUnprocessable();
        $this->postJson('/api/v1/cases', ['serviceId' => 'passport'])->assertOk();
        $this->assertDatabaseCount('service_cases', 1);
    }

    public function test_appointments_validate_time_and_mark_simulations(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/v1/cases', ['serviceId' => 'driving', 'appointment' => ['date' => '2020-01-01', 'time' => '10:00']])->assertUnprocessable();
        $this->postJson('/api/v1/cases', ['serviceId' => 'driving', 'appointment' => ['date' => '2099-10-02', 'time' => '09:00', 'mode' => 'demo', 'branchId' => 'demo-beirut']])->assertCreated()->assertJsonPath('data.appointment.mode', 'demo');
        $id = ServiceCase::firstOrFail()->id;
        $this->patchJson('/api/v1/cases/'.$id, ['appointment' => null])->assertOk()->assertJsonPath('data.appointment', null);
    }

    public function test_login_logout_and_bad_credentials(): void
    {
        User::factory()->create(['email' => 'account@example.com', 'password' => 'known-password-123']);
        $this->postJson('/api/v1/auth/login', ['email' => 'account@example.com', 'password' => 'incorrect'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => 'account@example.com', 'password' => 'known-password-123'])->assertOk();
        $this->getJson('/api/v1/me')->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertGuest('web');
        Auth::forgetGuards();
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }
}
