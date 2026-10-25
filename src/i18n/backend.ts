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
  invalidCredentials: L(
    'The email or password is incorrect. Check both or reset your password.',
    'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما أو أعد تعيين كلمة المرور.',
    'L’adresse e-mail ou le mot de passe est incorrect. Vérifiez-les ou réinitialisez votre mot de passe.',
  ),
  invalidMfa: L(
    'The authentication code is invalid or expired. Enter a new code and try again.',
    'رمز المصادقة غير صحيح أو انتهت صلاحيته. أدخل رمزًا جديدًا وحاول مجددًا.',
    'Le code d’authentification est incorrect ou a expiré. Saisissez un nouveau code et réessayez.',
  ),
  sessionExpired: L(
    'Your session has expired. Reload this page and try again.',
    'انتهت صلاحية جلستك. أعد تحميل الصفحة وحاول مجددًا.',
    'Votre session a expiré. Rechargez la page et réessayez.',
  ),
  sessionChanged: L(
    'Your session changed. Reload this page to check which account is signed in.',
    'تغيّرت جلستك. أعد تحميل الصفحة للتحقّق من الحساب المسجّل دخوله.',
    'Votre session a changé. Rechargez la page pour vérifier quel compte est connecté.',
  ),
  tooManyAttempts: L(
    'Too many attempts. Please wait a minute before trying again.',
    'تجاوزت عدد المحاولات المسموح به. انتظر دقيقة قبل المحاولة مجددًا.',
    'Trop de tentatives. Veuillez patienter une minute avant de réessayer.',
  ),
  serverUnavailable: L(
    'The server is temporarily unavailable. Please try again shortly.',
    'الخادم غير متاح مؤقتًا. يُرجى المحاولة مجددًا بعد قليل.',
    'Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.',
  ),
  connectionError: L(
    'Unable to reach the server. Check your connection and try again.',
    'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت وحاول مجددًا.',
    'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
  ),
  emailTaken: L(
    'This email is already registered. Sign in or reset your password.',
    'هذا البريد الإلكتروني مسجّل مسبقًا. سجّل الدخول أو أعد تعيين كلمة المرور.',
    'Cette adresse e-mail est déjà enregistrée. Connectez-vous ou réinitialisez votre mot de passe.',
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
