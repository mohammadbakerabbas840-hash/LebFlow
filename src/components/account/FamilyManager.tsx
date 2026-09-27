import { useCallback } from 'react';
import { L, useI18n } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { ErrorState, LoadingState } from '../common/ResourceState';
export type FamilyMember = {
  id: string;
  name: string;
  name_arabic: string;
  dob: string;
  relationship: string;
};
export function FamilyManager() {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const resource = useResource(useCallback(() => apiRequest<FamilyMember[]>('family'), []));
  const action = useAction();
  return (
    <section className="panel release-panel">
      <h2>{text('Family members', 'أفراد العائلة', 'Membres de la famille')}</h2>
      <p>
        {text(
          'Create separate applications for children or dependents. Their identity documents are not needed to add a profile.',
          'أنشئ طلبات مستقلة للأطفال أو الأشخاص الذين تتولّى رعايتهم. لا تحتاج إلى مستندات هويتهم لإضافة ملف.',
          'Créez des demandes distinctes pour vos enfants ou personnes à charge. Aucun justificatif d’identité n’est nécessaire pour ajouter un profil.',
        )}
      </p>
      {resource.loading && <LoadingState />}
      {resource.error && <ErrorState retry={resource.retry} />}
      {resource.data?.map((member) => (
        <article className="family-row" key={member.id}>
          <div>
            <strong>{locale === 'ar' ? member.name_arabic : member.name}</strong>
            <p>
              <bdi>{member.dob}</bdi>
            </p>
          </div>
          <button
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await apiRequest(`family/${member.id}`, { method: 'DELETE' });
                resource.retry();
              })
            }
          >
            {text(
              'Remove unused profile',
              'حذف الملف غير المرتبط بطلب',
              'Supprimer le profil sans dossier',
            )}
          </button>
        </article>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = Object.fromEntries(new FormData(form));
          void action.run(async () => {
            await apiRequest('family', {
              method: 'POST',
              body: JSON.stringify({ ...data, relationship: 'child', guardianConsent: true }),
            });
            form.reset();
            resource.retry();
          });
        }}
      >
        <label className="form-field">
          {text('Full name in English', 'الاسم الكامل بالإنجليزية', 'Nom complet en anglais')}
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label className="form-field">
          {text('Full name in Arabic', 'الاسم الكامل بالعربية', 'Nom complet en arabe')}
          <input name="name_arabic" dir="rtl" lang="ar" required minLength={2} maxLength={120} />
        </label>
        <label className="form-field">
          {text('Date of birth', 'تاريخ الميلاد', 'Date de naissance')}
          <input
            type="date"
            name="dob"
            required
            max={new Date().toLocaleDateString('sv-SE')}
            min="1900-01-01"
          />
        </label>
        <label className="preference-toggle">
          <input type="checkbox" required />
          {text(
            'I am authorized to manage this person’s applications.',
            'أنا مخوّل بإدارة طلبات هذا الشخص.',
            'Je suis autorisé à gérer les démarches de cette personne.',
          )}
        </label>
        <button className="primary" disabled={action.busy}>
          {text('Add family member', 'إضافة فرد من العائلة', 'Ajouter un membre')}
        </button>
      </form>
      <p role={action.failed ? 'alert' : 'status'}>{action.message}</p>
    </section>
  );
}
