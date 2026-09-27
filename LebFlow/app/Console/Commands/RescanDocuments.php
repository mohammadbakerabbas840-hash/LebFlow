<?php

namespace App\Console\Commands;

use App\Jobs\ScanIdentityDocument;
use App\Models\IdentityDocument;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('documents:rescan {--limit=100 : Maximum documents queued per invocation}')]
#[Description('Queue pending or unavailable private documents for local scanning')]
class RescanDocuments extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $documents = IdentityDocument::whereIn('scan_status', ['pending', 'unavailable'])->oldest()->limit(max(1, min(1000, (int) $this->option('limit'))))->get();
        foreach ($documents as $document) {
            ScanIdentityDocument::dispatch($document->id);
        }
        $this->info('Queued '.$documents->count().' documents. Run the documents queue worker.');

        return self::SUCCESS;
    }
}
