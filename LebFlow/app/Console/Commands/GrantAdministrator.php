<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('account:administrator {email} {--revoke}')]
#[Description('Grant or revoke administrator access for an existing account; MFA is mandatory')]
class GrantAdministrator extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::where('email', strtolower(trim($this->argument('email'))))->first();
        if (! $user) {
            $this->error('Account not found.');

            return self::FAILURE;
        }
        $user->forceFill(['is_admin' => ! $this->option('revoke')])->save();
        $this->info('Role updated. Administrator routes require completed two-factor sign-in.');

        return self::SUCCESS;
    }
}
