<?php

namespace App\Console\Commands;

use App\Services\VectorKnowledge;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('knowledge:index')]
#[Description('Embed public service guides into Qdrant (uses the embedding API)')]
class IndexKnowledge extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(VectorKnowledge $knowledge): int
    {
        try {
            $this->info('Indexed '.$knowledge->index().' public guide sections.');

            return self::SUCCESS;
        } catch (\Throwable) {
            $this->error('Indexing failed. Check Qdrant, embedding credentials and collection dimensions. No private documents are indexed.');

            return self::FAILURE;
        }
    }
}
