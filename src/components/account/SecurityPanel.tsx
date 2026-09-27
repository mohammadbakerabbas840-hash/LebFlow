import { useCallback, useState } from 'react';
import { L, useI18n } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { ErrorState, LoadingState } from '../common/ResourceState';
import { AdminPanel } from './AdminPanel';
type Security = {
  verified: boolean;
  mfaEnabled: boolean;
  emailReminders: boolean;
  isAdmin: boolean;
  sessions: { id: string; agent: string; last_seen_at: string; current: boolean }[];
};
export function SecurityPanel() {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const resource = useResource(useCallback(() => apiRequest<Security>('security'), []));
  const action = useAction();
  const [secret, setSecret] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const data = resource.data;
  return (
    <section className="panel release-panel">
      <h2>{text('Account security', 'أمان الحساب', 'Sécurité du compte')}</h2>
      {resource.loading && <LoadingState />}
      {resource.error && <ErrorState retry={resource.retry} />}
      {data && (
        <>
          <p>
            {data.verified
              ? text('Email verified', 'تم تأكيد البريد الإلكتروني', 'Adresse e-mail vérifiée')
              : text(
                  'Email not yet verified',
                  'لم يتم تأكيد البريد الإلكتروني بعد',
                  'Adresse e-mail non vérifiée',
                )}
          </p>
          {!data.verified && (
            <button
              disabled={action.busy}
              onClick={() =>
                action.run(() => apiRequest('security/verification', { method: 'POST' }))
              }
            >
              {text(
                'Send verification link',
                'إرسال رابط التأكيد',
                'Envoyer le lien de vérification',
              )}
            </button>
          )}
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={data.emailReminders}
              disabled={!data.verified || action.busy}
              onChange={(e) => {
                const enabled = e.target.checked;
                void action.run(async () => {
                  await apiRequest('security/reminders', {
                    method: 'PATCH',
                    body: JSON.stringify({ enabled }),
                  });
                  resource.retry();
                });
              }}
            />
            {text(
              'Email reminders (verified email required)',
              'تذكيرات بالبريد الإلكتروني (يتطلّب بريدًا مؤكّدًا)',
              'Rappels par e-mail (adresse vérifiée requise)',
            )}
          </label>
          <h3>
            {text(
              'Two-factor authentication',
              'المصادقة الثنائية',
              'Authentification à deux facteurs',
            )}
          </h3>
          {data.mfaEnabled ? (
            <p>
              {text(
                'Enabled. Use an authenticator code or a recovery code when signing in.',
                'مفعّلة. استخدم رمز تطبيق المصادقة أو رمز استرداد عند تسجيل الدخول.',
                'Activée. Utilisez un code d’authentification ou de récupération à la connexion.',
              )}
            </p>
          ) : (
            <>
              {!secret ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const password = new FormData(form).get('password');
                    void action.run(async () => {
                      const result = await apiRequest<{ secret: string }>('security/mfa/enroll', {
                        method: 'POST',
                        body: JSON.stringify({ password }),
                      });
                      setSecret(result.secret);
                      form.reset();
                    });
                  }}
                >
                  <label className="form-field">
                    {text('Current password', 'كلمة المرور الحالية', 'Mot de passe actuel')}
                    <input
                      type="password"
                      autoComplete="current-password"
                      name="password"
                      required
                    />
                  </label>
                  <button disabled={action.busy}>
                    {text(
                      'Set up authenticator',
                      'إعداد تطبيق المصادقة',
                      'Configurer l’authentificateur',
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = new FormData(e.currentTarget).get('code');
                    void action.run(async () => {
                      const result = await apiRequest<{ recoveryCodes: string[] }>(
                        'security/mfa/confirm',
                        { method: 'POST', body: JSON.stringify({ code }) },
                      );
                      setCodes(result.recoveryCodes);
                      setSecret('');
                      resource.retry();
                    });
                  }}
                >
                  <p>
                    {text(
                      'Add this secret manually in your authenticator app, then enter its six-digit code.',
                      'أضف هذا المفتاح يدويًا إلى تطبيق المصادقة، ثم أدخل الرمز المكوّن من ستة أرقام.',
                      'Ajoutez cette clé manuellement dans votre application, puis saisissez le code à six chiffres.',
                    )}
                  </p>
                  <code className="secret-key" dir="ltr">
                    {secret}
                  </code>
                  <label className="form-field">
                    {text('Authentication code', 'رمز المصادقة', 'Code d’authentification')}
                    <input
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </label>
                  <button disabled={action.busy}>{text('Enable', 'تفعيل', 'Activer')}</button>
                </form>
              )}
            </>
          )}
          {!!codes.length && (
            <div role="status">
              <p>
                {text(
                  'Save these recovery codes somewhere safe. Each works once. They will not be shown again.',
                  'احفظ رموز الاسترداد في مكان آمن. يُستخدم كل رمز مرة واحدة ولن تُعرض مجددًا.',
                  'Conservez ces codes en lieu sûr. Chacun est à usage unique et ne sera plus affiché.',
                )}{' '}
              </p>
              <pre className="secret-key" dir="ltr">
                {codes.join('\n')}
              </pre>
              <button onClick={() => setCodes([])}>
                {text('I saved my codes', 'حفظت الرموز', 'J’ai sauvegardé les codes')}
              </button>
            </div>
          )}
          <h3>{text('Active sessions', 'الجلسات النشطة', 'Sessions actives')}</h3>
          {data.sessions.map((s) => (
            <article key={s.id}>
              <p className="session-agent">{s.agent}</p>
              <p>
                <bdi>{s.last_seen_at}</bdi>{' '}
                {s.current && text('(This browser)', '(هذا المتصفّح)', '(Ce navigateur)')}
              </p>
              {!s.current && (
                <button
                  disabled={action.busy}
                  onClick={() =>
                    action.run(async () => {
                      await apiRequest(`security/sessions/${s.id}`, { method: 'DELETE' });
                      resource.retry();
                    })
                  }
                >
                  {text('Revoke session', 'إنهاء الجلسة', 'Révoquer la session')}
                </button>
              )}
            </article>
          ))}
          {data.isAdmin && <AdminPanel />}
        </>
      )}
      <p role={action.failed ? 'alert' : 'status'}>{action.message}</p>
    </section>
  );
}
