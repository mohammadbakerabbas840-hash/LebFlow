import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export type Locale = 'en' | 'ar' | 'fr';
export type Localized = Record<Locale, string>;
export const L = (en: string, ar: string, fr: string): Localized => ({ en, ar, fr });
export const localeTags = { en: 'en-LB', ar: 'ar-LB', fr: 'fr-LB' };
export const messages = {
  explore: L('Explore services', 'استكشف الخدمات', 'Explorer les services'),
  cases: L('My cases', 'معاملاتي', 'Mes dossiers'),
  reminders: L('Reminders', 'التذكيرات', 'Rappels'),
  appointments: L('Appointments', 'المواعيد', 'Rendez-vous'),
  account: L('My account', 'حسابي', 'Mon compte'),
  register: L('Create account', 'إنشاء حساب', 'Créer un compte'),
  workspace: L('Workspace', 'مساحة العمل', 'Espace personnel'),
  preview: L('FRONTEND PREVIEW', 'نسخة تجريبية للواجهة', 'APERÇU DE L’INTERFACE'),
  everyday: L(
    'YOUR EVERYDAY, SIMPLIFIED',
    'معاملاتك اليومية، ببساطة',
    'VOTRE QUOTIDIEN, SIMPLIFIÉ',
  ),
  lessPaper: L(
    'LESS PAPERWORK. MORE POSSIBILITY.',
    'أوراق أقل. فرص أكثر.',
    'MOINS DE PAPIERS. PLUS DE POSSIBILITÉS.',
  ),
  heading: L(
    'Your next step starts here.',
    'خطوتك التالية تبدأ هنا.',
    'Votre prochaine étape commence ici.',
  ),
  subtitle: L(
    'Navigate public services in Lebanon with more confidence.',
    'أنجز خطوات معاملاتك في لبنان بثقة أكبر.',
    'Avancez dans vos démarches au Liban avec confiance.',
  ),
  casesHeading: L(
    'Everything you’re working on.',
    'كل معاملاتك في مكان واحد.',
    'Tous vos dossiers en cours.',
  ),
  casesSubtitle: L(
    'Organize your documents and follow your own progress.',
    'نظّم مستنداتك وتابع تقدمك بنفسك.',
    'Organisez vos documents et suivez votre progression.',
  ),
  appointmentHeading: L(
    'Make room for your next step.',
    'نظّم مواعيد معاملاتك.',
    'Planifiez votre prochaine étape.',
  ),
  appointmentSubtitle: L(
    'Save preferred dates, then confirm directly with the authority.',
    'احفظ التواريخ التي تناسبك، ثم تواصل مع الجهة المختصة لتأكيد الموعد.',
    'Enregistrez les dates qui vous conviennent, puis faites confirmer votre rendez-vous par l’administration compétente.',
  ),
  reminderHeading: L(
    'Stay one step ahead.',
    'ابقَ مستعداً للخطوة التالية.',
    'Gardez une longueur d’avance.',
  ),
  reminderSubtitle: L(
    'Your upcoming actions and document reminders.',
    'تابع الإجراءات القادمة والتذكيرات المتعلقة بمستنداتك.',
    'Vos prochaines actions et rappels de documents.',
  ),
  lebanon: L('Lebanon', 'لبنان', 'Liban'),
  heroKicker: L(
    'ONE PLATFORM. A CLEARER PATH.',
    'منصة واحدة. طريق أوضح.',
    'UNE PLATEFORME. UN PARCOURS PLUS CLAIR.',
  ),
  heroTitle: L(
    'Life admin,\nminus the guesswork.',
    'معاملاتك اليومية،\nبخطوات واضحة.',
    'Vos démarches,\nen toute clarté.',
  ),
  heroText: L(
    'Find the right service. Prepare your documents. Plan your next visit.',
    'اختر الخدمة. جهّز مستنداتك. خطّط لزيارتك القادمة.',
    'Trouvez votre service. Préparez vos documents. Planifiez votre visite.',
  ),
  findService: L('Find your service', 'ابحث عن خدمتك', 'Trouver un service'),
  clearer: L('A clearer way forward', 'طريق أوضح لإنجاز معاملاتك', 'Un chemin plus clair'),
  nextChapter: L('YOUR NEXT CHAPTER', 'خطوتك القادمة', 'VOTRE PROCHAINE ÉTAPE'),
  sorted: L('Ready. Set. Sorted.', 'جاهز. منظّم. مطمئن.', 'Prêt. Organisé. Serein.'),
  prepare: L('Prepare your documents', 'جهّز مستنداتك', 'Préparez vos documents'),
  track: L('Track your progress', 'تابع تقدمك', 'Suivez votre progression'),
  madeFor: L('Made for your everyday.', 'لأجل معاملاتك اليومية.', 'Pour votre quotidien.'),
  together: L(
    'Essential services, together',
    'خدمات أساسية في مكان واحد',
    'Les services essentiels réunis',
  ),
  multilingual: L(
    'Arabic · English · French',
    'العربية · الإنجليزية · الفرنسية',
    'Arabe · Anglais · Français',
  ),
  savedProgress: L('Your progress, saved', 'تقدمك محفوظ', 'Votre progression enregistrée'),
  helpTitle: L(
    'What can we help you with?',
    'بأي خدمة يمكننا مساعدتك؟',
    'Comment pouvons-nous vous aider ?',
  ),
  helpText: L(
    'Review requirements and appointment guidance before creating a request.',
    'راجع المتطلبات وإرشادات المواعيد قبل إنشاء طلب.',
    'Consultez les conditions, les pièces requises et les modalités de prise de rendez-vous avant de créer un dossier.',
  ),
  categories: L('services', 'خدمات', 'services'),
  search: L('Search services', 'ابحث عن الخدمات', 'Rechercher un service'),
  searchPlaceholder: L(
    'Try “passport”, “police record”, or “university”…',
    'جرّب «جواز سفر» أو «سجل عدلي» أو «جامعة»…',
    'Essayez « passeport », « casier judiciaire » ou « université »…',
  ),
  all: L('All services', 'كل الخدمات', 'Tous les services'),
  popular: L('Popular', 'شائع', 'Populaire'),
  requirements: L('View requirements', 'عرض المتطلبات', 'Consulter les conditions'),
  nearest: L('Nearest available appointment', 'أقرب موعد متاح', 'Prochain rendez-vous disponible'),
  unknown: L(
    'Check with the authority',
    'تحقّق لدى الجهة المختصة',
    'À vérifier auprès de l’autorité',
  ),
  noLive: L(
    'Live availability is not connected. No official slot can be guaranteed here.',
    'LebFlow غير متصل بنظام المواعيد لدى الجهة المختصة، لذلك لا يمكن ضمان توفر موعد رسمي عبر المنصة.',
    'LebFlow n’est pas connecté aux calendriers de rendez-vous des administrations. Aucun créneau officiel ne peut donc être garanti ici.',
  ),
  officialChannel: L(
    'Official / provider channel',
    'التواصل مع الجهة المختصة أو مقدم الخدمة',
    'Contacter l’administration ou le prestataire',
  ),
  contactOffice: L(
    'Contact the responsible office to check its next available appointment.',
    'تواصل مع المكتب المختص للتحقق من أقرب موعد متاح.',
    'Contactez le bureau compétent pour connaître le prochain créneau.',
  ),
  preferred: L(
    'Preferred date — not an official booking',
    'تاريخ مرغوب — لا يُعدّ حجزاً رسمياً',
    'Date souhaitée — aucun rendez-vous officiellement réservé',
  ),
  chooseDate: L(
    'Choose a preferred date',
    'اختر التاريخ الذي يناسبك',
    'Choisissez une date souhaitée',
  ),
  date: L('Date', 'التاريخ', 'Date'),
  time: L('Time', 'الوقت', 'Heure'),
  beirutTime: L(
    'All appointment times use Beirut time.',
    'جميع أوقات المواعيد بتوقيت بيروت.',
    'Tous les horaires sont indiqués à l’heure de Beyrouth.',
  ),
  saveDate: L('Save preferred date', 'حفظ التاريخ المرغوب', 'Enregistrer la date souhaitée'),
  saveDateCreate: L(
    'Save date & create personal request',
    'حفظ التاريخ وإنشاء طلب شخصي',
    'Enregistrer la date et créer un dossier',
  ),
  dateSaved: L(
    'Preferred date saved. Contact the authority to make the official booking.',
    'حُفظ التاريخ المرغوب. تواصل مع الجهة المختصة لحجز موعد رسمي.',
    'Date souhaitée enregistrée. Contactez l’autorité pour réserver officiellement.',
  ),
  futureDate: L(
    'Choose a valid future date and time in Beirut.',
    'اختر تاريخاً ووقتاً صحيحين في المستقبل بتوقيت بيروت.',
    'Choisissez une date et une heure à venir, selon l’heure de Beyrouth.',
  ),
  removeDate: L('Remove preferred date', 'إزالة التاريخ المرغوب', 'Supprimer la date souhaitée'),
  removedDate: L(
    'Preferred date removed. No government booking was cancelled.',
    'أُزيل التاريخ المرغوب من LebFlow. لم يُلغَ أي موعد لدى جهة حكومية.',
    'Date souhaitée supprimée. Aucune réservation officielle n’a été annulée.',
  ),
  noAppointments: L(
    'No preferred dates yet.',
    'لم تحفظ أي تاريخ مرغوب بعد.',
    'Aucune date souhaitée pour le moment.',
  ),
  appointmentEmpty: L(
    'Open any service to check its appointment channel and save a preferred date.',
    'افتح صفحة الخدمة للاطلاع على كيفية حجز موعد وحفظ التاريخ الذي يناسبك.',
    'Ouvrez la fiche d’un service pour connaître les modalités de prise de rendez-vous et enregistrer la date souhaitée.',
  ),
  noResults: L('No matching services', 'لا توجد خدمات مطابقة', 'Aucun service correspondant'),
  tryAgain: L(
    'Try another search or category.',
    'جرّب بحثاً أو فئة أخرى.',
    'Essayez une autre recherche ou catégorie.',
  ),
  clear: L('Clear', 'مسح', 'Effacer'),
  close: L('Close', 'إغلاق', 'Fermer'),
  menu: L('Toggle navigation', 'إظهار أو إخفاء القائمة', 'Afficher ou masquer le menu'),
  language: L('Language', 'اللغة', 'Langue'),
  bannerTitle: L(
    'A place for everything in progress.',
    'مساحة لكل معاملاتك الجارية.',
    'Un espace pour tous vos dossiers.',
  ),
  bannerText: L(
    'Save a request and pick up right where you left off.',
    'احفظ طلبك وتابع من حيث توقفت.',
    'Enregistrez un dossier et reprenez là où vous en étiez.',
  ),
  viewCases: L('View my cases', 'عرض معاملاتي', 'Voir mes dossiers'),
  independent: L(
    'Independent project · Not a government website',
    'مشروع مستقل · ليس موقعاً حكومياً',
    'Projet indépendant · Site non gouvernemental',
  ),
  built: L('Built for Lebanon', 'صُمّم للبنان', 'Conçu pour le Liban'),
  noCases: L(
    'Your first case starts with a service.',
    'معاملتك الأولى تبدأ باختيار خدمة.',
    'Votre premier dossier commence par un service.',
  ),
  noCasesText: L(
    'Review the documents, then create a personal request.',
    'راجع المستندات ثم أنشئ طلباً شخصياً.',
    'Consultez les pièces, puis créez un dossier personnel.',
  ),
  noReminders: L(
    'A little reminder goes a long way.',
    'تذكير صغير يسهّل عليك الكثير.',
    'Un rappel peut tout changer.',
  ),
  noRemindersText: L(
    'Open a saved case and set a next-action date.',
    'افتح معاملة محفوظة وحدّد تاريخ الخطوة التالية.',
    'Ouvrez un dossier et indiquez la date de la prochaine action.',
  ),
  inAppOnly: L(
    'Reminders appear here. Email and push notifications are not enabled.',
    'تظهر التذكيرات في هذه الصفحة. إرسال الإشعارات بالبريد الإلكتروني أو إلى جهازك غير مفعّل.',
    'Les rappels apparaissent ici. Les notifications par e-mail et push ne sont pas activées.',
  ),
  overdue: L('PAST DUE', 'فات موعده', 'ÉCHÉANCE DÉPASSÉE'),
  upcoming: L('UPCOMING ACTION', 'خطوة قادمة', 'PROCHAINE ACTION'),
  newApplication: L('New application', 'طلب جديد', 'Première demande'),
  renewal: L('Renewal', 'تجديد', 'Renouvellement'),
  documentsPrepared: L('documents prepared', 'مستندات جُهّزت', 'documents préparés'),
  notApplicable: L(
    'Does not apply to my case',
    'لا ينطبق على حالتي',
    'Ne s’applique pas à mon dossier',
  ),
  excluded: L('not applicable', 'غير منطبق', 'sans objet'),
  includeDocument: L('Include this document again', 'إعادة إدراج المستند', 'Réinclure ce document'),
  of: L('of', 'من', 'sur'),
  whatNeed: L('What do you need?', 'ما نوع طلبك؟', 'De quoi avez-vous besoin ?'),
  beforeRequest: L('BEFORE YOU CREATE A REQUEST', 'قبل إنشاء طلبك', 'AVANT DE CRÉER UN DOSSIER'),
  requiredDocs: L('Required documents', 'المستندات المطلوبة', 'Pièces justificatives requises'),
  items: L('items to review', 'مستندات للمراجعة', 'pièces à consulter'),
  evidenceNote: L(
    'Read the scope and source notes. Conditional documents apply only to the stated situation.',
    'راجع الفئات التي تشملها الخدمة وملاحظات المصادر. بعض المستندات مطلوبة فقط في الحالات الموضّحة بجانبها.',
    'Consultez le périmètre et les sources. Les pièces conditionnelles concernent uniquement les cas indiqués.',
  ),
  eligibility: L('Eligibility & requirements', 'شروط التقديم', 'Éligibilité et conditions'),
  fees: L('Estimated fees', 'الرسوم التقديرية', 'Frais indicatifs'),
  where: L('Where to go', 'أين تتوجّه؟', 'Où se rendre ?'),
  tests: L('Tests & appointments', 'الاختبارات والمواعيد', 'Examens et rendez-vous'),
  requirementsMayChange: L(
    'Requirements may change. Confirm details with the responsible authority before visiting.',
    'قد تتغيّر المتطلبات. تحقّق من التفاصيل لدى الجهة المختصة قبل الزيارة.',
    'Les exigences peuvent changer. Vérifiez les détails auprès de l’administration compétente avant de vous déplacer.',
  ),
  sourceNotes: L('Sources & verification', 'المصادر والتحقّق', 'Sources et vérification'),
  reviewed: L(
    'Research review: 13 September 2026',
    'آخر مراجعة للمصادر: ١٣ أيلول ٢٠٢٦',
    'Revue des sources : 13 septembre 2026',
  ),
  sourceBased: L(
    'Source-backed core guidance',
    'إرشادات أساسية تستند إلى مصادر',
    'Informations de base sourcées',
  ),
  draft: L(
    'Partially verified · confirm details',
    'معلومات متحقّق منها جزئياً · راجع التفاصيل لدى الجهة المختصة',
    'Vérification partielle · détails à confirmer',
  ),
  progress: L('Your request progress', 'مراحل متابعة طلبك', 'Progression de votre dossier'),
  futureProgress: L(
    'How you’ll track your request',
    'كيف ستتابع طلبك',
    'Comment suivre votre dossier',
  ),
  selfReported: L(
    'Stages are self-reported. Their order and appointment timing can vary by service.',
    'أنت من يحدّث مرحلة الطلب على المنصة. قد يختلف ترتيب المراحل وتوقيت الموعد بحسب الخدمة.',
    'Vous indiquez vous-même l’avancement du dossier. L’ordre des étapes et le moment du rendez-vous peuvent varier selon la démarche.',
  ),
  currentStage: L('Current stage', 'المرحلة الحالية', 'Étape actuelle'),
  nextAction: L('Next action reminder', 'تذكير الخطوة التالية', 'Rappel de la prochaine action'),
  savedHere: L(
    'Your personal request is saved in this browser.',
    'طلبك الشخصي محفوظ في هذا المتصفح.',
    'Votre dossier personnel est enregistré dans ce navigateur.',
  ),
  createExplain: L(
    'Create a personal request to organize your documents.',
    'أنشئ طلباً شخصياً لتنظيم مستنداتك.',
    'Créez un dossier personnel pour organiser vos documents.',
  ),
  notGovernment: L(
    'LebFlow does not send this request to the government or issue documents.',
    'لا ترسل LebFlow هذا الطلب إلى الحكومة ولا تصدر المستندات.',
    'LebFlow ne transmet pas ce dossier à l’administration et ne délivre aucun document.',
  ),
  createRequest: L('Create personal request', 'إنشاء طلب شخصي', 'Créer un dossier personnel'),
  saveFailed: L(
    'Browser storage is unavailable. Changes last only while this page is open.',
    'تعذّر حفظ البيانات في المتصفح. ستبقى التغييرات متاحة ما دامت هذه الصفحة مفتوحة.',
    'Le stockage du navigateur est indisponible. Les modifications sont conservées uniquement tant que cette page reste ouverte.',
  ),
  about: L('How LebFlow works', 'كيف تعمل LebFlow', 'Comment fonctionne LebFlow'),
  aboutText: L(
    'Review source-linked guidance, prepare documents, and track your own requests. Confirm fees and appointments with the responsible authority.',
    'راجع الإرشادات ومصادرها، وجهّز المستندات، وتابع طلباتك بنفسك. تحقّق من الرسوم وأكّد المواعيد لدى الجهة المختصة.',
    'Consultez les guides sourcés, préparez vos pièces et suivez vos dossiers. Vérifiez les frais et confirmez les rendez-vous auprès de l’administration compétente.',
  ),
  accountTitle: L(
    'Your account starts with you.',
    'ابدأ بإنشاء ملفك الشخصي.',
    'Créez votre profil personnel.',
  ),
  accountSubtitle: L(
    'Create your profile. Your ID number and identity documents are optional.',
    'أنشئ ملفك الشخصي. رقم بطاقة الهوية ومستندات إثبات الهوية اختيارية.',
    'Créez votre profil. Le numéro de carte d’identité et les justificatifs d’identité sont facultatifs.',
  ),
  prototypePrivacy: L(
    'Registration preview: use sample information and sample documents. Nothing is uploaded. Your profile and files stay in memory and are cleared on refresh or sign-out. No real account or identity verification is created.',
    'تسجيل تجريبي: استخدم بيانات ومستندات غير حقيقية للتجربة. لا تُرسل الملفات إلى أي خادم. تُحفظ بيانات ملفك الشخصي ومستنداتك مؤقتاً في الذاكرة، وتُحذف عند تحديث الصفحة أو تسجيل الخروج. لا يُنشأ حساب فعلي ولا تُجرى عملية تحقّق من الهوية.',
    'Inscription de démonstration : utilisez des informations et des documents fictifs. Aucun fichier n’est envoyé. Votre profil et vos fichiers restent en mémoire et sont effacés lorsque vous actualisez la page ou vous déconnectez. Aucun compte réel n’est créé et aucune vérification d’identité n’est effectuée.',
  ),
  personalInfo: L('Personal information', 'المعلومات الشخصية', 'Informations personnelles'),
  fullName: L(
    'Full name as shown on your ID',
    'الاسم الكامل كما يرد في بطاقة الهوية',
    'Nom complet figurant sur la pièce d’identité',
  ),
  dob: L('Date of birth', 'تاريخ الميلاد', 'Date de naissance'),
  idNumber: L('ID number', 'رقم بطاقة الهوية', 'Numéro de la carte d’identité'),
  email: L('Email address', 'البريد الإلكتروني', 'Adresse e-mail'),
  password: L('Password', 'كلمة المرور', 'Mot de passe'),
  confirmPassword: L('Confirm password', 'تأكيد كلمة المرور', 'Confirmer le mot de passe'),
  passwordHint: L(
    'At least 12 characters. Use a sample password in this preview.',
    '١٢ خانة على الأقل (أحرف أو أرقام أو رموز). استخدم كلمة مرور تجريبية.',
    'Au moins 12 caractères. Utilisez un mot de passe fictif pour cet aperçu.',
  ),
  identityDocuments: L('Identity documents', 'مستندات الهوية', 'Justificatifs d’identité'),
  idPhoto: L('Photo of your ID', 'صورة بطاقة الهوية', 'Photo de votre carte d’identité'),
  extract: L(
    'Individual civil-status extract',
    'إخراج قيد إفرادي',
    'Extrait individuel d’état civil',
  ),
  imageTypes: L(
    'JPG, PNG or WebP · maximum 5 MB',
    'JPG أو PNG أو WebP · ٥ ميغابايت كحد أقصى',
    'JPG, PNG ou WebP · 5 Mo maximum',
  ),
  extractTypes: L(
    'JPG, PNG, WebP or PDF · maximum 5 MB',
    'JPG أو PNG أو WebP أو PDF · ٥ ميغابايت كحد أقصى',
    'JPG, PNG, WebP ou PDF · 5 Mo maximum',
  ),
  chooseFile: L('Choose a file', 'اختر ملفاً', 'Choisir un fichier'),
  changeFile: L('Replace file', 'استبدال الملف', 'Remplacer le fichier'),
  removeFile: L('Remove file', 'إزالة الملف', 'Supprimer le fichier'),
  validating: L('Checking file…', 'جارٍ فحص الملف…', 'Vérification du fichier…'),
  consent: L(
    'I understand this is a preview and agree to use the selected sample documents in this session.',
    'أفهم أن هذه نسخة تجريبية وأوافق على استخدام المستندات التجريبية المختارة في هذه الجلسة.',
    'Je comprends qu’il s’agit d’un aperçu et j’accepte l’utilisation des documents fictifs dans cette session.',
  ),
  createPreview: L(
    'Create preview account',
    'إنشاء حساب تجريبي',
    'Créer un compte de démonstration',
  ),
  previewReady: L(
    'Your preview profile is ready.',
    'ملفك التجريبي جاهز.',
    'Votre profil de démonstration est prêt.',
  ),
  unverified: L('Identity not verified', 'لم يتم التحقق من الهوية', 'Identité non vérifiée'),
  signOut: L(
    'Sign out & clear profile',
    'الخروج ومسح الملف الشخصي',
    'Se déconnecter et effacer le profil',
  ),
  filesAttached: L(
    'Required files attached for this session',
    'المستندات المطلوبة مرفقة لهذه الجلسة',
    'Pièces requises jointes pour cette session',
  ),
  registrationRule: L(
    'These are LebFlow registration fields, not universal government requirements. Each service has its own rules.',
    'هذه البيانات مطلوبة للتسجيل في LebFlow، ولا تعني أنها مطلوبة لكل معاملة حكومية. لكل خدمة شروطها الخاصة.',
    'Ces champs sont propres à l’inscription LebFlow. Chaque démarche administrative a ses propres règles.',
  ),
  requiredError: L('Complete this field.', 'أكمل هذا الحقل.', 'Complétez ce champ.'),
  nameError: L(
    'Enter your full name (2–120 characters).',
    'أدخل اسمك الكامل (من ٢ إلى ١٢٠ حرفاً).',
    'Saisissez votre nom complet (2 à 120 caractères).',
  ),
  dobError: L(
    'Enter a valid birth date in the past.',
    'أدخل تاريخ ميلاد صحيحاً في الماضي.',
    'Saisissez une date de naissance valide dans le passé.',
  ),
  idError: L(
    'Enter an ID number of 3–30 characters.',
    'أدخل رقم بطاقة الهوية بطول يتراوح بين ٣ و٣٠ خانة.',
    'Saisissez un numéro de carte d’identité de 3 à 30 caractères.',
  ),
  emailError: L(
    'Enter a valid email address.',
    'أدخل بريداً إلكترونياً صحيحاً.',
    'Saisissez une adresse e-mail valide.',
  ),
  passwordError: L(
    'Use at least 12 characters.',
    'استخدم ١٢ خانة على الأقل (أحرف أو أرقام أو رموز).',
    'Utilisez au moins 12 caractères.',
  ),
  passwordMismatch: L(
    'Passwords do not match.',
    'كلمتا المرور غير متطابقتين.',
    'Les mots de passe ne correspondent pas.',
  ),
  fileRequired: L(
    'Attach this document before continuing.',
    'أرفق هذا المستند قبل المتابعة.',
    'Joignez ce document avant de continuer.',
  ),
  fileSize: L(
    'Choose a nonempty file no larger than 5 MB.',
    'اختر ملفاً غير فارغ بحجم لا يتجاوز ٥ ميغابايت.',
    'Choisissez un fichier non vide de 5 Mo maximum.',
  ),
  fileType: L(
    'This file format is not supported.',
    'صيغة هذا الملف غير مدعومة.',
    'Ce format de fichier n’est pas accepté.',
  ),
  fileInvalid: L(
    'The file content does not match an accepted format.',
    'محتوى الملف لا يطابق إحدى الصيغ المدعومة.',
    'Le contenu du fichier ne correspond pas à un format accepté.',
  ),
  fileUnreadable: L(
    'This file could not be read. Choose another file.',
    'تعذّرت قراءة الملف. اختر ملفاً آخر.',
    'Impossible de lire ce fichier. Choisissez-en un autre.',
  ),
  consentError: L(
    'Please acknowledge the preview notice to continue.',
    'يرجى تأكيد اطلاعك على شروط النسخة التجريبية وموافقتك عليها للمتابعة.',
    'Veuillez confirmer que vous avez lu et accepté les conditions de cette démonstration pour continuer.',
  ),
};
export type MessageKey = keyof typeof messages;
export function formatDocumentProgress(locale: Locale, prepared: number, total: number) {
  if (locale === 'ar') return `المستندات المجهّزة: ${prepared} من أصل ${total}`;
  if (locale === 'fr') return `Documents préparés : ${prepared} sur ${total}`;
  return `${prepared} of ${total} documents prepared`;
}
export function translate(locale: Locale, key: MessageKey) {
  return messages[key][locale];
}
const I18nContext = createContext({
  locale: 'en' as Locale,
  setLocale: (_: Locale) => {},
  t: (key: MessageKey) => translate('en', key),
});
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    try {
      const saved = localStorage.getItem('lebflow-language');
      return saved === 'ar' || saved === 'fr' ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.title = `LebFlow — ${messages.clearer[locale]}`;
    try {
      localStorage.setItem('lebflow-language', locale);
    } catch {
      /* Language still works for this session. */
    }
  }, [locale]);
  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key) => translate(locale, key) }}>
      {children}
    </I18nContext.Provider>
  );
}
export const useI18n = () => useContext(I18nContext);
