import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useV1 } from '../../i18n/v1';
import { apiMode } from '../../services/backend';
import { useBackendText } from '../../i18n/backend';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import type { Preferences } from '../../types/preferences';
import type { Profile } from '../../types/user';
import { getGuide } from '../../data/serviceGuides';
import { validateRegistration } from '../../features/auth/registrationValidation';
export function AccountSettings({
  preferences,
  onPreferences,
  profile,
  onProfile,
  onSelect,
}: {
  preferences: Preferences;
  onPreferences: (p: Preferences) => void;
  profile: Profile | null;
  onProfile: (p: Profile) => void;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const v = useV1();
  const b = useBackendText();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!profile) {
      setDraft(null);
      setEditing(false);
      setError('');
      setSaved(false);
    }
  }, [profile]);
  return (
    <div className="account-settings">
      <section className="panel">
        <h2>{v('preferences')}</h2>
        <label>{t('language')}</label>
        <LanguageSwitcher />
        <h3>{v('notificationPrefs')}</h3>
        <p>{apiMode ? b('reminders') : t('inAppOnly')}</p>
        {(['appointmentAlerts', 'expiryAlerts', 'incompleteAlerts', 'updateAlerts'] as const).map(
          (key) => (
            <label className="preference-toggle" key={key}>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(e) => onPreferences({ ...preferences, [key]: e.target.checked })}
              />
              {v(key)}
            </label>
          ),
        )}
      </section>
      <section className="panel">
        <h2>{v('bookmarks')}</h2>
        {preferences.savedServices.length ? (
          preferences.savedServices.map((id) => (
            <div key={id} className="saved-service">
              <button onClick={() => onSelect(id)}>{getGuide(id, locale).title}</button>
              <button
                aria-label={`${v('unsave')}: ${getGuide(id, locale).title}`}
                onClick={() =>
                  onPreferences({
                    ...preferences,
                    savedServices: preferences.savedServices.filter((s) => s !== id),
                  })
                }
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p>{v('noBookmarks')}</p>
        )}
      </section>
      {profile && (
        <section className="panel">
          <h2>{t('personalInfo')}</h2>
          {!editing ? (
            <button
              onClick={() => {
                setDraft(profile);
                setEditing(true);
                setSaved(false);
              }}
            >
              {v('editProfile')}
            </button>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft) return;
                const errors = validateRegistration(
                  {
                    ...draft,
                    password: 'demo-password-only',
                    confirmPassword: 'demo-password-only',
                    consent: true,
                  },
                  draft,
                );
                const first = Object.values(errors)[0];
                if (first) {
                  setError(t(first));
                  return;
                }
                onProfile({ ...draft, name: draft.name.trim(), email: draft.email.trim() });
                setError('');
                setEditing(false);
                setSaved(true);
              }}
            >
              {(['name', 'nameArabic', 'dob', 'idNumber', 'email'] as const).map((key) => (
                <label className="form-field" key={key}>
                  {key === 'nameArabic'
                    ? {
                        en: 'Full name in Arabic',
                        ar: 'الاسم الكامل بالعربية',
                        fr: 'Nom complet en arabe',
                      }[locale]
                    : t(key === 'name' ? 'fullName' : key)}
                  <input
                    type={key === 'dob' ? 'date' : key === 'email' ? 'email' : 'text'}
                    dir={key === 'nameArabic' ? 'rtl' : undefined}
                    value={draft?.[key] ?? ''}
                    onChange={(e) => {
                      setDraft(draft ? { ...draft, [key]: e.target.value } : null);
                      setError('');
                    }}
                  />
                </label>
              ))}
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <button className="primary">{v('saveProfile')}</button>
              <button type="button" onClick={() => setEditing(false)}>
                {v('back')}
              </button>
            </form>
          )}
          {saved && <p role="status">{v('saved')}</p>}
        </section>
      )}
      <section className="panel">
        <h2>{v('security')}</h2>
        <p>{apiMode ? b('security') : v('securityNote')}</p>
      </section>
    </div>
  );
}
