<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\IndexPublicKnowledge;
use App\Models\IdentityDocument;
use App\Models\Service;
use App\Models\ServiceCase;
use App\Models\ServiceRevision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => ['services' => Service::all(), 'revisions' => ServiceRevision::latest()->limit(100)->get(), 'feedback' => DB::table('assistant_feedback')->latest()->limit(100)->get(), 'documents' => IdentityDocument::where('review_status', 'unreviewed')->latest()->limit(50)->get(['id', 'kind', 'scan_status', 'malware_clear', 'created_at'])]]);
    }

    public function draft(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:1000'], 'version' => ['required', 'integer'], 'content' => ['required', 'array'], 'content.documents' => ['required', 'array', 'min:1', 'max:30'], 'content.documents.*.id' => ['required', 'string', 'distinct', 'regex:/^[a-z0-9-]+$/'], 'content.sources' => ['required', 'array', 'min:1', 'max:10'], 'content.sources.*.url' => ['required', 'url:https', 'max:1000'], 'content.evidence' => ['required', 'in:core,partial'], 'content.eligibility' => ['required', 'array', 'min:1', 'max:20']]);
        foreach (['title', 'subtitle', 'category', 'scope', 'fees', 'location', 'appointments', 'sourceNote'] as $field) {
            foreach (['en', 'ar', 'fr'] as $locale) {
                $request->validate(["content.$field.$locale" => ['required', 'string', 'max:6000']]);
            }
        }
        foreach ($data['content']['documents'] as $index => $document) {
            foreach (['en', 'ar', 'fr'] as $locale) {
                $request->validate(["content.documents.$index.title.$locale" => ['required', 'string', 'max:2000'], "content.documents.$index.note.$locale" => ['required', 'string', 'max:3000']]);
            }
        }
        foreach (['en', 'ar', 'fr'] as $locale) {
            $request->validate(["content.eligibility.*.$locale" => ['required', 'string', 'max:3000'], "content.sources.*.title.$locale" => ['required', 'string', 'max:300']]);
        }
        foreach ($data['content']['sources'] as $source) {
            $host = strtolower(parse_url($source['url'], PHP_URL_HOST) ?? '');
            $officialBody = in_array($host, ['oea.org.lb', 'www.oea.org.lb'], true);
            abort_unless(str_ends_with($host, '.gov.lb') || $host === 'gov.lb' || $officialBody, 422, 'Use an official Lebanese government or listed professional-body source.');
        }
        abort_unless($data['version'] === $service->version, 409, 'Reload the latest service version.');
        // Keep the catalogue structure and document identifiers stable for existing cases.
        abort_unless(array_column($data['content']['documents'], 'id') === array_column($service->content['documents'], 'id'), 422, 'Document identifiers cannot change in an editorial revision.');
        // All editable fields were validated above; Laravel excludes separately validated nested keys from the first result.
        $editable = array_intersect_key($request->input('content'), array_flip(['title', 'subtitle', 'category', 'scope', 'eligibility', 'fees', 'location', 'appointments', 'sourceNote', 'sources', 'evidence', 'documents']));
        foreach ($editable['documents'] as $index => &$document) {
            $document = array_replace($service->content['documents'][$index], array_intersect_key($document, array_flip(['title', 'note'])));
        } unset($document);
        $revision = ServiceRevision::create(['service_id' => $service->id, 'author_id' => $request->user()->id, 'base_version' => $service->version, 'content' => array_replace($service->content, $editable), 'previous_content' => $service->content, 'reason' => $data['reason'], 'status' => 'draft']);

        return response()->json(['data' => $revision], 201);
    }

    public function publish(Request $request, ServiceRevision $revision): JsonResponse
    {
        $request->validate(['reviewed' => ['accepted']]);
        DB::transaction(function () use ($request, $revision): void {
            $revision = ServiceRevision::lockForUpdate()->findOrFail($revision->id);
            $service = Service::lockForUpdate()->findOrFail($revision->service_id);
            abort_unless($revision->status === 'draft' && $service->version === $revision->base_version, 409, 'This draft is already published or superseded.');
            abort_if($revision->author_id === $request->user()->id, 422, 'A second administrator must review this change.');
            $content = $revision->content;
            $content['lastReviewedAt'] = now()->toDateString();
            $service->forceFill(['content' => $content, 'version' => $service->version + 1])->save();
            $revision->update(['reviewer_id' => $request->user()->id, 'status' => 'published']);
            IndexPublicKnowledge::dispatch();
            ServiceCase::where('service_id', $service->id)->whereNull('archived_at')->chunkById(100, function ($cases) use ($service): void {
                foreach ($cases as $case) {
                    DB::table('case_events')->insert(['service_case_id' => $case->id, 'type' => 'requirements_updated', 'value' => (string) $service->version, 'created_at' => now()]);
                }
            });
        });

        return response()->json(['message' => 'Published. Public knowledge reindexing queued.']);
    }

    public function reviewDocument(Request $request, string $document): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:reviewed,needs_replacement'], 'reason' => ['required', 'string', 'min:5', 'max:200']]);
        $record = IdentityDocument::findOrFail($document);
        abort_unless($record->malware_clear && $record->scan_status !== 'rejected', 423, 'A human review cannot override malware quarantine.');
        $record->forceFill(['review_status' => $data['status'], 'review_reason' => $data['reason'], 'reviewer_id' => $request->user()->id, 'reviewed_at' => now()])->save();

        return response()->json(['message' => 'Review recorded; authenticity is not certified.']);
    }

    public function document(Request $request, string $document): Response
    {
        $record = IdentityDocument::findOrFail($document);
        abort_unless($record->malware_clear && $record->scan_status !== 'rejected', 423);

        return response(Crypt::decryptString(Storage::disk('identity')->get($record->path)), 200, ['Content-Type' => $record->mime, 'Content-Disposition' => 'attachment; filename="review-document"', 'Cache-Control' => 'private, no-store']);
    }

    public function feedback(Request $request, int $feedback): JsonResponse
    {
        abort_unless(DB::table('assistant_feedback')->where('id', $feedback)->exists(), 404);
        DB::table('assistant_feedback')->where('id', $feedback)->update(['status' => 'reviewed', 'updated_at' => now()]);

        return response()->json(['message' => 'Feedback reviewed.']);
    }
}
