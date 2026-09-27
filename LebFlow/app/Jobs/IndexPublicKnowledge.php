<?php

namespace App\Jobs;

use App\Services\VectorKnowledge;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class IndexPublicKnowledge implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public int $timeout = 300;

    public int $tries = 3;

    public int $uniqueFor = 600;

    public function __construct()
    {
        $this->onQueue('knowledge');
        $this->afterCommit();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (config('knowledge.vector_enabled')) {
            app(VectorKnowledge::class)->index();
        }
    }
}
