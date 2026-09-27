<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\CaseDigest;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('reminders:send')]
#[Description('Queue a daily private reminder for verified accounts that opted in')]
class SendReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = 0;
        User::where('email_reminders', true)->whereNotNull('email_verified_at')->whereHas('cases', fn ($query) => $query->whereNull('archived_at'))->chunkById(100, function ($users) use (&$count): void {
            foreach ($users as $user) {
                DB::transaction(function () use ($user, &$count): void {
                    $user = User::lockForUpdate()->findOrFail($user->id);
                    $today = now('Asia/Beirut')->toDateString();
                    if ($user->last_digest_at === $today || ! $user->email_reminders || ! $user->hasVerifiedEmail()) {
                        return;
                    }
                    $user->notify(new CaseDigest);
                    $user->forceFill(['last_digest_at' => $today])->save();
                    $count++;
                });
            }
        });
        $this->info('Queued '.$count.' reminder notifications. Monitor failed jobs for delivery failures.');

        return self::SUCCESS;
    }
}
