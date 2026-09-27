<?php

namespace App\Console\Commands;

use App\Services\DocumentScanner;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('release:check')]
#[Description('Check deployment configuration without displaying secrets')]
class ReleaseCheck extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $checks = [
            'Production environment' => app()->environment('production'),
            'Debug disabled' => ! config('app.debug'),
            'HTTPS application URL' => str_starts_with(config('app.url'), 'https://') && ! str_contains(config('app.url'), '.example'),
            'Application encryption key' => (bool) config('app.key'),
            'Secure session cookies' => config('session.secure') === true,
            'PostgreSQL database' => config('database.default') === 'pgsql',
            'Shared Redis cache and sessions' => config('cache.default') === 'redis' && config('session.driver') === 'redis',
            'Background Redis queue' => config('queue.default') === 'redis' && config('queue.connections.redis.retry_after') > 300,
            'Outbound email transport' => ! in_array(config('mail.default'), ['log', 'array'], true) && (bool) config('mail.from.address'),
            'Frontend build' => is_file(public_path('index.html')),
            'Tesseract executable' => (bool) DocumentScanner::executable(config('documents.tesseract_binary')),
            'ClamAV executable' => (bool) DocumentScanner::executable(config('documents.clamav_binary')),
            'Vector search enabled' => (bool) config('knowledge.vector_enabled'),
            'Assistant configured' => (bool) config('services.openai.api_key') && (bool) config('services.openai.model'),
        ];
        foreach ($checks as $label => $passed) {
            $this->line(($passed ? 'PASS ' : 'FAIL ').$label);
        }
        $this->comment('Configuration checks do not prove TLS reachability, capacity, backup recovery, email delivery or scanner accuracy. Run documents:check --live and production acceptance tests on the deployed host.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
