<?php

namespace Tests\Feature;

use App\Jobs\ScanIdentityDocument;
use App\Models\User;
use App\Services\DocumentScanner;
use App\Services\IdentityStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentScanTest extends TestCase
{
    use RefreshDatabase;

    public function test_consistency_does_not_claim_authenticity_and_does_not_store_ocr_text(): void
    {
        $user = User::factory()->create(['name' => 'Sample Resident', 'dob' => '1995-05-12', 'id_number' => 'ID123456']);
        $result = app(DocumentScanner::class)->compare('Identity card Sample Resident 12/05/1995 ID123456', $user, 'idPhoto');
        $this->assertSame('consistent', $result['scan_status']);
        $this->assertFalse($result['scan_report']['authenticityVerified']);
        $this->assertStringNotContainsString('ID123456', json_encode($result));
        $mismatch = app(DocumentScanner::class)->compare('Identity card Another Person 12/05/1995 ID123456', $user, 'idPhoto');
        $this->assertSame('needs_review', $mismatch['scan_status']);
        $this->assertContains('name', $mismatch['scan_report']['reasons']);
    }

    public function test_arabic_extract_matches_normalized_digits_and_document_type(): void
    {
        $user = User::factory()->create(['name' => 'أحمد علي', 'dob' => '1995-05-12']);
        $result = app(DocumentScanner::class)->compare('إخراج قيد فردي أحمد علي ١٢/٠٥/١٩٩٥', $user, 'extract');
        $this->assertSame('consistent', $result['scan_status']);
    }

    public function test_missing_scanner_fails_closed_and_encrypted_document_remains_private(): void
    {
        Storage::fake('identity');
        config(['documents.clamav_binary' => 'missing-lebflow-scanner']);
        $user = User::factory()->create();
        $document = app(IdentityStorage::class)->store($user, 'idPhoto', UploadedFile::fake()->image('test.png'));
        (new ScanIdentityDocument($document->id))->handle(app(DocumentScanner::class));
        $document->refresh();
        $this->assertSame('unavailable', $document->scan_status);
        $this->assertFalse($document->malware_clear);
        $this->actingAs($user)->getJson('/api/v1/identity-documents/'.$document->id)->assertStatus(423);
        $this->assertSame([], glob(storage_path('app/scan-temp/scan-*')));
    }

    public function test_rejected_document_cannot_be_downloaded_even_with_inconsistent_clear_flag(): void
    {
        $user = User::factory()->create();
        $document = $user->identityDocuments()->create(['kind' => 'idPhoto', 'path' => 'never-public', 'mime' => 'image/png', 'size' => 1]);
        $document->forceFill(['scan_status' => 'rejected', 'malware_clear' => true])->save();
        $this->actingAs($user)->getJson('/api/v1/identity-documents/'.$document->id)->assertStatus(423);
    }

    public function test_api_has_private_cache_and_browser_security_headers(): void
    {
        $this->getJson('/api/v1/services')->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY')->assertHeader('Cache-Control', 'no-store, private');
    }
}
