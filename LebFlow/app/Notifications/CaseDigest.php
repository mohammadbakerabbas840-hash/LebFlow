<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CaseDigest extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $copy = ['en' => ['Your LebFlow reminder', 'You have applications to review. Sign in to see upcoming dates, missing documents and changes.', 'Open my workspace'], 'ar' => ['تذكير من LebFlow', 'لديك طلبات تحتاج إلى مراجعة. سجّل الدخول للاطلاع على المواعيد والمستندات الناقصة والتغييرات.', 'فتح مساحة العمل'], 'fr' => ['Votre rappel LebFlow', 'Vous avez des dossiers à consulter. Connectez-vous pour voir les dates à venir, les documents manquants et les modifications.', 'Ouvrir mon espace']][$notifiable->locale ?? 'en'];

        return (new MailMessage)->subject($copy[0])->line($copy[1])->action($copy[2], url('/#/reminders'));
    }

    public function shouldSend(object $notifiable, string $channel): bool
    {
        $user = $notifiable->fresh();

        return $user && $user->email_reminders && $user->hasVerifiedEmail();
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
