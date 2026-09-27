<?php

namespace App\Console\Commands;

use App\Services\VectorKnowledge;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('knowledge:check')]
#[Description('Run three real multilingual vector queries against public guides (uses embeddings)')]
class CheckVectorKnowledge extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(VectorKnowledge $knowledge): int
    {
        try {
            foreach (['en' => 'renew my passport', 'ar' => 'تجديد جواز السفر', 'fr' => 'renouveler mon passeport'] as $locale => $question) {
                $ids = $knowledge->search($question, $locale);
                if (! in_array('passport', $ids, true)) {
                    $this->error('Vector retrieval failed for '.$locale.'. Reindex current guides.');

                    return self::FAILURE;
                }
                $this->line($locale.': current passport guide retrieved.');
            }

            return self::SUCCESS;
        } catch (\Throwable) {
            $this->error('Vector check unavailable. Check Qdrant, index and embedding configuration.');

            return self::FAILURE;
        }
    }
}
