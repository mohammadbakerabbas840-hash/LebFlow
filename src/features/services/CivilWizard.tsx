import { useState } from 'react';
import { L, useI18n } from '../../i18n';
import type { RequestKind } from '../../data/serviceGuides';
export function CivilWizard({
  serviceId,
  onGenerate,
}: {
  serviceId: string;
  onGenerate: (excluded: string[], kind?: RequestKind) => void;
}) {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const [route, setRoute] = useState('first');
  const [age, setAge] = useState('adult');
  const [office, setOffice] = useState('unsure');
  const id = serviceId === 'identity';
  return (
    <section className="passport-wizard">
      <h3>{text('Personalize your request', 'تخصيص الطلب', 'Personnaliser la demande')}</h3>
      <div className="wizard-questions">
        <label>
          {text(
            'What do you need?',
            'ما الذي تحتاج إليه؟',
            'Quelle démarche souhaitez-vous effectuer ?',
          )}
          <select value={route} onChange={(e) => setRoute(e.target.value)}>
            <option value="first">
              {text('First issue', 'إصدار للمرة الأولى', 'Première délivrance')}
            </option>
            <option value="renewal">
              {text('Renewal / new copy', 'تجديد / نسخة جديدة', 'Renouvellement / nouvelle copie')}
            </option>
            {id && (
              <>
                <option value="lost">{text('Lost card', 'بطاقة مفقودة', 'Carte perdue')}</option>
                <option value="damaged">
                  {text('Damaged card', 'بطاقة تالفة', 'Carte détériorée')}
                </option>
              </>
            )}
          </select>
        </label>
        <label>
          {text('Applicant’s age group', 'الفئة العمرية لصاحب الطلب', 'Tranche d’âge du demandeur')}
          <select value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="adult">{text('Adult', 'بالغ', 'Adulte')}</option>
            <option value="child">
              {text('Child / newborn', 'طفل / مولود جديد', 'Enfant / nouveau-né')}
            </option>
          </select>
        </label>
        {id && (
          <label>
            {text(
              'Submission route confirmed by the office',
              'مسار التقديم المؤكّد من المكتب',
              'Voie de dépôt confirmée par le bureau',
            )}
            <select value={office} onChange={(e) => setOffice(e.target.value)}>
              <option value="unsure">
                {text('Not confirmed yet', 'لم يتم التأكيد بعد', 'Pas encore confirmé')}
              </option>
              <option value="mukhtar">{text('Mukhtar', 'المختار', 'Mokhtar')}</option>
              <option value="station">
                {text('Fingerprint station', 'محطة البصم', 'Station biométrique')}
              </option>
            </select>
          </label>
        )}
      </div>
      {age === 'child' && (
        <p className="info-note">
          {text(
            'A parent or legal guardian can prepare the request. For a newborn, first confirm that the birth is registered and ask the registry about representation and attendance. An account does not require the child’s ID.',
            'يمكن لأحد الوالدين أو للولي الشرعي تحضير الطلب. للمولود الجديد، تحقّق أولًا من تسجيل الولادة واستفسر لدى قلم النفوس عن التمثيل والحضور. لا يتطلّب الحساب هوية الطفل.',
            'Un parent ou représentant légal peut préparer la demande. Pour un nouveau-né, vérifiez d’abord l’enregistrement de la naissance et les règles de représentation et de présence. Le compte ne nécessite pas la carte de l’enfant.',
          )}
        </p>
      )}
      {id && ['lost', 'damaged'].includes(route) && (
        <p className="info-note">
          {text(
            'This replacement route needs direct DGCS guidance. A lost card may require police/prosecutor formalities. This checklist is preliminary.',
            'يتطلّب مسار الاستبدال إرشادات مباشرة من الأحوال الشخصية. قد تتطلّب البطاقة المفقودة إجراءات لدى المخفر والنيابة العامة. هذه القائمة أولية.',
            'Cette procédure de remplacement doit être confirmée auprès de la DGCS. Une perte peut nécessiter des formalités auprès de la police et du parquet. Cette liste est préliminaire.',
          )}
        </p>
      )}
      {!id && (
        <p>
          {route === 'first'
            ? text(
                'For a first electronic extract, consult the registry of your place of registration.',
                'لإخراج القيد الإلكتروني الأول، راجع قلم نفوس مكان القيد.',
                'Pour le premier extrait électronique, consultez le registre de votre lieu d’inscription.',
              )
            : text(
                'After the first electronic issue, ask the registry at your place of residence about a new copy.',
                'بعد الإصدار الإلكتروني الأول، استفسر لدى قلم نفوس مكان الإقامة عن نسخة جديدة.',
                'Après une première délivrance électronique, renseignez-vous au registre de votre lieu de résidence pour une nouvelle copie.',
              )}
        </p>
      )}
      <button
        className="primary"
        onClick={() =>
          onGenerate(
            id
              ? [
                  ...(route !== 'lost' ? ['loss'] : []),
                  ...(office === 'mukhtar' ? ['residence'] : []),
                ]
              : [],
            route === 'renewal' || route === 'damaged' ? 'renewal' : 'application',
          )
        }
      >
        {text('Generate checklist', 'إنشاء قائمة المستندات', 'Créer ma liste')}
      </button>
    </section>
  );
}
