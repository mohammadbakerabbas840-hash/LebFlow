import { useState } from 'react';
import { apiRequest, ApiError, type ServerUser } from '../../services/backend';
import { useAuth } from './AuthProvider';
import { Registration } from './Registration';
import { useI18n } from '../../i18n';
import { useBackendText } from '../../i18n/backend';
import { L } from '../../i18n';
import { FamilyManager } from '../../components/account/FamilyManager';
import { DocumentUpload } from '../../components/account/DocumentUpload';
import { SecurityPanel } from '../../components/account/SecurityPanel';
import { PasswordRecovery } from '../../components/account/PasswordRecovery';
import { CaseArchive } from '../../components/account/CaseArchive';
export function BackendAccount() {
  const { user, acceptUser, logout } = useAuth();
  const { t, locale } = useI18n();
  const b = useBackendText();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [mfa, setMfa] = useState(false);
  return (
    <section className="backend-account">
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {!user ? (
        <>
          <div className="action-row">
            <button
              type="button"
              aria-pressed={!register}
              onClick={() => {
                setRegister(false);
                setError('');
              }}
            >
              {b('signIn')}
            </button>
            <button
              type="button"
              aria-pressed={register}
              onClick={() => {
                setRegister(true);
                setError('');
              }}
            >
              {b('register')}
            </button>
          </div>
          {register ? (
            <Registration
              profile={null}
              onCreate={() => {}}
              onSignOut={() => {}}
              serverMode
              onRegister={async (fields, files) => {
                const body = new FormData();
                Object.entries({
                  name: fields.name,
                  nameArabic: fields.nameArabic,
                  email: fields.email,
                  password: fields.password,
                  password_confirmation: fields.confirmPassword,
                  dob: fields.dob,
                  idNumber: fields.idNumber,
                  consent: '1',
                  locale,
                }).forEach(([key, value]) => body.set(key, value));
                if (files.idPhoto) body.set('idPhoto', files.idPhoto);
                if (files.extract) body.set('extract', files.extract);
                acceptUser(await apiRequest<ServerUser>('auth/register', { method: 'POST', body }));
              }}
            />
          ) : (
            <form
              className="panel login-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setBusy(true);
                setError('');
                try {
                  const result = await apiRequest<ServerUser | { mfaRequired: true }>(
                    mfa ? 'auth/mfa' : 'auth/login',
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        email: data.get('email'),
                        password: data.get('password'),
                        code: data.get('code'),
                      }),
                    },
                  );
                  if ('mfaRequired' in result) setMfa(true);
                  else acceptUser(result);
                } catch {
                  setError(b('error'));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2>{b('signIn')}</h2>
              {mfa ? (
                <label className="form-field">
                  {
                    L(
                      'Authenticator or recovery code',
                      'رمز المصادقة أو الاسترداد',
                      'Code d’authentification ou de récupération',
                    )[locale]
                  }
                  <input name="code" autoComplete="one-time-code" required maxLength={32} />
                </label>
              ) : (
                <>
                  <label className="form-field">
                    {t('email')}
                    <input name="email" type="email" autoComplete="username" required />
                  </label>
                  <label className="form-field">
                    {t('password')}
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                </>
              )}
              <button className="primary" disabled={busy}>
                {b('signIn')}
              </button>
            </form>
          )}
          {!register && <PasswordRecovery />}
        </>
      ) : (
        <section className="panel">
          <h2>{user.name}</h2>
          {user.nameArabic && (
            <p lang="ar" dir="rtl">
              {user.nameArabic}
            </p>
          )}
          <p>
            {t('unverified')} · <bdi>{user.idNumberMasked}</bdi>
          </p>
          <p>{b('security')}</p>
          <form
            key={user.id}
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setBusy(true);
              setError('');
              try {
                acceptUser(
                  await apiRequest<ServerUser>('me', {
                    method: 'PATCH',
                    body: JSON.stringify({
                      name: data.get('name'),
                      ...(data.get('nameArabic') ? { nameArabic: data.get('nameArabic') } : {}),
                      email: data.get('email'),
                      dob: data.get('dob'),
                      locale,
                    }),
                  }),
                );
                setSaved(true);
              } catch (e) {
                setError(
                  e instanceof ApiError
                    ? (Object.values(e.errors).flat()[0] ?? b('error'))
                    : b('error'),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="form-field">
              {t('fullName')}
              <input name="name" defaultValue={user.name} required minLength={2} maxLength={120} />
            </label>
            <label className="form-field">
              {
                {
                  en: 'Full name in Arabic',
                  ar: 'الاسم الكامل بالعربية',
                  fr: 'Nom complet en arabe',
                }[locale]
              }
              <input
                name="nameArabic"
                dir="rtl"
                lang="ar"
                defaultValue={user.nameArabic ?? ''}
                minLength={2}
                maxLength={120}
              />
            </label>
            <label className="form-field">
              {t('email')}
              <input name="email" type="email" defaultValue={user.email} required />
            </label>
            <label className="form-field">
              {t('dob')}
              <input name="dob" type="date" defaultValue={user.dob} required />
            </label>
            <button className="primary" disabled={busy}>
              {b('edit')}
            </button>
          </form>
          {saved && <p role="status">{b('saved')}</p>}
          <h3>{t('identityDocuments')}</h3>
          <p>
            {
              {
                en: 'Private scans check readability and consistency, not government authenticity. Unchecked files remain quarantined. PDF documents require review.',
                ar: 'يفحص المسح الخاص وضوح المستند وتطابق البيانات، ولا يثبت صحة إصداره رسميًا. تبقى الملفات غير المفحوصة معزولة. تتطلب ملفات PDF مراجعة.',
                fr: 'L’analyse privée vérifie la lisibilité et la cohérence, sans certifier l’authenticité officielle. Les fichiers non contrôlés restent en quarantaine. Les PDF nécessitent une révision.',
              }[locale]
            }
          </p>
          {user.documents.map((d) => (
            <p key={d.id}>
              {d.downloadAvailable ? (
                <a href={`/api/v1/identity-documents/${d.id}`} download>
                  {t(d.kind === 'idPhoto' ? 'idPhoto' : 'extract')}
                </a>
              ) : (
                <span>{t(d.kind === 'idPhoto' ? 'idPhoto' : 'extract')}</span>
              )}
              {' — '}
              {
                {
                  en: {
                    pending: 'Scan pending',
                    unavailable: 'Scanner unavailable — review required',
                    needs_review: 'Review required',
                    consistent: 'Details consistent — authenticity not verified',
                    rejected: 'File rejected',
                  },
                  ar: {
                    pending: 'بانتظار الفحص',
                    unavailable: 'الفحص غير متاح — تلزم المراجعة',
                    needs_review: 'تلزم المراجعة',
                    consistent: 'البيانات متطابقة — الأصالة غير مؤكدة',
                    rejected: 'الملف مرفوض',
                  },
                  fr: {
                    pending: 'Analyse en attente',
                    unavailable: 'Analyse indisponible — révision nécessaire',
                    needs_review: 'Révision nécessaire',
                    consistent: 'Données cohérentes — authenticité non vérifiée',
                    rejected: 'Fichier refusé',
                  },
                }[locale][(d.scanStatus ?? 'pending') as 'pending']
              }
            </p>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                acceptUser(await apiRequest<ServerUser>('me'));
              } catch {
                setError(b('error'));
              } finally {
                setBusy(false);
              }
            }}
          >
            {
              {
                en: 'Refresh scan status',
                ar: 'تحديث حالة الفحص',
                fr: 'Actualiser l’état de l’analyse',
              }[locale]
            }
          </button>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              setBusy(true);
              setError('');
              setSaved(false);
              try {
                await apiRequest('me/password', {
                  method: 'PUT',
                  body: JSON.stringify(Object.fromEntries(data)),
                });
                form.reset();
                setSaved(true);
              } catch (e) {
                setError(
                  e instanceof ApiError
                    ? (Object.values(e.errors).flat()[0] ?? b('error'))
                    : b('error'),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>{b('changePassword')}</h3>
            <label className="form-field">
              {b('currentPassword')}
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label className="form-field">
              {b('newPassword')}
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <label className="form-field">
              {t('confirmPassword')}
              <input
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {b('changePassword')}
            </button>
          </form>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await logout();
              } catch {
                setError(b('error'));
                setBusy(false);
              }
            }}
          >
            {b('signOut')}
          </button>
          <FamilyManager />
          <DocumentUpload />
          <SecurityPanel />
          <CaseArchive />
        </section>
      )}
    </section>
  );
}
