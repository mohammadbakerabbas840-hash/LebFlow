import { L, useI18n, type MessageKey } from './index';
const messages = {
  changePassword: L('Change password', 'تغيير كلمة المرور', 'Modifier le mot de passe'),
  currentPassword: L('Current password', 'كلمة المرور الحالية', 'Mot de passe actuel'),
  newPassword: L('New password', 'كلمة المرور الجديدة', 'Nouveau mot de passe'),
  signIn: L('Sign in', 'تسجيل الدخول', 'Se connecter'),
  register: L('Create account', 'إنشاء حساب', 'Créer un compte'),
  privacy: L(
    'Your identity documents will be uploaded to your account and stored privately, encrypted on the server. Uploading documents does not verify your identity or submit a government application.',
    'ستُرفع مستندات هويتك إلى حسابك وتُحفظ بشكل خاص ومشفّر على الخادم. رفع المستندات لا يعني التحقّق من هويتك أو تقديم معاملة حكومية.',
    'Vos justificatifs seront envoyés à votre compte et conservés de manière privée et chiffrée sur le serveur. Leur envoi ne vérifie pas votre identité et ne dépose aucune demande administrative.',
  ),
  consent: L(
    'I agree to create my account and securely process any documents I choose to upload.',
    'أوافق على إنشاء حسابي ومعالجة أي مستندات أختار رفعها بشكل آمن.',
    'J’accepte la création de mon compte et le traitement sécurisé des documents que je choisis de transmettre.',
  ),
  passwordHint: L(
    'Use at least 12 characters. Choose a unique password.',
    'استخدم ١٢ خانة على الأقل واختر كلمة مرور خاصة بهذا الحساب.',
    'Utilisez au moins 12 caractères et un mot de passe unique.',
  ),
  signedIn: L('Your account', 'حسابك', 'Votre compte'),
  signOut: L('Sign out', 'تسجيل الخروج', 'Se déconnecter'),
  serverMode: L(
    'Personal account · Appointments are simulated',
    'حساب شخصي · المواعيد للمحاكاة فقط',
    'Compte personnel · Rendez-vous simulés',
  ),
  edit: L(
    'Save personal information',
    'حفظ المعلومات الشخصية',
    'Enregistrer les informations personnelles',
  ),
  error: L(
    'The request could not be completed. Check your details and try again.',
    'تعذّر إتمام الطلب. راجع البيانات وحاول مجدداً.',
    'La demande a échoué. Vérifiez vos informations et réessayez.',
  ),
  saved: L('Saved to your account', 'تم الحفظ في حسابك', 'Enregistré dans votre compte'),
  reminders: L(
    'These preferences control in-app reminders. You can enable email reminders separately in Account security after verifying your email.',
    'تتحكّم هذه الخيارات بالتذكيرات داخل المنصة. يمكنك تفعيل التذكيرات بالبريد الإلكتروني بشكل منفصل في قسم أمان الحساب بعد تأكيد بريدك الإلكتروني.',
    'Ces préférences concernent les rappels dans l’application. Les rappels par e-mail s’activent séparément dans la rubrique Sécurité du compte après vérification de votre adresse.',
  ),
  security: L(
    'Your session uses cookie authentication. Identity documents are private. Official bookings and identity verification are not connected.',
    'تستخدم جلستك مصادقة عبر ملفات تعريف الارتباط. مستندات الهوية خاصة بحسابك. الحجز الرسمي والتحقّق من الهوية غير متصلين بعد.',
    'Votre session utilise une authentification par cookie. Vos justificatifs restent privés. Les réservations officielles et la vérification d’identité ne sont pas connectées.',
  ),
};
export function useBackendText() {
  const { locale } = useI18n();
  return (key: keyof typeof messages) => messages[key][locale];
}
export function registrationText(key: MessageKey, locale: 'en' | 'ar' | 'fr'): string | undefined {
  const mapping: Partial<Record<MessageKey, keyof typeof messages>> = {
    prototypePrivacy: 'privacy',
    consent: 'consent',
    passwordHint: 'passwordHint',
    createPreview: 'register',
  };
  return mapping[key] ? messages[mapping[key]!][locale] : undefined;
}
