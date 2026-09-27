<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AccountSession;
use App\Models\User;
use App\Services\AccountProtection;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AccountSecurityController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:254']]);
        Password::sendResetLink(['email' => strtolower(trim($data['email']))]);

        return response()->json(['message' => 'If the account exists, a reset link will be sent.']);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'token' => ['required', 'string'], 'password' => ['required', 'confirmed', PasswordRule::min(12)]]);
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60), 'auth_version' => $user->auth_version + 1])->save();
            AccountSession::where('user_id', $user->id)->update(['revoked_at' => now()]);
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => ['This reset link is invalid or expired.']]);
        }

        return response()->json(['message' => 'Password reset. Sign in with your new password.']);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function verifyEmail(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect('/#/account');
    }

    public function settings(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => ['verified' => $user->hasVerifiedEmail(), 'mfaEnabled' => $user->mfa_confirmed, 'emailReminders' => $user->email_reminders, 'isAdmin' => $user->is_admin, 'sessions' => AccountSession::where('user_id', $user->id)->whereNull('revoked_at')->where('last_seen_at', '>', now()->subDays(30))->latest('last_seen_at')->limit(30)->get(['id', 'agent', 'last_seen_at'])->map(fn ($session): array => [...$session->toArray(), 'current' => $session->id === $request->attributes->get('account_session_id')])]]);
    }

    public function reminders(Request $request): JsonResponse
    {
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        abort_if($data['enabled'] && ! $request->user()->hasVerifiedEmail(), 422, 'Verify your email before enabling email reminders.');
        $request->user()->forceFill(['email_reminders' => $data['enabled']])->save();

        return $this->settings($request);
    }

    public function revoke(Request $request, string $session): JsonResponse
    {
        AccountSession::where('user_id', $request->user()->id)->findOrFail($session)->update(['revoked_at' => now()]);

        return response()->json(['message' => 'Session revoked.']);
    }

    public function enroll(Request $request): JsonResponse
    {
        $request->validate(['password' => ['required', 'current_password:web']]);
        abort_if($request->user()->mfa_confirmed, 409, 'Two-factor authentication is already enabled.');
        $secret = (new Google2FA)->generateSecretKey();
        $request->user()->forceFill(['mfa_secret' => $secret, 'mfa_last_step' => 0, 'mfa_recovery' => null])->save();

        return response()->json(['data' => ['secret' => $secret]]);
    }

    public function confirm(Request $request, AccountProtection $protection): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'size:6']]);
        abort_if($request->user()->mfa_confirmed, 409);
        abort_unless($protection->verify($request->user(), $data['code']), 422, 'Invalid or previously used code.');
        $codes = array_map(fn (): string => Str::random(20), range(1, 8));
        $request->user()->forceFill(['mfa_confirmed' => true, 'mfa_recovery' => array_map(fn (string $code): string => Hash::make($code), $codes)])->save();
        $request->session()->put('mfa_passed', $request->user()->id);

        return response()->json(['data' => ['recoveryCodes' => $codes]]);
    }

    public function challenge(Request $request, AccountProtection $protection): UserResource
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:32']]);
        $pending = $request->session()->get('mfa_pending');
        abort_unless($pending && $pending['expires'] > time(), 401, 'Sign in again.');
        $user = User::findOrFail($pending['id']);
        abort_unless($user->auth_version === $pending['version'], 401, 'Sign in again.');
        abort_unless($user->mfa_confirmed && $protection->verify($user, $data['code']), 422, 'Invalid or previously used code.');
        Auth::login($user);
        $request->session()->forget('mfa_pending');
        $request->session()->regenerate();
        $request->session()->put(['mfa_passed' => $user->id, 'auth_version' => $user->auth_version]);

        return new UserResource($user->load('identityDocuments'));
    }
}
