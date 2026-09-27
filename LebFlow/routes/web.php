<?php

use App\Http\Controllers\Api\AccountSecurityController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1/auth')->group(function (): void {
    Route::post('forgot-password', [AccountSecurityController::class, 'forgot'])->middleware('throttle:login');
    Route::post('reset-password', [AccountSecurityController::class, 'reset'])->middleware('throttle:login');
    Route::post('mfa', [AccountSecurityController::class, 'challenge'])->middleware('throttle:login');
    Route::post('register', [AuthController::class, 'register'])
        ->middleware(['guest', 'throttle:registration'])
        ->name('api.auth.register');

    Route::post('login', [AuthController::class, 'login'])
        ->middleware(['guest', 'throttle:login'])
        ->name('api.auth.login');

    Route::post('logout', [AuthController::class, 'logout'])
        ->middleware('auth')
        ->name('api.auth.logout');
});

Route::get('api/v1/email/verify/{id}/{hash}', [AccountSecurityController::class, 'verifyEmail'])->middleware(['auth', 'signed', 'throttle:6,1'])->name('verification.verify');

Route::get('/{any?}', function () {
    abort_unless(is_file(public_path('index.html')), 503, 'Build the frontend with npm run build:laravel.');

    return response()->file(public_path('index.html'));
})->where('any', '(?!(?:api|sanctum|assets|storage|up)(?:/|$)).*');
