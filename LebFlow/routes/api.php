<?php

use App\Http\Controllers\Api\AccountSecurityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseController;
use App\Http\Controllers\Api\FamilyController;
use App\Http\Controllers\Api\IdentityDocumentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Middleware\RequireAdministrator;
use App\Http\Middleware\TrackAccountSession;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('directory', [ServiceController::class, 'directory']);

    // Public service routes
    Route::get('services', [ServiceController::class, 'index'])
        ->name('api.services.index');

    Route::get('services/{service}', [ServiceController::class, 'show'])
        ->name('api.services.show');

    Route::get('services/{service}/offices', [AppointmentController::class, 'offices'])
        ->name('api.offices.index');

    Route::get('appointment-slots', [AppointmentController::class, 'slots'])
        ->name('api.slots.index');

    // AI Assistant
    Route::post('ai/chat', [AiController::class, 'chat'])
        ->middleware(['auth:sanctum', TrackAccountSession::class, 'throttle:assistant'])
        ->name('api.ai.chat');

    // Authenticated routes
    Route::middleware(['auth:sanctum', TrackAccountSession::class])->group(function (): void {
        Route::get('family', [FamilyController::class, 'index']);
        Route::post('family', [FamilyController::class, 'store'])->middleware('throttle:20,1');
        Route::delete('family/{member}', [FamilyController::class, 'destroy']);
        Route::get('security', [AccountSecurityController::class, 'settings']);
        Route::post('security/verification', [AccountSecurityController::class, 'sendVerification'])->middleware('throttle:3,1');
        Route::patch('security/reminders', [AccountSecurityController::class, 'reminders']);
        Route::delete('security/sessions/{session}', [AccountSecurityController::class, 'revoke']);
        Route::post('security/mfa/enroll', [AccountSecurityController::class, 'enroll'])->middleware('throttle:5,1');
        Route::post('security/mfa/confirm', [AccountSecurityController::class, 'confirm'])->middleware('throttle:5,1');
        Route::get('cases-archive', [CaseController::class, 'archives']);
        Route::post('cases/{case}/archive', [CaseController::class, 'archive']);
        Route::get('cases/{case}/history', [CaseController::class, 'history']);
        Route::post('identity-documents', [IdentityDocumentController::class, 'store'])->middleware('throttle:5,1');
        Route::delete('identity-documents/{document}', [IdentityDocumentController::class, 'destroy']);
        Route::post('ai/feedback', [AiController::class, 'feedback'])->middleware('throttle:5,1');
        Route::prefix('admin')->middleware([RequireAdministrator::class, 'throttle:60,1'])->group(function (): void {
            Route::get('/', [AdminController::class, 'index']);
            Route::post('services/{service}/drafts', [AdminController::class, 'draft']);
            Route::post('revisions/{revision}/publish', [AdminController::class, 'publish']);
            Route::get('documents/{document}', [AdminController::class, 'document']);
            Route::patch('documents/{document}', [AdminController::class, 'reviewDocument']);
            Route::patch('feedback/{feedback}', [AdminController::class, 'feedback']);
        });

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index'])
            ->name('api.notifications.index');

        // User profile
        Route::put('me/password', [ProfileController::class, 'password'])
            ->middleware('throttle:5,1')
            ->name('api.password.update');

        Route::patch('me', [ProfileController::class, 'update'])
            ->name('api.profile.update');

        Route::get('me', [AuthController::class, 'me'])
            ->name('api.me');

        // User preferences
        Route::get('preferences', [ProfileController::class, 'preferences'])
            ->name('api.preferences.show');

        Route::patch('preferences', [ProfileController::class, 'savePreferences'])
            ->name('api.preferences.update');

        // Cases
        Route::get('cases', [CaseController::class, 'index'])
            ->name('api.cases.index');

        Route::post('cases', [CaseController::class, 'store'])
            ->middleware('throttle:60,1')
            ->name('api.cases.store');

        Route::get('cases/{case}', [CaseController::class, 'show'])
            ->name('api.cases.show');

        Route::patch('cases/{case}', [CaseController::class, 'update'])
            ->middleware('throttle:120,1')
            ->name('api.cases.update');

        // Identity documents
        Route::get(
            'identity-documents/{document}',
            [IdentityDocumentController::class, 'show']
        )
            ->middleware('throttle:30,1')
            ->name('api.identity.show');
    });

});
