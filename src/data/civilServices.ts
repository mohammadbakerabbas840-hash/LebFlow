import { L } from '../i18n';
import type { Content } from './serviceContent';
const source = {
  url: 'https://www.dgcs.gov.lb/arabic/applicationmechanisms/mechanism4',
  title: L(
    'DGCS — civil-registry procedures',
    'الأحوال الشخصية — معاملات أقلام النفوس',
    'DGCS — démarches auprès du registre civil',
  ),
};
const base = {
  lastReviewedAt: '2026-09-27',
  category: L('Civil status', 'الأحوال الشخصية', 'État civil'),
  location: L(
    'The competent civil registry; confirm the office for your place of registration.',
    'قلم النفوس المختص؛ تحقّق من المكتب المعني بمكان القيد.',
    'Le registre civil compétent ; confirmez le bureau de votre lieu d’inscription.',
  ),
  appointments: L(
    'Contact the registry before visiting. LebFlow has no live government booking connection.',
    'تواصل مع قلم النفوس قبل الزيارة. لا يرتبط LebFlow بنظام حجز حكومي مباشر.',
    'Contactez le registre avant votre visite. LebFlow n’est pas relié à un système public de réservation.',
  ),
  sourceNote: L(
    'Official page reviewed on 27 September 2026; it has no clear update date. Confirm the route, fees and timing before submission.',
    'رُوجعت الصفحة الرسمية في ٢٧ أيلول ٢٠٢٦ ولا يظهر تاريخ تحديث واضح. أكّد الإجراءات والرسوم والمدة قبل التقديم.',
    'Page officielle consultée le 27 septembre 2026, sans date de mise à jour explicite. Confirmez la procédure, les frais et les délais avant le dépôt.',
  ),
  sources: [source],
  evidence: 'partial' as const,
};
export const civilServices: Record<string, Content> = {
  birth: {
    ...base,
    title: L('Birth registration', 'تسجيل ولادة', 'Enregistrement d’une naissance'),
    subtitle: L(
      'Prepare a newborn’s civil registration',
      'تحضير معاملة تسجيل مولود جديد',
      'Préparer l’inscription d’un nouveau-né',
    ),
    scope: L(
      'Birth registration in Lebanon; late or overseas registration needs separate guidance.',
      'تسجيل الولادة في لبنان؛ يتطلّب التسجيل المتأخّر أو في الخارج إرشادات خاصة.',
      'Enregistrement au Liban ; les naissances à l’étranger ou déclarations tardives nécessitent des instructions spécifiques.',
    ),
    eligibility: [
      L(
        'Parents or legal representatives should confirm the child’s registration route.',
        'على الوالدين أو الممثل القانوني تأكيد مسار تسجيل الطفل.',
        'Les parents ou représentants légaux doivent confirmer la procédure applicable.',
      ),
    ],
    documents: [
      {
        id: 'birth-document',
        title: L(
          'Completed and duly signed birth document',
          'وثيقة ولادة منظّمة وموقّعة وفق الأصول',
          'Document de naissance dûment établi et signé',
        ),
        note: L(
          'Ask the registry which signatures and supporting records apply.',
          'استفسر لدى قلم النفوس عن التواقيع والمستندات الداعمة اللازمة.',
          'Demandez au registre les signatures et justificatifs nécessaires.',
        ),
      },
    ],
    fees: L(
      'The page lists LBP 400,000 within one month, an additional LBP 1,000,000 after one month, plus a mukhtar stamp. Confirm current applicability.',
      'تذكر الصفحة ٤٠٠٬٠٠٠ ل.ل. خلال شهر، مع إضافة ١٬٠٠٠٬٠٠٠ ل.ل. بعد الشهر، وطابع المختار. أكّد انطباق الرسوم حاليًا.',
      'La page indique 400 000 LBP dans le mois, puis 1 000 000 LBP supplémentaires au-delà, plus le timbre du mokhtar. Confirmez leur application actuelle.',
    ),
    sourceNote: L(
      'DGCS directs families to civil courts when registration is over one year late. The published ordinary processing estimate is 1–2 days; it is not a guarantee. Confirm your situation.',
      'توجّه الأحوال الشخصية الأهل إلى القضاء المدني إذا تجاوزت الولادة سنة دون تسجيل. المدة المنشورة للمعاملة العادية يوم إلى يومين، وهي غير مضمونة. تحقّق من وضعك.',
      'La DGCS renvoie les familles aux tribunaux civils après plus d’un an sans enregistrement. Le délai indicatif ordinaire publié est de 1 à 2 jours, sans garantie. Faites confirmer votre situation.',
    ),
  },
  family: {
    ...base,
    title: L('Family civil-status extract', 'إخراج قيد عائلي', 'Extrait familial d’état civil'),
    subtitle: L(
      'Request a family registry extract',
      'طلب بيان قيد عائلي',
      'Demander un extrait du registre familial',
    ),
    scope: L(
      'Prepare a family extract request through the registry or an available LibanPost channel.',
      'حضّر طلب إخراج قيد عائلي عبر قلم النفوس أو قناة ليبان بوست المتاحة.',
      'Préparez une demande auprès du registre civil ou d’un guichet LibanPost disponible.',
    ),
    eligibility: [
      L(
        'Confirm entitlement and representation with the receiving registry.',
        'تحقّق من حق الحصول على البيان وشروط التمثيل لدى قلم النفوس.',
        'Vérifiez votre droit à l’extrait et les règles de représentation auprès du registre.',
      ),
    ],
    documents: [
      {
        id: 'mukhtar-request',
        title: L(
          'Mukhtar-certified extract request',
          'طلب بيان قيد مصدّق من المختار',
          'Demande d’extrait certifiée par le mokhtar',
        ),
        note: L(
          'Registry route: mukhtar of the registration area. LibanPost route: residence or registration area; confirm availability.',
          'عبر قلم النفوس: مختار مكان القيد. عبر ليبان بوست: مختار مكان السكن أو القيد؛ أكّد توفّر الخدمة.',
          'Au registre : mokhtar du lieu d’inscription. Par LibanPost : lieu de résidence ou d’inscription ; confirmez la disponibilité.',
        ),
      },
    ],
    fees: L(
      'Registry route: published stamps of LBP 100,000 on the request and LBP 400,000 on the extract, plus a mukhtar stamp. Confirm delivery charges separately.',
      'عبر قلم النفوس: طابع منشور بقيمة ١٠٠٬٠٠٠ ل.ل. على الطلب و٤٠٠٬٠٠٠ ل.ل. على البيان، إضافةً إلى طابع المختار. أكّد رسوم التوصيل بشكل منفصل.',
      'Au registre : timbres publiés de 100 000 LBP sur la demande et 400 000 LBP sur l’extrait, plus le timbre du mokhtar. Confirmez séparément les frais de livraison.',
    ),
  },
  marriage: {
    ...base,
    title: L('Marriage certificate copy', 'نسخة عن وثيقة زواج', 'Copie d’un acte de mariage'),
    subtitle: L(
      'Obtain a copy of an already registered marriage',
      'الحصول على نسخة عن زواج مسجّل',
      'Obtenir une copie d’un mariage déjà enregistré',
    ),
    scope: L(
      'A copy of a registered record. Registering a new marriage is a separate procedure.',
      'نسخة عن وثيقة منفّذة في السجل. تسجيل زواج جديد معاملة مستقلة.',
      'Copie d’un acte déjà inscrit au registre. L’enregistrement initial d’un mariage est une démarche distincte.',
    ),
    eligibility: [
      L(
        'The applicant concerned requests the copy from the competent registry.',
        'يطلب صاحب العلاقة النسخة من قلم النفوس المختص.',
        'La personne concernée demande la copie au registre compétent.',
      ),
    ],
    documents: [
      {
        id: 'certified-request',
        title: L(
          'Request certified by the registration-area mukhtar',
          'طلب مصدّق من مختار منطقة القيد',
          'Demande certifiée par le mokhtar du lieu d’inscription',
        ),
        note: L(
          'Include the place and number of registration.',
          'اذكر محل القيد ورقمه.',
          'Indiquez le lieu et le numéro d’inscription.',
        ),
      },
    ],
    fees: L(
      'Current fee unverified: the official page shows legacy stamp amounts. Confirm before payment.',
      'الرسوم الحالية غير مؤكّدة: تعرض الصفحة الرسمية قيمًا قديمة للطوابع. تحقّق قبل الدفع.',
      'Frais actuels non vérifiés : la page affiche d’anciens montants de timbres. Confirmez avant paiement.',
    ),
  },
};
