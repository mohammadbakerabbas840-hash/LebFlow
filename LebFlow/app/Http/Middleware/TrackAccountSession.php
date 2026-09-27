<?php

namespace App\Http\Middleware;

use App\Models\AccountSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackAccountSession
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->hasSession()) {
            $user = $request->user()->fresh();
            $request->setUserResolver(fn () => $user);
            $version = $request->session()->get('auth_version', $user->auth_version);
            abort_unless((int) $version === $user->auth_version, 401, 'Please sign in again.');
            $request->session()->put('auth_version', $user->auth_version);
            $hash = hash_hmac('sha256', $request->session()->getId(), config('app.key'));
            $record = AccountSession::firstOrCreate(['session_hash' => $hash], ['user_id' => $user->id, 'agent' => mb_substr($request->userAgent() ?? 'Browser', 0, 200), 'last_seen_at' => now()]);
            abort_if($record->revoked_at || $record->user_id !== $user->id, 401, 'This session has expired.');
            if (strtotime($record->last_seen_at) < time() - 60) {
                $record->update(['last_seen_at' => now()]);
            }
            $request->attributes->set('account_session_id', $record->id);
        }

        return $next($request);
    }
}
