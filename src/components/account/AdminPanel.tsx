import { useCallback, useState } from 'react';
import { L, useI18n, type Localized } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { ErrorState, LoadingState } from '../common/ResourceState';
import type { serviceContent } from '../../data/serviceContent';
type Content = (typeof serviceContent)[string];
type AdminData = {
  services: { id: string; version: number; content: Content }[];
  revisions: {
    id: number;
    service_id: string;
    status: string;
    reason: string;
    content: Content;
    previous_content: Content;
  }[];
  feedback: { id: number; category: string; comment: string | null; status: string }[];
  documents: { id: string; kind: string; scan_status: string; malware_clear: boolean }[];
};
export function AdminPanel() {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const resource = useResource(useCallback(() => apiRequest<AdminData>('admin'), []));
  const action = useAction();
  const [editing, setEditing] = useState<AdminData['services'][number] | null>(null);
  const fields = [
    'title',
    'subtitle',
    'category',
    'scope',
    'fees',
    'location',
    'appointments',
    'sourceNote',
  ] as const;
  const labels = {
    title: L('Title', 'العنوان', 'Titre'),
    subtitle: L('Subtitle', 'العنوان الفرعي', 'Sous-titre'),
    category: L('Category', 'الفئة', 'Catégorie'),
    scope: L('Scope', 'نطاق الخدمة', 'Champ d’application'),
    fees: L('Fees', 'الرسوم', 'Frais'),
    location: L('Where to apply', 'مكان تقديم الطلب', 'Lieu de dépôt'),
    appointments: L('Appointments', 'المواعيد', 'Rendez-vous'),
    sourceNote: L('Source notes', 'ملاحظات المصادر', 'Notes sur les sources'),
  };
  function localized(value: Localized, onChange: (next: Localized) => void) {
    return (['en', 'ar', 'fr'] as const).map((lang) => (
      <label key={lang} className="form-field">
        {lang.toUpperCase()}
        <textarea
          lang={lang}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          required
          maxLength={6000}
          rows={3}
          value={value[lang]}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        />
      </label>
    ));
  }
  return (
    <details className="admin-panel">
      <summary>{text('Administration', 'الإدارة', 'Administration')}</summary>
      <p>
        {text(
          'A second administrator must review and publish each draft. Both accounts require two-factor authentication.',
          'يجب أن يراجع مسؤول ثانٍ كل مسودة وينشرها. تتطلّب الحسابات الإدارية المصادقة الثنائية.',
          'Un second administrateur doit vérifier et publier chaque brouillon. Les deux comptes doivent utiliser l’authentification à deux facteurs.',
        )}
      </p>
      {resource.loading && <LoadingState />}
      {resource.error && <ErrorState retry={resource.retry} />}
      {resource.data && (
        <>
          <div className="action-row">
            {resource.data.services.map((s) => (
              <button key={s.id} onClick={() => setEditing(structuredClone(s))}>
                {s.content.title[locale]}
              </button>
            ))}
          </div>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const reason = new FormData(e.currentTarget).get('reason');
                void action.run(async () => {
                  await apiRequest(`admin/services/${editing.id}/drafts`, {
                    method: 'POST',
                    body: JSON.stringify({
                      content: editing.content,
                      version: editing.version,
                      reason,
                    }),
                  });
                  setEditing(null);
                  resource.retry();
                });
              }}
            >
              <h3>{editing.content.title[locale]}</h3>
              {fields.map((field) => (
                <fieldset key={field}>
                  <legend>{labels[field][locale]}</legend>
                  {localized(editing.content[field], (next) =>
                    setEditing({ ...editing, content: { ...editing.content, [field]: next } }),
                  )}
                </fieldset>
              ))}
              {editing.content.documents.map((doc, index) => (
                <fieldset key={doc.id}>
                  <legend>{doc.title[locale]}</legend>
                  {localized(doc.title, (next) =>
                    setEditing({
                      ...editing,
                      content: {
                        ...editing.content,
                        documents: editing.content.documents.map((d, i) =>
                          i === index ? { ...d, title: next } : d,
                        ),
                      },
                    }),
                  )}
                  {localized(doc.note, (next) =>
                    setEditing({
                      ...editing,
                      content: {
                        ...editing.content,
                        documents: editing.content.documents.map((d, i) =>
                          i === index ? { ...d, note: next } : d,
                        ),
                      },
                    }),
                  )}
                </fieldset>
              ))}
              {editing.content.eligibility.map((item, index) => (
                <fieldset key={index}>
                  <legend>{text('Eligibility', 'شروط الأهلية', 'Conditions d’éligibilité')}</legend>
                  {localized(item, (next) =>
                    setEditing({
                      ...editing,
                      content: {
                        ...editing.content,
                        eligibility: editing.content.eligibility.map((d, i) =>
                          i === index ? next : d,
                        ),
                      },
                    }),
                  )}
                </fieldset>
              ))}
              {editing.content.sources.map((source, index) => (
                <label className="form-field" key={index}>
                  {source.title[locale]}
                  <input
                    type="url"
                    required
                    value={source.url}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        content: {
                          ...editing.content,
                          sources: editing.content.sources.map((s, i) =>
                            i === index ? { ...s, url: e.target.value } : s,
                          ),
                        },
                      })
                    }
                  />
                </label>
              ))}
              <label className="form-field">
                {text(
                  'Reason and verification notes',
                  'سبب التعديل وملاحظات التحقّق',
                  'Motif et notes de vérification',
                )}
                <textarea name="reason" required minLength={10} maxLength={1000} />
              </label>
              <button className="primary" disabled={action.busy}>
                {text(
                  'Save draft for review',
                  'حفظ المسودة للمراجعة',
                  'Enregistrer le brouillon à vérifier',
                )}
              </button>
              <button type="button" onClick={() => setEditing(null)}>
                {text('Cancel', 'إلغاء', 'Annuler')}
              </button>
            </form>
          )}
          <h3>{text('Revision history', 'سجل التعديلات', 'Historique des révisions')}</h3>
          {resource.data.revisions.map((r) => (
            <details key={r.id}>
              <summary>
                {r.content.title[locale]} · {r.status} · #{r.id}
              </summary>
              <p>{r.reason}</p>
              <div className="revision-compare">
                {[r.previous_content, r.content].map((content, i) => (
                  <div key={i}>
                    <h4>
                      {i
                        ? text('Proposed version', 'النسخة المقترحة', 'Version proposée')
                        : text('Previous version', 'النسخة السابقة', 'Version précédente')}
                    </h4>
                    {fields.map((f) => (
                      <p key={f}>
                        <strong>{labels[f][locale]}: </strong>
                        {content[f][locale]}
                      </p>
                    ))}
                    {content.documents.map((d) => (
                      <p key={d.id}>
                        {d.title[locale]}: {d.note[locale]}
                      </p>
                    ))}
                    {content.eligibility.map((item, i) => (
                      <p key={i}>{item[locale]}</p>
                    ))}
                    {content.sources.map((s) => (
                      <p key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title[locale]}
                        </a>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              {r.status === 'draft' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action.run(async () => {
                      await apiRequest(`admin/revisions/${r.id}/publish`, {
                        method: 'POST',
                        body: JSON.stringify({ reviewed: true }),
                      });
                      resource.retry();
                    });
                  }}
                >
                  <label className="preference-toggle">
                    <input type="checkbox" required />
                    {text(
                      'I checked the official sources and all three translations.',
                      'راجعت المصادر الرسمية والترجمات الثلاث.',
                      'J’ai vérifié les sources officielles et les trois traductions.',
                    )}
                  </label>
                  <button disabled={action.busy}>
                    {text(
                      'Publish reviewed revision',
                      'نشر التعديل بعد المراجعة',
                      'Publier la révision vérifiée',
                    )}
                  </button>
                </form>
              )}
            </details>
          ))}
          <h3>{text('Document reviews', 'مراجعة المستندات', 'Révision des documents')}</h3>
          {resource.data.documents.map((d) => (
            <form
              key={d.id}
              onSubmit={(e) => {
                e.preventDefault();
                const body = JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)));
                void action.run(async () => {
                  await apiRequest(`admin/documents/${d.id}`, { method: 'PATCH', body });
                  resource.retry();
                });
              }}
            >
              <p>
                {d.kind} · {d.scan_status}
              </p>
              {d.malware_clear && d.scan_status !== 'rejected' && (
                <a href={`/api/v1/admin/documents/${d.id}`} download>
                  {text('Download for review', 'تنزيل للمراجعة', 'Télécharger pour vérification')}
                </a>
              )}
              <label className="form-field">
                {text('Review result', 'نتيجة المراجعة', 'Résultat de la vérification')}
                <select name="status">
                  <option value="reviewed">
                    {text(
                      'Reviewed; authenticity not certified',
                      'تمت المراجعة؛ الأصالة غير مثبتة',
                      'Vérifié ; authenticité non certifiée',
                    )}
                  </option>
                  <option value="needs_replacement">
                    {text('Replacement needed', 'يلزم استبدال المستند', 'Remplacement nécessaire')}
                  </option>
                </select>
              </label>
              <label className="form-field">
                {text(
                  'Reason shown to the user',
                  'السبب الذي سيُعرض للمستخدم',
                  'Motif communiqué à l’utilisateur',
                )}
                <input name="reason" required minLength={5} maxLength={200} />
              </label>
              <button disabled={action.busy || !d.malware_clear || d.scan_status === 'rejected'}>
                {text('Record review', 'تسجيل المراجعة', 'Enregistrer la vérification')}
              </button>
            </form>
          ))}
          <h3>{text('Assistant feedback', 'ملاحظات المساعد', 'Retours sur l’assistant')}</h3>
          {resource.data.feedback.map((f) => (
            <article key={f.id}>
              <p>
                {f.category}: {f.comment}
              </p>
              {f.status === 'open' && (
                <button
                  disabled={action.busy}
                  onClick={() =>
                    action.run(async () => {
                      await apiRequest(`admin/feedback/${f.id}`, { method: 'PATCH' });
                      resource.retry();
                    })
                  }
                >
                  {text('Mark reviewed', 'تحديد كملاحظة تمت مراجعتها', 'Marquer comme vérifié')}
                </button>
              )}
            </article>
          ))}
        </>
      )}
      <p role={action.failed ? 'alert' : 'status'}>{action.message}</p>
    </details>
  );
}
