import { L, type Localized, type Locale } from '../i18n';
import { civilServices } from './civilServices';
export const stageTranslations = [
  L('Preparing documents', 'تجهيز المستندات', 'Préparation des documents'),
  L('Ready to submit', 'جاهز للتقديم', 'Prêt pour le dépôt'),
  L('Appointment', 'الموعد', 'Rendez-vous'),
  L('Submitted', 'تم تقديم الطلب', 'Dossier déposé'),
  L('Processing', 'قيد المعالجة', 'En cours de traitement'),
  L('Completed', 'مكتمل', 'Terminé'),
];
type Source = { title: Localized; url: string };
type Doc = {
  id: string;
  title: Localized;
  note: Localized;
  renewalOnly?: boolean;
  applicationOnly?: boolean;
};
export type Content = {
  lastReviewedAt?: string;
  title: Localized;
  subtitle: Localized;
  category: Localized;
  scope: Localized;
  eligibility: Localized[];
  documents: Doc[];
  fees: Localized;
  location: Localized;
  appointments: Localized;
  renewal?: Localized;
  sourceNote: Localized;
  sources: Source[];
  channel?: Source;
  evidence: 'core' | 'partial';
};
const S = (url: string, title: Localized): Source => ({ url, title });
const D = (id: string, title: Localized, note: Localized): Doc => ({ id, title, note });
const identity = D(
  'identity',
  L('Identity document and copies', 'مستند إثبات الهوية ونسخ عنه', 'Pièce d’identité et copies'),
  L(
    'Confirm the accepted ID and copies for your exact procedure.',
    'تحقّق من مستند الهوية المقبول والنسخ المطلوبة لمعاملتك.',
    'Vérifiez quelle pièce d’identité est acceptée et quelles copies sont nécessaires pour votre démarche.',
  ),
);
const feeUnknown = L(
  'Current fee not verified. Confirm the amount and payment method with the receiving office.',
  'لم يُتحقّق من الرسوم الحالية. استفسر عن المبلغ وطريقة الدفع لدى الجهة التي تتسلّم الطلب.',
  'Les frais actuels n’ont pas été vérifiés. Renseignez-vous sur le montant et le mode de paiement auprès du service qui reçoit votre dossier.',
);
const gs = S(
  'https://www.general-security.gov.lb/ar/posts/11',
  L(
    'General Security — new passport',
    'الأمن العام — إصدار جواز سفر جديد',
    'Sûreté générale — nouveau passeport',
  ),
);
const isf = S(
  'https://isf.gov.lb/faq/',
  L(
    'ISF — criminal-record guidance',
    'قوى الأمن الداخلي — السجل العدلي',
    'Forces de sécurité intérieure — casier judiciaire',
  ),
);
const tmo = S(
  'https://tmo.gov.lb/web/',
  L('Official TMO portal', 'بوابة هيئة السير الرسمية', 'Portail officiel TMO'),
);
const mehe = S(
  'https://www.mehe.gov.lb/ar/services/المصادقات-الجامعية',
  L(
    'MEHE — university authentication',
    'وزارة التربية — المصادقات الجامعية',
    'Ministère de l’Éducation — authentification des documents universitaires',
  ),
);
const engineering = S(
  'https://www.mehe.gov.lb/ar/services/أمانة-سر-لجنة-مزاولة-مهنة-الهندسة',
  L(
    'MEHE — engineering practice',
    'وزارة التربية — مزاولة مهنة الهندسة',
    'Ministère de l’Éducation — autorisation d’exercer la profession d’ingénieur',
  ),
);

export const serviceContent: Record<string, Content> = {
  ...civilServices,
  passport: {
    lastReviewedAt: '2026-09-27',
    title: L('Passport application', 'طلب جواز سفر', 'Demande de passeport'),
    subtitle: L(
      'New passports & renewals',
      'إصدار جواز سفر جديد أو تجديده',
      'Première demande et renouvellement',
    ),
    category: L('Identity & travel', 'الهوية والسفر', 'Identité et voyage'),
    scope: L(
      'Lebanese biometric passport • applications in Lebanon',
      'جواز سفر لبناني بيومتري • للطلبات المقدّمة داخل لبنان',
      'Passeport biométrique libanais • demandes au Liban',
    ),
    eligibility: [
      L(
        'For Lebanese citizens. Identity requirements vary with ID age, photo likeness, and application type.',
        'للمواطنين اللبنانيين. تختلف مستندات إثبات الهوية المطلوبة بحسب تاريخ إصدار البطاقة ومدى مطابقة الصورة لصاحبها ونوع الطلب.',
        'Pour les citoyens libanais. Les justificatifs d’identité requis varient selon l’ancienneté de la carte, la ressemblance de la photo avec son titulaire et le type de demande.',
      ),
      L(
        'Under 18: parental/guardian consent and a recent individual extract. Custody and overseas consent need additional checks.',
        'لمن هم دون ١٨ سنة: موافقة الوالدين أو الوصي وإخراج قيد إفرادي حديث. تحقّق من الشروط الإضافية في حالات الحضانة أو صدور الموافقة من خارج لبنان.',
        'Moins de 18 ans : consentement parental ou du tuteur et extrait récent. Garde et consentement à l’étranger à vérifier.',
      ),
      L(
        'Bring A4 copies. Confirm photograph dimensions: official language versions contain differences.',
        'أحضر نسخاً بحجم A4. تحقّق من أبعاد الصورة المطلوبة، إذ تختلف المعلومات بين النسخ اللغوية للموقع الرسمي.',
        'Prévoyez des copies A4. Confirmez le format photo : les versions linguistiques officielles diffèrent.',
      ),
    ],
    documents: [
      D(
        'form',
        L('Passport application form', 'استمارة طلب جواز السفر', 'Formulaire de passeport'),
        L(
          'Approved A4 form; confirm the competent mukhtar.',
          'الاستمارة المعتمدة بحجم A4؛ تحقّق من المختار المختص بمعاملتك.',
          'Formulaire A4 agréé ; confirmez le moukhtar compétent.',
        ),
      ),
      D(
        'identity',
        L(
          'Lebanese ID and/or individual civil-status extract',
          'بطاقة هوية لبنانية و/أو إخراج قيد إفرادي',
          'Carte d’identité libanaise et/ou extrait individuel d’état civil',
        ),
        L(
          'Some first applications need an extract under 3 months and an additional ID document; consult the official identity table.',
          'تتطلّب بعض طلبات الإصدار للمرة الأولى إخراج قيد لم يمضِ على إصداره ٣ أشهر، ومستنداً إضافياً لإثبات الهوية. راجع الجدول الرسمي لمعرفة ما ينطبق على حالتك.',
          'Certains premiers dossiers exigent un extrait de moins de 3 mois et un autre justificatif ; consultez le tableau officiel.',
        ),
      ),
      D(
        'photo',
        L(
          'Recent certified passport photograph',
          'صورة شمسية حديثة ومصدّقة',
          'Photo d’identité récente et certifiée',
        ),
        L(
          'Full face, white background, required mukhtar certification. Confirm dimensions before printing.',
          'صورة للوجه من الأمام بخلفية بيضاء، مع تصديق المختار المطلوب. تحقّق من الأبعاد قبل الطباعة.',
          'Visage de face, fond blanc, certification du moukhtar. Confirmez les dimensions avant impression.',
        ),
      ),
      D(
        'previous',
        L(
          'Previous passport and copies',
          'جواز السفر السابق ونسخ عنه',
          'Ancien passeport et copies',
        ),
        L(
          'Bring the previous passport if available; replacement requires the passport being replaced.',
          'أحضر جواز السفر السابق إن وُجد. وعند طلب استبداله، أحضر الجواز الذي تريد استبداله.',
          'Apportez l’ancien passeport si disponible ; pour le remplacement, le passeport concerné.',
        ),
      ),
      D(
        'guardian',
        L(
          'Parental consent / guardianship — minors only',
          'موافقة الوالدين أو الوصاية — للقاصرين فقط',
          'Consentement parental / tutelle — mineurs uniquement',
        ),
        L(
          'Confirm signatories and certified authorizations. Adults may mark this item not applicable.',
          'تحقّق ممّن يحق له التوقيع ومن التفويضات المصدّقة المطلوبة. إذا كنت راشداً، يمكنك تحديد أن هذا المستند لا ينطبق على حالتك.',
          'Confirmez les signataires et autorisations certifiées. Pour les adultes, indiquez « sans objet ».',
        ),
      ),
    ],
    fees: L(
      'Published base fees: 5 years — LBP 6,000,000; 10 years — LBP 10,000,000. Urgent service costs extra. Confirm eligibility and total.',
      'الرسوم الأساسية المنشورة: جواز صالح لـ٥ سنوات — ٦٬٠٠٠٬٠٠٠ ل.ل.؛ ولـ١٠ سنوات — ١٠٬٠٠٠٬٠٠٠ ل.ل. تُضاف رسوم للمعاملة المستعجلة. تحقّق من الشروط التي تنطبق عليك ومن المبلغ الإجمالي.',
      'Tarifs de base publiés : 5 ans — 6 000 000 LBP ; 10 ans — 10 000 000 LBP. Un supplément s’applique au traitement urgent. Vérifiez les conditions d’éligibilité et le montant total.',
    ),
    location: L(
      'Competent General Security regional center, according to the official identity-document table.',
      'مركز الأمن العام المختص وفق جدول مستندات الهوية الرسمي.',
      'Centre régional compétent de la Sûreté générale, selon le tableau officiel d’identité.',
    ),
    appointments: L(
      'Published processing: standard 30 working days; urgent regional 7 working days; urgent Public Relations 48 hours. These are not appointment slots.',
      'مدد إنجاز المعاملة المنشورة: ٣٠ يوم عمل للطلب العادي، و٧ أيام عمل للطلب المستعجل في المراكز الإقليمية، و٤٨ ساعة للطلب المستعجل لدى العلاقات العامة. هذه مدد معالجة الطلبات، وليست مواعيد متاحة للحجز.',
      'Délais de traitement publiés : procédure ordinaire, 30 jours ouvrés ; procédure urgente en centre régional, 7 jours ouvrés ; procédure urgente auprès des Relations publiques, 48 heures. Ces délais n’indiquent pas les disponibilités de rendez-vous.',
    ),
    renewal: L(
      'Ordinary replacement is described for validity under 18 months. The identity table also permits a matching new-format extract under one year for the stated replacement route. Confirm your case.',
      'تصف التعليمات إجراء الاستبدال العادي عندما يتبقّى أقل من ١٨ شهراً على انتهاء صلاحية الجواز. ويتيح جدول إثبات الهوية، في حالة الاستبدال المحدّدة فيه، إخراج قيد وفق النموذج الجديد لم يمضِ على إصداره عام، مع استيفاء شروط المطابقة. تحقّق لدى الأمن العام ممّا ينطبق على حالتك.',
      'Remplacement ordinaire décrit à moins de 18 mois d’échéance. Le tableau permet aussi un extrait concordant de moins d’un an dans le parcours indiqué. Confirmez votre cas.',
    ),
    sourceNote: L(
      'Official sources rechecked on 27 September 2026; the published base fees are unchanged. Photo and identity details vary by route; confirm special cases directly.',
      'أُعيدت مراجعة المصادر الرسمية في ٢٧ أيلول ٢٠٢٦؛ لم تتغير الرسوم الأساسية المنشورة. تختلف تفاصيل الهوية والصور حسب نوع الطلب؛ استفسر مباشرة عن الحالات الخاصة.',
      'Sources officielles revérifiées le 27 septembre 2026 ; les tarifs de base publiés sont inchangés. Les justificatifs et photos varient selon la démarche ; confirmez les cas particuliers.',
    ),
    evidence: 'core',
    sources: [
      gs,
      S(
        'https://www.general-security.gov.lb/ar/posts/408',
        L(
          'Identity-document rules',
          'معايير مستندات الهوية',
          'Règles des justificatifs d’identité',
        ),
      ),
      S(
        'https://www.general-security.gov.lb/ar/posts/69',
        L('Passport replacement', 'إبدال جواز السفر', 'Remplacement du passeport'),
      ),
      S(
        'https://www.general-security.gov.lb/ar/posts/493',
        L('Fees and processing times', 'الرسوم ومهل الإنجاز', 'Frais et délais'),
      ),
    ],
    channel: S(
      'https://www.general-security.gov.lb/ar/posts/141',
      L(
        'General Security contact center — 1717',
        'مركز اتصال الأمن العام — ١٧١٧',
        'Centre de contact Sûreté générale — 1717',
      ),
    ),
  },
  police: {
    title: L('Judicial record', 'السجل العدلي', 'Casier judiciaire'),
    subtitle: L(
      'Police records & background clearance',
      'إصدار بيان السجل العدلي',
      'Obtention d’un extrait de casier judiciaire',
    ),
    category: L('Civil & legal', 'المعاملات المدنية والقانونية', 'État civil et justice'),
    scope: L(
      'Lebanese residents; other applicant categories need separate checks',
      'للمواطنين اللبنانيين المقيمين؛ تحقّق من الشروط الخاصة بالفئات الأخرى',
      'Libanais résidents ; autres catégories à vérifier séparément',
    ),
    eligibility: [
      L(
        'ISF lists personal, legal-representative, mukhtar-certified mandate, and LibanPost routes.',
        'تذكر قوى الأمن الداخلي إمكان التقديم شخصياً، أو بواسطة وكيل قانوني، أو بتفويض مصدّق من المختار، أو عبر ليبان بوست.',
        'Les FSI indiquent plusieurs modalités : en personne, par mandataire légal, avec un mandat certifié par le moukhtar ou via LibanPost.',
      ),
      L(
        'Foreign residents, applicants abroad, and institutional requests have different document rules.',
        'تختلف المستندات المطلوبة للأجانب المقيمين، وللمتقدّمين من خارج لبنان، وللطلبات المقدّمة من المؤسسات.',
        'Les résidents étrangers, personnes à l’étranger et organismes suivent des règles différentes.',
      ),
    ],
    documents: [
      D(
        'identity',
        L(
          'ID card, civil-status extract, or passport',
          'بطاقة هوية أو إخراج قيد أو جواز سفر',
          'Carte d’identité, extrait d’état civil ou passeport',
        ),
        L(
          'ISF lists these alternatives for Lebanese residents.',
          'تذكر قوى الأمن الداخلي هذه المستندات كبدائل مقبولة للمواطنين اللبنانيين المقيمين.',
          'Alternatives indiquées par les FSI pour les Libanais résidents.',
        ),
      ),
      D(
        'authorization',
        L(
          'Authorization — represented applicants only',
          'تفويض — إذا قدّم شخص آخر الطلب نيابةً عنك',
          'Mandat — en cas de représentation uniquement',
        ),
        L(
          'Use the authorization accepted for your submission route.',
          'استخدم التفويض المعتمد بحسب الطريقة التي ستقدّم بها الطلب.',
          'Utilisez le mandat accepté pour votre parcours.',
        ),
      ),
      D(
        'residence',
        L(
          'Residence evidence — foreign residents only',
          'إثبات إقامة — للأجانب فقط',
          'Justificatif de séjour — étrangers uniquement',
        ),
        L(
          'Confirm identity and legal-residence evidence for your nationality.',
          'تحقّق من مستندات إثبات الهوية والإقامة القانونية المطلوبة بحسب جنسيتك.',
          'Confirmez les justificatifs d’identité et de séjour selon votre nationalité.',
        ),
      ),
      D(
        'employer',
        L(
          'Institution letter — institutional requests only',
          'كتاب رسمي من المؤسسة — لطلبات المؤسسات فقط',
          'Lettre de l’organisme — demandes institutionnelles',
        ),
        L(
          'ISF describes a letter naming the authorized recipient alongside identity documents.',
          'تذكر قوى الأمن الداخلي كتاباً رسمياً يحدّد الشخص المفوّض باستلام المستند، إلى جانب مستندات إثبات الهوية.',
          'Les FSI prévoient une lettre désignant le destinataire autorisé, avec les pièces d’identité.',
        ),
      ),
    ],
    fees: feeUnknown,
    location: L(
      'ISF criminal-record offices during official hours; LibanPost offers a separate delivery route.',
      'مكاتب السجل العدلي التابعة لقوى الأمن الداخلي خلال الدوام الرسمي. وتوفّر ليبان بوست خدمة منفصلة لتوصيل المستند.',
      'Bureaux du casier des FSI aux heures officielles ; voie de livraison distincte chez LibanPost.',
    ),
    appointments: L(
      'ISF describes reception during official hours, not a live calendar. Confirm office hours before visiting.',
      'توضح قوى الأمن الداخلي أوقات استقبال المراجعين، ولا تعرض مواعيد شاغرة لحظة بلحظة. تحقّق من الدوام قبل الزيارة.',
      'Les FSI décrivent un accueil aux heures officielles, pas un calendrier en direct. Confirmez les horaires.',
    ),
    sourceNote: L(
      'Source-backed routes; conditional documents apply only to the stated category. Current fees and live dates are unverified.',
      'تستند طرق تقديم الطلب إلى المصادر المذكورة. بعض المستندات تخص فئات محدّدة فقط. لم يُتحقّق من الرسوم الحالية أو المواعيد الشاغرة.',
      'Parcours sourcés ; pièces conditionnelles selon la catégorie. Frais actuels et créneaux non vérifiés.',
    ),
    sources: [
      isf,
      S(
        'https://www.libanpost.com/english/police-record',
        L(
          'LibanPost — police record',
          'ليبان بوست — السجل العدلي',
          'LibanPost — casier judiciaire',
        ),
      ),
    ],
    evidence: 'core',
    channel: isf,
  },
  driving: {
    title: L('Driving license', 'رخصة القيادة', 'Permis de conduire'),
    subtitle: L(
      'First licenses, tests & renewals',
      'إصدار رخصة القيادة للمرة الأولى، والاختبارات، والتجديد',
      'Première demande, examens et renouvellement',
    ),
    category: L('Transport', 'النقل', 'Transport'),
    scope: L(
      'Preparation template pending TMO confirmation',
      'قائمة أولية للتحضير؛ تحقّق من متطلباتها لدى هيئة السير',
      'Liste préparatoire à confirmer auprès de la TMO',
    ),
    eligibility: [
      L(
        'Confirm age, nationality/residence, category, and medical eligibility with TMO.',
        'تحقّق لدى هيئة السير من شروط العمر والجنسية أو الإقامة وفئة الرخصة واللياقة الصحية.',
        'Vérifiez auprès de la TMO les conditions d’âge, de nationalité ou de résidence, ainsi que la catégorie du permis et les exigences d’aptitude médicale.',
      ),
      L(
        'First applications and renewals differ. TMO’s live calendar was not accessible during this review.',
        'تختلف إجراءات إصدار رخصة القيادة للمرة الأولى عن إجراءات تجديدها. تعذّر الاطلاع على المواعيد المتاحة لدى هيئة السير أثناء مراجعة المعلومات.',
        'Les démarches diffèrent entre une première demande et un renouvellement. Le calendrier de rendez-vous de la TMO était inaccessible lors de cette vérification.',
      ),
    ],
    documents: [
      identity,
      D(
        'form',
        L(
          'Driving-license application form',
          'استمارة طلب رخصة القيادة',
          'Formulaire de permis de conduire',
        ),
        L(
          'Confirm the form for your category and request type.',
          'تحقّق من الاستمارة المناسبة لفئة رخصة القيادة ونوع الطلب.',
          'Confirmez le formulaire pour votre catégorie et demande.',
        ),
      ),
      D(
        'photo',
        L('Recent photographs', 'صور شمسية حديثة', 'Photos d’identité récentes'),
        L(
          'Confirm quantity, dimensions, and certification.',
          'تحقّق من عدد الصور وأبعادها والتصديق المطلوب.',
          'Vérifiez le nombre de photos, leur format et la certification requise.',
        ),
      ),
      D(
        'medical',
        L(
          'Medical / fitness certificate',
          'شهادة طبية أو شهادة لياقة صحية',
          'Certificat médical / d’aptitude',
        ),
        L(
          'Draft item: confirm necessity, validity, and accepted practitioner.',
          'مستند محتمل: تحقّق من وجوب تقديمه ومدة صلاحيته والطبيب المعتمد لإصداره.',
          'Pièce à confirmer : vérifiez si elle est nécessaire, sa durée de validité et les praticiens habilités à la délivrer.',
        ),
      ),
      {
        ...D(
          'training',
          L(
            'Training and test documents, if applicable',
            'مستندات التدريب والاختبارات، إذا كانت مطلوبة لحالتك',
            'Justificatifs de formation et d’examens, si applicables',
          ),
          L(
            'Ask about theory/practical tests and first-license training records.',
            'استفسر عن الاختبارين النظري والعملي، وعن سجل التدريب المطلوب لإصدار رخصة القيادة للمرة الأولى.',
            'Renseignez-vous sur les examens théoriques, pratiques et la formation.',
          ),
        ),
        applicationOnly: true,
      },
      {
        ...D(
          'license',
          L('Existing driving license', 'رخصة القيادة الحالية', 'Permis de conduire actuel'),
          L(
            'For renewal: confirm originals and copies.',
            'للتجديد: تحقّق من المستندات الأصلية والنسخ المطلوب تقديمها.',
            'Pour renouveler : confirmez originaux et copies.',
          ),
        ),
        renewalOnly: true,
      },
    ],
    fees: feeUnknown,
    location: L(
      'Competent TMO branch. LibanPost lists selected renewal services; confirm availability.',
      'فرع هيئة السير المختص. تعرض ليبان بوست بعض خدمات التجديد؛ تحقّق من توفر الخدمة التي تحتاجها.',
      'Centre compétent de la TMO. LibanPost indique certains renouvellements ; confirmez leur disponibilité.',
    ),
    appointments: L(
      'Check the official TMO portal for service, branch, and booking instructions. LebFlow has no live slots.',
      'راجع الموقع الرسمي لهيئة السير لمعرفة الخدمة والفرع المختص وكيفية حجز موعد. لا تعرض LebFlow المواعيد الشاغرة في الوقت الفعلي.',
      'Consultez le portail officiel de la TMO pour choisir le service et le centre compétent, puis suivre les instructions de réservation. LebFlow n’affiche pas les disponibilités en temps réel.',
    ),
    renewal: L(
      'Bring the current license and confirm medical or examination requirements.',
      'أحضر رخصة القيادة الحالية، وتحقّق من الشهادات الطبية أو الاختبارات المطلوبة للتجديد.',
      'Apportez votre permis actuel et vérifiez les certificats médicaux et les examens éventuellement requis.',
    ),
    sourceNote: L(
      'LibanPost confirms selected routes, not this full checklist. Document requirements remain a draft.',
      'تؤكد معلومات ليبان بوست توفر بعض طرق إنجاز المعاملة، لكنها لا تؤكد جميع مستندات هذه القائمة. تحقّق من المستندات المطلوبة لدى الجهة المختصة.',
      'LibanPost confirme certains parcours, pas toute cette liste. Les pièces restent à confirmer.',
    ),
    sources: [
      tmo,
      S(
        'https://www.libanpost.com/english/registration-department',
        L(
          'LibanPost — registration services',
          'ليبان بوست — معاملات التسجيل',
          'LibanPost — immatriculation',
        ),
      ),
    ],
    channel: tmo,
    evidence: 'partial',
  },
  university: {
    title: L('University documents', 'المستندات الجامعية', 'Documents universitaires'),
    subtitle: L(
      'Certificates, transcripts & authentication',
      'الشهادات الجامعية وكشوف العلامات وتصديق المستندات',
      'Diplômes, relevés et authentification',
    ),
    category: L('Education', 'التعليم', 'Éducation'),
    scope: L(
      'University issuance; MEHE authentication for licensed private institutions in Lebanon',
      'إصدار المستندات من الجامعة؛ وتصديقها لدى الوزارة لمؤسسات التعليم العالي الخاص المرخّصة في لبنان',
      'Délivrance universitaire ; authentification MEES des établissements privés agréés au Liban',
    ),
    eligibility: [
      L(
        'Issuance, authentication, and degree equivalence are separate procedures.',
        'إصدار المستندات، وتصديقها، ومعادلة الشهادات إجراءات منفصلة.',
        'Délivrance, authentification et équivalence sont des démarches distinctes.',
      ),
      L(
        'The cited MEHE office authenticates documents from licensed private higher-education institutions in Lebanon.',
        'يختص مكتب الوزارة المشار إليه في المصدر بتصديق مستندات مؤسسات التعليم العالي الخاص المرخّصة في لبنان.',
        'Le service du ministère de l’Éducation cité en source authentifie les documents des établissements privés d’enseignement supérieur agréés au Liban.',
      ),
    ],
    documents: [
      identity,
      D(
        'academic',
        L(
          'Certificate or transcript to authenticate',
          'الشهادة أو كشف العلامات للتصديق',
          'Diplôme ou relevé à authentifier',
        ),
        L(
          'Confirm originals, university seals/signatures, and copies.',
          'تحقّق من المستندات الأصلية والنسخ المطلوبة، ومن أختام الجامعة وتواقيعها اللازمة.',
          'Vérifiez les originaux et les copies à fournir, ainsi que les cachets et les signatures de l’université requis.',
        ),
      ),
      D(
        'student',
        L(
          'Student / graduate reference',
          'بيانات الطالب أو الخرّيج',
          'Référence étudiant / diplômé',
        ),
        L(
          'For issuance: institution, program, and student number.',
          'لإصدار المستند، جهّز اسم المؤسسة التعليمية والبرنامج الدراسي ورقم الطالب.',
          'Pour faire établir le document, indiquez l’établissement, le cursus et le numéro étudiant.',
        ),
      ),
      D(
        'form',
        L(
          'Procedure-specific request form',
          'استمارة الطلب الخاصة بالمعاملة',
          'Formulaire propre à la démarche',
        ),
        L(
          'Ask whether a form or representation authorization is needed.',
          'استفسر عمّا إذا كانت المعاملة تتطلّب استمارة أو تفويضاً لشخص يقدّم الطلب نيابةً عنك.',
          'Demandez si un formulaire ou mandat est nécessaire.',
        ),
      ),
      D(
        'translation',
        L(
          'Translation / prior attestations, if applicable',
          'ترجمة أو تصديقات مسبقة عند الحاجة',
          'Traduction / attestations préalables, si applicables',
        ),
        L(
          'Confirm the legalization route for foreign documents or use abroad.',
          'تحقّق من إجراءات تصديق المستندات الصادرة خارج لبنان أو المطلوب استخدامها في الخارج.',
          'Confirmez la légalisation pour les documents étrangers ou destinés à l’étranger.',
        ),
      ),
    ],
    fees: feeUnknown,
    location: L(
      'MEHE authentication: first floor of the ministry. University issuance: your registrar.',
      'لتصديق المستندات: الطابق الأول في وزارة التربية. ولإصدارها من الجامعة: مكتب التسجيل في جامعتك.',
      'Authentification : au premier étage du ministère de l’Éducation. Délivrance par l’université : auprès du service de la scolarité.',
    ),
    appointments: L(
      'Published reception 09:00–13:00; collection the next day. Confirm working days and changes at 01 772531. These hours are not bookable slots.',
      'أوقات الاستقبال المنشورة من ٠٩:٠٠ إلى ١٣:٠٠، واستلام المستندات في اليوم التالي. تحقّق من أيام العمل وأي تغييرات بالاتصال على 01 772531. هذه ساعات استقبال، وليست مواعيد للحجز.',
      'Accueil publié 09 h–13 h ; retrait le lendemain. Confirmez jours et changements au 01 772531. Ce ne sont pas des créneaux réservables.',
    ),
    sourceNote: L(
      'Office scope/hours are sourced. The page does not supply a complete current attachment list or fee schedule.',
      'توضّح المصادر اختصاص المكتب وأوقات دوامه. لكن الصفحة لا تتضمّن قائمة كاملة ومحدّثة بالمستندات المطلوبة أو جدولاً للرسوم.',
      'Périmètre et horaires sourcés. La page ne fournit pas de liste complète actuelle ni de barème.',
    ),
    sources: [mehe],
    channel: mehe,
    evidence: 'partial',
  },
  municipality: {
    title: L('Municipality services', 'خدمات البلدية', 'Services municipaux'),
    subtitle: L(
      'Local permits & municipal documents',
      'رخص ومستندات بلدية',
      'Permis et documents municipaux',
    ),
    category: L('Municipality', 'البلدية', 'Municipalité'),
    scope: L(
      'General municipal preparation; construction items apply only to building permits',
      'إرشادات عامة للتحضير للمعاملات البلدية؛ مستندات البناء تخص طلبات رخص البناء فقط',
      'Préparation municipale ; pièces de construction uniquement pour permis de construire',
    ),
    eligibility: [
      L(
        'Confirm your municipality, cadastral area, and exact procedure.',
        'تحقّق من البلدية المختصة والمنطقة العقارية ونوع المعاملة التي تريد إنجازها.',
        'Vérifiez la municipalité compétente, la zone cadastrale et la démarche exacte à effectuer.',
      ),
      L(
        'Construction requires an engineer and project-specific approvals; these are not universal municipal requirements.',
        'تتطلّب مشاريع البناء الاستعانة بمهندس والحصول على موافقات خاصة بالمشروع. لا تنطبق هذه الشروط على جميع المعاملات البلدية.',
        'Les projets de construction nécessitent un ingénieur et des autorisations propres au projet. Ces exigences ne s’appliquent pas à toutes les démarches municipales.',
      ),
    ],
    documents: [
      identity,
      D(
        'form',
        L('Municipal application form', 'استمارة المعاملة البلدية', 'Formulaire municipal'),
        L(
          'Obtain the form for your specific certificate or permit.',
          'احصل على الاستمارة الخاصة بالإفادة أو الرخصة التي تحتاجها.',
          'Obtenez le formulaire du certificat ou permis précis.',
        ),
      ),
      D(
        'property',
        L(
          'Property / representation documents, if applicable',
          'مستندات العقار أو التفويض القانوني، عند الحاجة',
          'Pièces foncières / mandat, si applicables',
        ),
        L(
          'For construction: confirm owner/co-owner signatures and legal representation.',
          'لمعاملات البناء: تحقّق من التواقيع المطلوبة من المالك والشركاء في الملكية، ومن مستندات التفويض القانوني.',
          'Construction : confirmez signatures des propriétaires et représentation légale.',
        ),
      ),
      D(
        'plans',
        L(
          'Engineer’s file and plans — construction only',
          'ملف المهندس والخرائط — للبناء فقط',
          'Dossier d’ingénieur et plans — construction uniquement',
        ),
        L(
          'DGU lists commitments, site/access plans, surveys, photos, and municipal technical conditions.',
          'تذكر المديرية العامة للتنظيم المدني التعهّدات، وخرائط الموقع وطرق الوصول إليه، وخرائط المساحة، والصور، والشروط الفنية البلدية.',
          'La DGU cite engagements, plans du site et d’accès, levés, photos et conditions municipales.',
        ),
      ),
      D(
        'planning',
        L(
          'Planning/easement certificate — construction only',
          'إفادة تخطيط وارتفاق — للبناء فقط',
          'Certificat d’urbanisme et servitudes — construction uniquement',
        ),
        L(
          'DGU specifies a certificate less than 3 months old with attachments.',
          'تحدّد المديرية العامة للتنظيم المدني إفادة لم يمضِ على إصدارها ٣ أشهر، مع مرفقاتها.',
          'La DGU prévoit un certificat de moins de 3 mois avec annexes.',
        ),
      ),
      D(
        'valuation',
        L(
          'Valuation / sector approvals — if applicable',
          'تخمين قيمة العقار أو موافقات الجهات المختصة — عند الحاجة',
          'Évaluation / autorisations sectorielles — si applicables',
        ),
        L(
          'Confirm municipal land valuation and additional approvals for the project type.',
          'تحقّق من التخمين البلدي لقيمة الأرض، ومن الموافقات الإضافية المطلوبة بحسب نوع المشروع.',
          'Confirmez l’évaluation municipale et les autorisations propres au projet.',
        ),
      ),
    ],
    fees: L(
      'Confirm current municipal/project fees. The undated DGU page is not a current price quote.',
      'استفسر عن الرسوم الحالية لدى البلدية بحسب نوع المشروع. لا يظهر تاريخ تحديث صفحة التنظيم المدني، لذلك لا يمكن اعتمادها لتحديد الرسوم الحالية.',
      'Confirmez les frais actuels. La page DGU non datée ne constitue pas un tarif actuel.',
    ),
    location: L(
      'Your responsible municipality; construction may involve DGU or municipal unions by jurisdiction.',
      'البلدية المختصة بمعاملتك. وقد تتطلّب معاملات البناء مراجعة التنظيم المدني أو اتحاد البلديات بحسب الصلاحيات.',
      'Municipalité compétente ; DGU ou unions municipales possibles selon la compétence.',
    ),
    appointments: L(
      'Contact your municipality for reception and inspections. No shared national booking calendar was verified.',
      'تواصل مع بلديتك لمعرفة أوقات استقبال المراجعين ومواعيد الكشف الميداني. لم يُتحقّق من وجود نظام موحّد لحجز المواعيد على مستوى لبنان.',
      'Contactez votre municipalité pour connaître les horaires d’accueil et organiser les inspections. L’existence d’un calendrier national commun de réservation n’a pas été vérifiée.',
    ),
    sourceNote: L(
      'DGU construction examples are not a universal checklist. The page has no clear update date; confirm locally.',
      'الأمثلة الواردة من التنظيم المدني تخص معاملات البناء، ولا تنطبق على جميع المعاملات البلدية. لا يظهر تاريخ تحديث واضح للصفحة؛ تحقّق من التفاصيل لدى بلديتك.',
      'Les exemples DGU ne forment pas une liste universelle. Mise à jour non précisée ; confirmez localement.',
    ),
    sources: [
      S(
        'https://www.dgu.gov.lb/dgup_14.html',
        L(
          'DGU — new building permit',
          'التنظيم المدني — رخصة لبناء جديد',
          'DGU — permis de construire',
        ),
      ),
    ],
    evidence: 'partial',
  },
  identity: {
    title: L('Lebanese ID card', 'بطاقة الهوية اللبنانية', 'Carte d’identité libanaise'),
    subtitle: L(
      'First card, renewal or replacement',
      'إصدار أول بطاقة أو تجديدها أو استبدالها',
      'Première demande, renouvellement ou remplacement',
    ),
    category: L('Civil status', 'الأحوال الشخصية', 'État civil'),
    scope: L(
      'Prepare an ID application with DGCS, including a child’s first card. LebFlow does not issue cards.',
      'حضّر طلب الهوية لدى الأحوال الشخصية، بما فيه أول بطاقة للطفل. لا يصدر LebFlow بطاقات.',
      'Préparer une demande DGCS, y compris la première carte d’un enfant. LebFlow ne délivre pas de cartes.',
    ),
    eligibility: [
      L(
        'A guardian can apply for a child under 15. Confirm the appropriate submission route.',
        'يمكن لولي الأمر تقديم طلب لمن دون ١٥ عامًا. تحقّق من مسار التقديم المناسب.',
        'Un représentant légal peut demander une carte pour un enfant de moins de 15 ans. Confirmez la voie de dépôt.',
      ),
    ],
    documents: [
      D(
        'photos',
        L(
          'Two recent certified photos',
          'صورتان حديثتان مصدقتان',
          'Deux photos récentes certifiées',
        ),
        L('For the mukhtar route.', 'لمسار التقديم لدى المختار.', 'Pour un dépôt chez le mokhtar.'),
      ),
      D(
        'extract',
        L(
          'ID-specific civil-status extract',
          'بيان قيد مخصص للهوية',
          'Extrait destiné à la carte d’identité',
        ),
        L(
          'Issued within six months, or a certified copy.',
          'صادر خلال ستة أشهر، أو نسخة طبق الأصل.',
          'De moins de six mois, ou copie certifiée.',
        ),
      ),
      D(
        'blood',
        L('Blood-group evidence', 'إثبات فئة الدم', 'Justificatif du groupe sanguin'),
        L(
          'Medical report or laboratory result.',
          'تقرير طبي أو فحص مخبري.',
          'Rapport médical ou résultat de laboratoire.',
        ),
      ),
      D(
        'residence',
        L(
          'Mukhtar identification certificate',
          'إفادة تعريف من المختار',
          'Attestation d’identité du mokhtar',
        ),
        L(
          'For submission at a fingerprint station.',
          'عند التقديم في محطة البصم.',
          'Pour un dépôt en station biométrique.',
        ),
      ),
      {
        ...D(
          'previous',
          L('Original ID card', 'بطاقة الهوية الأصلية', 'Carte originale'),
          L(
            'For renewal or correction.',
            'للتجديد أو التصحيح.',
            'Pour renouvellement ou correction.',
          ),
        ),
        renewalOnly: true,
      },
      D(
        'loss',
        L(
          'Loss report, if applicable',
          'محضر فقدان عند الاقتضاء',
          'Déclaration de perte, si nécessaire',
        ),
        L(
          'Lost cards follow a separate police/prosecutor procedure; confirm with DGCS.',
          'للهوية المفقودة إجراءات لدى النيابة العامة والمخفر؛ تحقّق لدى الأحوال الشخصية.',
          'La perte nécessite une démarche auprès du parquet et de la police ; confirmez auprès de la DGCS.',
        ),
      ),
    ],
    fees: feeUnknown,
    location: L(
      'Mukhtar of the registration area or civil-registry fingerprint station. Confirm child-specific arrangements.',
      'مختار منطقة القيد أو محطة البصم في قلم النفوس. تحقّق من ترتيبات الأطفال.',
      'Mokhtar du lieu d’inscription ou station biométrique du registre civil. Confirmez les modalités pour enfants.',
    ),
    appointments: L(
      'Contact the receiving office; no live booking is connected.',
      'تواصل مع الجهة المستقبلة؛ لا يوجد ربط بحجز رسمي.',
      'Contactez le bureau ; aucune réservation officielle n’est connectée.',
    ),
    renewal: L(
      'Select renewal and bring the original card with the other applicable documents. Ask the office about damaged, lost or corrected cards.',
      'اختر التجديد وأحضر البطاقة الأصلية مع المستندات المنطبقة. استفسر عن البطاقة التالفة أو المفقودة أو تصحيح البيانات.',
      'Choisissez le renouvellement et apportez la carte originale et les pièces applicables. Confirmez les démarches pour perte, détérioration ou correction.',
    ),
    sourceNote: L(
      'Reviewed 27 September 2026. The official page contains conflicting age wording and a legacy stamp amount; confirm these directly.',
      'رُوجع في ٢٧ أيلول ٢٠٢٦. تتضمن الصفحة الرسمية اختلافًا في صياغة شروط العمر وقيمة قديمة للطوابع؛ تحقّق منهما مباشرة.',
      'Consulté le 27 septembre 2026. La page comporte des indications d’âge contradictoires et un ancien montant de timbres ; confirmez-les directement.',
    ),
    sources: [
      S(
        'https://www.dgcs.gov.lb/arabic/identitycard',
        L(
          'DGCS — ID applications and tracking',
          'الأحوال الشخصية — طلب الهوية وتتبعه',
          'DGCS — demande et suivi de carte',
        ),
      ),
    ],
    channel: S(
      'https://www.dgcs.gov.lb/arabic/identitycard',
      L(
        'Official ID tracking and guidance',
        'التتبع والإرشادات الرسمية للهوية',
        'Suivi officiel et instructions',
      ),
    ),
    evidence: 'partial',
    lastReviewedAt: '2026-09-27',
  },
  civil: {
    title: L(
      'Individual civil-status extract',
      'إخراج قيد فردي',
      'Extrait individuel d’état civil',
    ),
    subtitle: L(
      'Prepare an electronic extract request',
      'حضّر طلب إخراج القيد الإلكتروني',
      'Préparer une demande d’extrait électronique',
    ),
    category: L('Civil status', 'الأحوال الشخصية', 'État civil'),
    scope: L(
      'Preparation guide for the DGCS electronic extract route. LebFlow does not issue extracts.',
      'دليل تحضيري لمسار إخراج القيد الإلكتروني لدى المديرية العامة للأحوال الشخصية. لا يصدر LebFlow إخراجات القيد.',
      'Guide de préparation à la démarche DGCS. LebFlow ne délivre aucun extrait.',
    ),
    eligibility: [
      L(
        'Confirm the applicant or representative requirements with the civil registry office.',
        'تحقّق لدى قلم النفوس من شروط تقديم الطلب شخصيًا أو بواسطة وكيل.',
        'Confirmez auprès du registre civil les conditions applicables au demandeur ou à son mandataire.',
      ),
    ],
    documents: [
      D(
        'form',
        L(
          'DGCS extract request form',
          'نموذج طلب بيان قيد',
          'Formulaire DGCS de demande d’extrait',
        ),
        L(
          'Use the form linked on the official DGCS page. Ask the office to confirm all supporting documents before visiting.',
          'استخدم النموذج المنشور في صفحة المديرية الرسمية. تحقّق من جميع المستندات المرفقة المطلوبة لدى قلم النفوس قبل الزيارة.',
          'Utilisez le formulaire de la page officielle DGCS et confirmez toutes les pièces justificatives avant votre visite.',
        ),
      ),
    ],
    fees: feeUnknown,
    renewal: L(
      'For a fresh copy, use the DGCS request form again. After the first electronic extract at the place of registration, DGCS allows subsequent copies from the place of residence. Confirm the receiving authority’s required issue date.',
      'للحصول على نسخة حديثة، استخدم نموذج طلب بيان القيد مجددًا. بعد الإصدار الإلكتروني الأول من مكان القيد، تتيح المديرية الحصول على نسخ لاحقة من مكان السكن. تحقّق من حداثة الإصدار التي تشترطها الجهة المستقبلة.',
      'Pour une nouvelle copie, utilisez de nouveau le formulaire DGCS. Après le premier extrait au lieu d’inscription, les suivants peuvent être obtenus au lieu de résidence. Confirmez l’ancienneté maximale acceptée par le destinataire.',
    ),
    location: L(
      'DGCS states that the first electronic extract is obtained at the place of registration; subsequent extracts can be obtained at the place of residence.',
      'توضح المديرية أن إخراج القيد الإلكتروني يُستحصل عليه أول مرة من مكان القيد، ثم يمكن الحصول عليه من مكان السكن.',
      'Selon la DGCS, le premier extrait électronique s’obtient au lieu d’inscription ; les suivants peuvent être obtenus au lieu de résidence.',
    ),
    appointments: L(
      'No live appointment availability is connected. Confirm office hours and processing times with the civil registry.',
      'لا يتصل الموقع بنظام مواعيد رسمي. تحقّق من أوقات الدوام ومدة الإنجاز لدى قلم النفوس.',
      'Aucune disponibilité officielle n’est connectée. Confirmez les horaires et délais auprès du registre civil.',
    ),
    sourceNote: L(
      'Official route and form link reviewed on 27 September 2026. This is a partial preparation guide; a complete document list and current fee were not verified.',
      'رُوجع المسار الرسمي ورابط النموذج في ٢٧ أيلول ٢٠٢٦. هذا دليل تحضيري جزئي؛ لم يُتحقّق من قائمة كاملة للمستندات أو الرسوم الحالية.',
      'Démarche et lien du formulaire consultés le 27 septembre 2026. Guide partiel : la liste complète des pièces et les frais actuels ne sont pas vérifiés.',
    ),
    sources: [
      S(
        'https://www.dgcs.gov.lb/arabic/ekhraj-al-kaid-electronic',
        L(
          'DGCS — electronic civil-status extract',
          'المديرية العامة للأحوال الشخصية — إخراج القيد الإلكتروني',
          'DGCS — extrait électronique d’état civil',
        ),
      ),
    ],
    evidence: 'partial',
    lastReviewedAt: '2026-09-27',
  },
  professional: {
    title: L('Professional documents', 'المستندات المهنية', 'Documents professionnels'),
    subtitle: L(
      'Practice permissions & registrations',
      'أذونات مزاولة المهنة والتسجيل المهني',
      'Autorisations d’exercice et inscriptions',
    ),
    category: L('Work & business', 'العمل ومزاولة المهن', 'Travail et activité'),
    scope: L(
      'Profession-specific preparation • engineering example',
      'متطلبات تختلف بحسب المهنة • الهندسة مثالاً',
      'Préparation selon la profession • exemple de la profession d’ingénieur',
    ),
    eligibility: [
      L(
        'Practice permission and professional membership are separate steps. Confirm the competent body.',
        'الحصول على إذن مزاولة المهنة والانتساب إلى الجهة المهنية إجراءان منفصلان. تحقّق من الجهة المختصة بكل إجراء.',
        'Autorisation d’exercice et adhésion sont distinctes. Confirmez l’organisme compétent.',
      ),
      L(
        'MEHE describes engineering submission through Public Works, or Agriculture for agricultural engineering.',
        'توضح وزارة التربية أن طلب مزاولة مهنة الهندسة يُقدّم عبر وزارة الأشغال العامة، أو عبر وزارة الزراعة للهندسة الزراعية.',
        'Le ministère de l’Éducation indique que la demande d’autorisation d’exercer la profession d’ingénieur passe par le ministère des Travaux publics, ou par le ministère de l’Agriculture pour les ingénieurs agronomes.',
      ),
    ],
    documents: [
      identity,
      D(
        'form',
        L(
          'Professional application form',
          'استمارة طلب مزاولة المهنة أو التسجيل المهني',
          'Formulaire professionnel',
        ),
        L(
          'Use the form for the exact permission or certificate.',
          'استخدم الاستمارة الخاصة بالإذن أو الإفادة التي تريد الحصول عليها.',
          'Utilisez le formulaire de l’autorisation ou certificat précis.',
        ),
      ),
      D(
        'qualification',
        L(
          'Qualifications and equivalence, if applicable',
          'الشهادات والمؤهلات ومعادلتها، عند الحاجة',
          'Diplômes et équivalence, si applicables',
        ),
        L(
          'Confirm recognition, authenticated copies, and equivalence for your profession.',
          'تحقّق من شروط الاعتراف بمؤهلاتك، ومن النسخ المصدّقة والمعادلات المطلوبة لمزاولة مهنتك.',
          'Confirmez reconnaissance, copies authentifiées et équivalence.',
        ),
      ),
      D(
        'membership',
        L(
          'Membership / registration reference',
          'بيانات الانتساب أو التسجيل المهني',
          'Référence d’adhésion / inscription',
        ),
        L(
          'Existing members: confirm registration evidence and subscription conditions.',
          'إذا كنت منتسباً بالفعل، فتحقّق من إثبات التسجيل المطلوب وشروط الاشتراك.',
          'Membres : confirmez preuve d’inscription et conditions de cotisation.',
        ),
      ),
      D(
        'practice',
        L(
          'Practice permission — where required',
          'إذن مزاولة المهنة — إذا كان مطلوباً',
          'Autorisation d’exercice — si requise',
        ),
        L(
          'For engineering registration, confirm the competent order and permission requirements.',
          'للانتساب كمهندس، تحقّق من النقابة المختصة وشروط الحصول على إذن مزاولة المهنة.',
          'Pour l’inscription comme ingénieur, vérifiez l’ordre professionnel compétent et les conditions relatives à l’autorisation d’exercice.',
        ),
      ),
    ],
    fees: feeUnknown,
    location: L(
      'The ministry or professional body for your exact permission; confirm the receiving office.',
      'الوزارة أو الجهة المهنية المختصة بالإذن المطلوب؛ تحقّق من المكتب الذي يتسلّم الطلب.',
      'Ministère ou organisme compétent pour l’autorisation ; confirmez le bureau.',
    ),
    appointments: L(
      'Committee meetings are not appointment slots. Ask the receiving office about submission and interviews.',
      'مواعيد اجتماعات اللجان ليست مواعيد متاحة للمتقدّمين. استفسر لدى المكتب المختص عن تقديم الطلبات والمقابلات.',
      'Les réunions de commission ne correspondent pas à des rendez-vous pour les demandeurs. Renseignez-vous auprès du service compétent sur le dépôt du dossier et les entretiens.',
    ),
    sourceNote: L(
      'Engineering routes are sourced; the linked ministry attachment list was inaccessible. This remains a preparation template.',
      'تستند إجراءات مزاولة مهنة الهندسة إلى المصادر المذكورة. تعذّر فتح قائمة المستندات المرفقة على موقع الوزارة؛ لذلك تبقى هذه القائمة أولية ويجب التحقّق منها.',
      'Les démarches relatives à la profession d’ingénieur sont documentées par les sources. La liste des pièces jointe sur le site du ministère était inaccessible. Cette liste reste donc un outil de préparation à confirmer.',
    ),
    sources: [
      engineering,
      S(
        'https://www.oea.org.lb/wp-content/uploads/2024/12/internal-law.pdf',
        L(
          'Beirut engineers’ order — internal rules',
          'نقابة مهندسي بيروت — النظام الداخلي',
          'Ordre des ingénieurs de Beyrouth — règlement',
        ),
      ),
    ],
    channel: engineering,
    evidence: 'partial',
  },
};

export function getGuide(id: string, locale: Locale = 'en') {
  const g = serviceContent[id];
  const localSource = (s: Source) => ({ title: s.title[locale], url: s.url });
  return {
    ...g,
    title: g.title[locale],
    subtitle: g.subtitle[locale],
    category: g.category[locale],
    scope: g.scope[locale],
    eligibility: g.eligibility.map((x) => x[locale]),
    documents: g.documents.map((d) => ({ ...d, title: d.title[locale], note: d.note[locale] })),
    fees: g.fees[locale],
    location: g.location[locale],
    appointments: g.appointments[locale],
    renewal: g.renewal?.[locale],
    sources: g.sources.map(localSource),
    source: localSource(g.sources[0]),
    sourceNote: g.sourceNote[locale],
    channel: g.channel ? localSource(g.channel) : undefined,
  };
}
