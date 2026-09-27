import { L, useI18n } from '../../i18n';
import { apiRequest, type ServerUser } from '../../services/backend';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAction } from '../../hooks/useAction';
export function DocumentUpload() {
  const { user, acceptUser } = useAuth();
  const { locale, t } = useI18n();
  const action = useAction();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  return (
    <section className="panel release-panel">
      <h2>
        {text(
          'Manage optional identity documents',
          'إدارة مستندات الهوية الاختيارية',
          'Gérer les justificatifs facultatifs',
        )}
      </h2>
      <p>
        {text(
          'Only upload the account holder’s documents here. Replacing a file starts a new safety scan. Maximum 5 MB per file.',
          'ارفع هنا مستندات صاحب الحساب فقط. يبدأ فحص أمان جديد عند استبدال الملف. الحد الأقصى ٥ ميغابايت للملف.',
          'Déposez uniquement les documents du titulaire du compte. Tout remplacement déclenche une nouvelle analyse. Maximum 5 Mo par fichier.',
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = new FormData(form);
          void action.run(async () => {
            acceptUser(
              await apiRequest<ServerUser>('identity-documents', { method: 'POST', body }),
            );
            form.reset();
          });
        }}
      >
        <label className="form-field">
          {t('identityDocuments')}
          <select name="kind">
            <option value="idPhoto">{t('idPhoto')}</option>
            <option value="extract">{t('extract')}</option>
          </select>
        </label>
        <label className="form-field">
          {text('Upload or replace', 'رفع مستند أو استبداله', 'Déposer ou remplacer')}
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
          />
        </label>
        <button className="primary" disabled={action.busy}>
          {text('Save document', 'حفظ المستند', 'Enregistrer le document')}
        </button>
      </form>
      {user?.documents.map((d) => (
        <article key={d.id}>
          <p>
            {t(d.kind === 'idPhoto' ? 'idPhoto' : 'extract')}
            {d.reviewReason ? `: ${d.reviewReason}` : ''}
          </p>
          <button
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await apiRequest(`identity-documents/${d.id}`, { method: 'DELETE' });
                acceptUser(await apiRequest<ServerUser>('me'));
              })
            }
          >
            {text('Delete private file', 'حذف الملف الخاص', 'Supprimer le fichier privé')}
          </button>
        </article>
      ))}
      <p role={action.failed ? 'alert' : 'status'}>{action.message}</p>
    </section>
  );
}
