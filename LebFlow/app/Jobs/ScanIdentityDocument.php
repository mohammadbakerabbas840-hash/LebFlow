<?php

namespace App\Jobs;

use App\Models\IdentityDocument;
use App\Services\DocumentScanner;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ScanIdentityDocument implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $timeout = 65;

    public int $tries = 2;

    public int $uniqueFor = 300;

    public function __construct(public string $documentId)
    {
        $this->onQueue('documents');
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return $this->documentId;
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentScanner $scanner): void
    {
        $document = IdentityDocument::find($this->documentId);
        if ($document) {
            $document->forceFill($scanner->scan($document))->save();
        }
    }
}
