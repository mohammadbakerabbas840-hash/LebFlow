<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(fn ($user, string $token): string => rtrim(config('app.url'), '/').'/#/account?reset='.urlencode($token).'&email='.urlencode($user->email));
        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(5)->by('registration:'.$request->ip()));
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(10)->by('login-ip:'.$request->ip()),
            Limit::perMinute(5)->by('login-account:'.hash('sha256', strtolower(trim((string) $request->input('email'))))),
        ]);
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(240)->by($request->user()?->id ? 'user:'.$request->user()->id : 'ip:'.$request->ip()));
        RateLimiter::for('assistant', fn (Request $request) => [
            Limit::perMinute(10)->by('assistant-user:'.$request->user()->id),
            Limit::perMinute(60)->by('assistant-global'),
        ]);
    }
}
