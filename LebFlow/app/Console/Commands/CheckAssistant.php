<?php

namespace App\Console\Commands;

use App\Services\KnowledgeRetriever;
use App\Services\OfficialResearch;
use App\Services\OpenAIService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

#[Signature('ai:check {--live : Send one small public-guide question to the configured provider} {--research : Test official-source web research with one public question}')]
#[Description('Check RAG configuration and retrieval without exposing credentials')]
class CheckAssistant extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(KnowledgeRetriever $retriever, OpenAIService $provider): int
    {
        $configured = filled(config('services.openai.api_key')) && filled(config('services.openai.model'));
        if ($this->option('research')) {
            try {
                $result = app(OfficialResearch::class)->answer('Where do parents apply for a Lebanese ID card for their child?', 'en');
                $this->info('Official-source research returned '.count($result['annotations']).' validated citations.');

                return self::SUCCESS;
            } catch (\Throwable) {
                $this->error('Research check failed. Confirm model web-search support, research configuration, network and quota.');

                return self::FAILURE;
            }
        }
        $evidence = $retriever->retrieve('What do I need to renew my passport?', 'en', 'passport');
        $this->line('Provider configuration: '.($configured ? 'present' : 'missing'));
        $this->line('Retrieved sourced guides: '.count($evidence));
        if (! $configured || ! $evidence) {
            return self::FAILURE;
        }
        if (! $this->option('live')) {
            $this->info('Local checks passed. No provider request sent.');

            return self::SUCCESS;
        }
        try {
            $answer = $provider->chat('What do I need to renew my passport?', $evidence, 'en');
        } catch (ConnectionException|RuntimeException $error) {
            $this->error('Provider check failed (code '.$error->getCode().'). Check network/TLS, API configuration, and provider quota.');

            return self::FAILURE;
        }
        $this->info('Live RAG response validated; citations: '.count($answer['evidenceIds']).'.');

        return self::SUCCESS;
    }
}
