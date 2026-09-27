import { L, useI18n } from '../../i18n';
import { getGuide } from '../../data/serviceGuides';
import {
  passportRequirements,
  validPassportAnswers,
  type PassportAnswers,
} from './passportRequirements';
import './passport-wizard.css';

const copy = {
  title: L(
    'Personalize your passport checklist',
    'خصّص قائمة مستندات جواز سفرك',
    'Personnalisez votre liste de pièces pour le passeport',
  ),
  intro: L(
    'Answer three questions to identify relevant preparation steps. This guide does not determine official eligibility.',
    'أجب عن ثلاثة أسئلة لمعرفة خطوات التحضير التي تناسب حالتك. تبقى الجهة المختصة مسؤولة عن تحديد استيفائك لشروط التقديم.',
    'Répondez à trois questions pour adapter la préparation de votre dossier. Ce guide ne détermine pas votre éligibilité officielle.',
  ),
  route: L(
    'What are you applying for?',
    'ما نوع معاملة جواز السفر؟',
    'Quelle démarche souhaitez-vous effectuer ?',
  ),
  application: L('First passport', 'جواز سفر للمرة الأولى', 'Premier passeport'),
  renewal: L('Passport renewal', 'تجديد جواز سفر', 'Renouvellement du passeport'),
  lost: L('Lost passport', 'جواز سفر مفقود', 'Passeport perdu'),
  damaged: L('Damaged passport', 'جواز سفر تالف', 'Passeport endommagé'),
  age: L('Applicant’s age group', 'الفئة العمرية لصاحب الطلب', 'Tranche d’âge du demandeur'),
  adult: L('18 or older', '١٨ سنة أو أكثر', '18 ans ou plus'),
  minor: L('Under 18', 'أقل من ١٨ سنة', 'Moins de 18 ans'),
  previous: L(
    'Do you have your previous passport?',
    'هل جواز سفرك السابق بحوزتك؟',
    'Avez-vous votre ancien passeport en votre possession ?',
  ),
  yes: L('Yes', 'نعم', 'Oui'),
  no: L('No', 'لا', 'Non'),
  choose: L('Choose an answer', 'اختر إجابة', 'Sélectionnez une réponse'),
  result: L(
    'Your preparation guidance',
    'إرشادات التحضير لحالتك',
    'Conseils pour préparer votre dossier',
  ),
  incomplete: L(
    'Answer all three questions to personalize the checklist or close the wizard to use the general guide.',
    'أجب عن الأسئلة الثلاثة لتخصيص القائمة، أو عُد إلى الدليل العام.',
    'Répondez aux trois questions pour adapter la liste ou fermez le questionnaire pour utiliser le guide général.',
  ),
  adultNote: L(
    'The parental consent / guardianship item is excluded for an adult applicant. Review the remaining documents below.',
    'إذا كان عمرك ١٨ سنة أو أكثر، يُستبعد مستند موافقة الوالدين أو الوصاية من قائمتك. راجع المستندات المتبقية أدناه.',
    'La pièce relative au consentement parental ou à la tutelle est exclue pour un demandeur majeur. Consultez les autres pièces ci-dessous.',
  ),
  minorNote: L(
    'Keep parental consent / guardianship in your checklist. Confirm who must sign and the recent civil-status extract with General Security.',
    'أبقِ موافقة الوالدين أو الوصاية ضمن القائمة. تحقّق لدى الأمن العام ممّن يجب أن يوقّع ومن شروط إخراج القيد الحديث.',
    'Conservez le consentement parental ou la tutelle dans votre liste. Vérifiez auprès de la Sûreté générale les signataires requis et les conditions relatives à l’extrait récent d’état civil.',
  ),
  authority: L(
    'This situation needs separate General Security guidance. The routine checklist is not sufficient to create a personalized request. Confirm the replacement procedure and additional documents directly.',
    'تحتاج حالتك إلى إرشادات خاصة من الأمن العام. القائمة العامة لا تكفي لإنشاء طلب مخصّص لهذه الحالة. استفسر مباشرة عن إجراءات استبدال جواز السفر والمستندات الإضافية المطلوبة.',
    'Cette situation nécessite des instructions spécifiques de la Sûreté générale. La liste habituelle ne suffit pas pour créer un dossier personnalisé. Vérifiez directement la procédure de remplacement et les pièces supplémentaires.',
  ),
  identity: L(
    'ID and civil-status extract alternatives depend on the official identity table. This wizard does not remove them or choose an alternative for you.',
    'يحدّد الجدول الرسمي لإثبات الهوية متى تُطلب بطاقة الهوية أو إخراج القيد. تبقى هذه المستندات ضمن القائمة، وعليك مراجعة الجدول لمعرفة ما ينطبق على حالتك.',
    'Les possibilités concernant la carte d’identité et l’extrait d’état civil dépendent du tableau officiel des justificatifs. Ce questionnaire ne les supprime pas et ne choisit pas une option à votre place.',
  ),
  previousNote: L(
    'For a first passport, bring a previous passport only if one exists. Its absence alone does not establish eligibility.',
    'أحضر جواز سفر سابقاً فقط إن وُجد. عدم وجود جواز سابق لا يعني وحده أنك تستوفي شروط إصدار جواز جديد.',
    'Pour une première demande, apportez un ancien passeport uniquement si vous en avez un. Son absence ne suffit pas à établir votre éligibilité.',
  ),
  saved: L(
    'Checklist personalized from your answers',
    'قائمة مخصّصة بحسب إجاباتك',
    'Liste adaptée à vos réponses',
  ),
  close: L('Use the general guide instead', 'العودة إلى الدليل العام', 'Revenir au guide général'),
  scope: L(
    'For Lebanese citizens applying in Lebanon. Requirements may change; verify with General Security before visiting.',
    'للمواطنين اللبنانيين المتقدّمين داخل لبنان. قد تتغيّر المتطلبات؛ تحقّق منها لدى الأمن العام قبل الزيارة.',
    'Pour les citoyens libanais qui déposent leur demande au Liban. Les exigences peuvent changer : vérifiez-les auprès de la Sûreté générale avant de vous déplacer.',
  ),
};
export type PassportDraft = Partial<PassportAnswers>;
type Props = {
  answers: PassportDraft;
  onChange: (answers: PassportDraft) => void;
  onClose: () => void;
  saved?: boolean;
};

export function PassportWizard({ answers, onChange, onClose, saved = false }: Props) {
  const { locale, t } = useI18n();
  const text = (key: keyof typeof copy) => copy[key][locale];
  const result = validPassportAnswers(answers) ? passportRequirements(answers) : null;
  const guide = getGuide('passport', locale);
  return (
    <section className="passport-wizard" aria-labelledby="wizard-title">
      <h3 id="wizard-title">{text(saved ? 'saved' : 'title')}</h3>
      <p>{text('intro')}</p>
      <div className="wizard-questions">
        <label>
          {text('route')}
          <select
            aria-label={text('route')}
            disabled={saved}
            value={answers.route ?? ''}
            onChange={(e) =>
              onChange({ ...answers, route: e.target.value as PassportAnswers['route'] })
            }
          >
            <option value="" disabled>
              {text('choose')}
            </option>
            {(['application', 'renewal', 'lost', 'damaged'] as const).map((value) => (
              <option key={value} value={value}>
                {text(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {text('age')}
          <select
            aria-label={text('age')}
            disabled={saved}
            value={answers.ageBand ?? ''}
            onChange={(e) =>
              onChange({ ...answers, ageBand: e.target.value as PassportAnswers['ageBand'] })
            }
          >
            <option value="" disabled>
              {text('choose')}
            </option>
            {(['adult', 'minor'] as const).map((value) => (
              <option key={value} value={value}>
                {text(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {text('previous')}
          <select
            aria-label={text('previous')}
            disabled={saved}
            value={answers.hasPrevious ?? ''}
            onChange={(e) =>
              onChange({
                ...answers,
                hasPrevious: e.target.value as PassportAnswers['hasPrevious'],
              })
            }
          >
            <option value="" disabled>
              {text('choose')}
            </option>
            {(['yes', 'no'] as const).map((value) => (
              <option key={value} value={value}>
                {text(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="wizard-result" aria-live="polite">
        <strong>{text('result')}</strong>
        {!result ? (
          <p>{text('incomplete')}</p>
        ) : result.needsAuthority ? (
          <p>{text('authority')}</p>
        ) : (
          <>
            <p>{text(answers.ageBand === 'adult' ? 'adultNote' : 'minorNote')}</p>
            {answers.route === 'application' && answers.hasPrevious === 'no' && (
              <p>{text('previousNote')}</p>
            )}
            <p>{text('identity')}</p>
          </>
        )}
      </div>
      <p>{text('scope')}</p>
      <p className="wizard-source">
        {t('reviewed')} ·{' '}
        <a href={guide.source.url} target="_blank" rel="noreferrer">
          {guide.source.title}
        </a>
      </p>
      {!saved && (
        <button className="document-applicability" type="button" onClick={onClose}>
          {text('close')}
        </button>
      )}
    </section>
  );
}

export function WizardStart({ onClick }: { onClick: () => void }) {
  const { locale } = useI18n();
  return (
    <button className="wizard-start" type="button" onClick={onClick}>
      {copy.title[locale]} <span aria-hidden="true">→</span>
    </button>
  );
}
