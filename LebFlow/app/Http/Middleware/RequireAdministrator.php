<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdministrator
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->hasSession() && $request->user()?->is_admin && $request->user()->mfa_confirmed && $request->session()->get('mfa_passed') === $request->user()->id, 403, 'Administrator access requires two-factor authentication.');

        return $next($request);
    }
}
