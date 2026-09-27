<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;

class AccountProtection
{
    public function verify(User $user, string $code): bool
    {
        return DB::transaction(function () use ($user, $code): bool {
            $record = User::lockForUpdate()->findOrFail($user->id);
            if (! $record->mfa_secret) {
                return false;
            }
            $step = (new Google2FA)->verifyKeyNewer($record->mfa_secret, $code, $record->mfa_last_step, 1);
            if ($step !== false) {
                $record->forceFill(['mfa_last_step' => $step])->save();

                return true;
            }
            $recovery = $record->mfa_recovery ?? [];
            foreach ($recovery as $index => $hash) {
                if (Hash::check($code, $hash)) {
                    unset($recovery[$index]);
                    $record->forceFill(['mfa_recovery' => array_values($recovery)])->save();

                    return true;
                }
            }

            return false;
        });
    }
}
