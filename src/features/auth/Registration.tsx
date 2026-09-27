import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, FileCheck2, LogOut, ShieldCheck, Upload, UserRound, X } from 'lucide-react';
import { useI18n, localeTags, type MessageKey } from '../../i18n';
import { beirutNow } from '../cases/caseStorage';
import { registrationText, useBackendText } from '../../i18n/backend';
import { ApiError } from '../../services/backend';
import {
  validateIdentityFile,
  validateRegistration,
  type Profile,
  type RegistrationErrors,
  type RegistrationFields,
} from './registrationValidation';

function DocumentUpload({
  kind,
  file,
  onChange,
  error,
  onError,
  onBusy,
}: {
  kind: 'idPhoto' | 'extract';
  file: File | null;
  onChange: (file: File | null) => void;
  error?: MessageKey;
  onError: (error?: MessageKey) => void;
  onBusy: (busy: boolean) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(
    () => () => {
      version.current++;
    },
    [],
  );
  const select = async (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    const current = ++version.current;
    onChange(null);
    onError(undefined);
    setBusy(true);
    onBusy(true);
    const problem = await validateIdentityFile(next, kind === 'extract');
    if (current !== version.current) return;
    setBusy(false);
    onBusy(false);
    if (problem) {
      onError(problem);
      if (input.current) input.current.value = '';
    } else onChange(next);
  };
  return (
    <div className={`upload-card ${error ? 'has-error' : ''}`}>
      <label htmlFor={`file-${kind}`}>
        <Upload size={21} />
        <strong>{t(kind)}</strong>
      </label>
      <p id={`file-hint-${kind}`}>{t(kind === 'idPhoto' ? 'imageTypes' : 'extractTypes')}</p>
      <input
        ref={input}
        id={`file-${kind}`}
        name={kind}
        className="file-input"
        type="file"
        accept={kind === 'idPhoto' ? '.jpg,.jpeg,.png,.webp' : '.jpg,.jpeg,.png,.webp,.pdf'}
        aria-invalid={!!error}
        aria-describedby={`file-hint-${kind} error-${kind}`}
        onChange={select}
      />
      {preview && <img className="document-preview" src={preview} alt={t(kind)} />}
      {file && (
        <div className="attached-file">
          <FileCheck2 size={17} />
          <bdi>{file.name}</bdi>
          <button
            type="button"
            aria-label={`${t('removeFile')}: ${t(kind)}`}
            onClick={() => {
              version.current++;
              onChange(null);
              onError(undefined);
              if (input.current) input.current.value = '';
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <button
        className="secondary"
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {t(busy ? 'validating' : file ? 'changeFile' : 'chooseFile')}
      </button>
      <p id={`error-${kind}`} className="field-error" role={error ? 'alert' : undefined}>
        {error && t(error)}
      </p>
    </div>
  );
}

export function Registration({
  profile,
  onCreate,
  onSignOut,
  serverMode = false,
  onRegister,
}: {
  profile: Profile | null;
  onCreate: (profile: Profile) => void;
  onSignOut: () => void;
  serverMode?: boolean;
  onRegister?: (
    fields: RegistrationFields,
    files: { idPhoto: File | null; extract: File | null },
  ) => Promise<void>;
}) {
  const { t: translate, locale } = useI18n();
  const t = (key: MessageKey) =>
    (serverMode ? registrationText(key, locale) : undefined) ?? translate(key);
  const b = useBackendText();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fields, setFields] = useState<RegistrationFields>({
    name: '',
    nameArabic: '',
    dob: '',
    idNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    consent: false,
  });
  const [files, setFiles] = useState<{ idPhoto: File | null; extract: File | null }>({
    idPhoto: null,
    extract: null,
  });
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [busy, setBusy] = useState({ idPhoto: false, extract: false });
  const form = useRef<HTMLFormElement>(null);
  const setField = (key: keyof RegistrationFields, value: string | boolean) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  if (profile)
    return (
      <section className="profile-card">
        <div className="profile-icon">
          <UserRound size={34} />
        </div>
        <span className="eyebrow">{t('previewReady')}</span>
        <h2>
          <bdi>{profile.name}</bdi>
        </h2>
        <span className="verification-badge">{t('unverified')}</span>
        <dl>
          <div>
            <dt>{t('email')}</dt>
            <dd>
              <bdi>{profile.email}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t('dob')}</dt>
            <dd>
              {new Date(profile.dob + 'T12:00:00').toLocaleDateString(localeTags[locale], {
                dateStyle: 'long',
              })}
            </dd>
          </div>
          <div>
            <dt>{t('idNumber')}</dt>
            <dd>
              <bdi>{profile.idNumber ? `•••• ${profile.idNumber.slice(-3)}` : '—'}</bdi>
            </dd>
          </div>
        </dl>
        <div className="profile-files">
          <Check size={19} />
          {Number(!!profile.idPhoto) + Number(!!profile.extract)} / 2
        </div>
        <p className="info-note">{t('prototypePrivacy')}</p>
        <button className="primary" onClick={onSignOut}>
          <LogOut size={17} />
          {t('signOut')}
        </button>
      </section>
    );
  return (
    <form
      className="registration-form"
      ref={form}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.idPhoto || busy.extract || submitting) return;
        const problems = validateRegistration(fields, files);
        setErrors(problems);
        if (Object.keys(problems).length) {
          requestAnimationFrame(() =>
            form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        if (onRegister) {
          setSubmitting(true);
          setServerError('');
          try {
            await onRegister(fields, files);
          } catch (error) {
            setServerError(
              error instanceof ApiError
                ? (Object.values(error.errors).flat()[0] ?? b('error'))
                : b('error'),
            );
            return;
          } finally {
            setSubmitting(false);
          }
        } else
          onCreate({
            name: fields.name.trim(),
            nameArabic: fields.nameArabic.trim(),
            dob: fields.dob,
            idNumber: fields.idNumber.trim(),
            email: fields.email.trim(),
            idPhoto: files.idPhoto,
            extract: files.extract,
          });
        setFields({
          name: '',
          nameArabic: '',
          dob: '',
          idNumber: '',
          email: '',
          password: '',
          confirmPassword: '',
          consent: false,
        });
        setFiles({ idPhoto: null, extract: null });
      }}
    >
      <div className="info-note">
        <ShieldCheck size={22} />
        <span>{t('prototypePrivacy')}</span>
      </div>
      <section>
        <div className="form-section-title">
          <span>01</span>
          <h2>{t('personalInfo')}</h2>
        </div>
        <div className="registration-grid">
          {(
            [
              'name',
              'nameArabic',
              'dob',
              'idNumber',
              'email',
              'password',
              'confirmPassword',
            ] as const
          ).map((key) => {
            const label = key === 'name' || key === 'nameArabic' ? 'fullName' : key;
            const labelText =
              key === 'name'
                ? {
                    en: 'Full name in English',
                    ar: 'الاسم الكامل بالإنجليزية',
                    fr: 'Nom complet en anglais',
                  }[locale]
                : key === 'nameArabic'
                  ? {
                      en: 'Full name in Arabic',
                      ar: 'الاسم الكامل بالعربية',
                      fr: 'Nom complet en arabe',
                    }[locale]
                  : t(label);
            return (
              <label className={`form-field ${key === 'name' ? 'wide' : ''}`} key={key}>
                <span>
                  {labelText}{' '}
                  {key === 'idNumber'
                    ? `(${{ en: 'optional', ar: 'اختياري', fr: 'facultatif' }[locale]})`
                    : '*'}
                </span>
                <input
                  name={key}
                  dir={key === 'nameArabic' ? 'rtl' : key === 'name' ? 'ltr' : undefined}
                  autoComplete={
                    key === 'password' || key === 'confirmPassword'
                      ? 'new-password'
                      : key === 'dob'
                        ? 'bday'
                        : key === 'idNumber'
                          ? 'off'
                          : key
                  }
                  type={
                    key === 'password' || key === 'confirmPassword'
                      ? 'password'
                      : key === 'dob'
                        ? 'date'
                        : key === 'email'
                          ? 'email'
                          : 'text'
                  }
                  value={fields[key]}
                  required={key !== 'idNumber'}
                  min={key === 'dob' ? '1900-01-01' : undefined}
                  max={key === 'dob' ? beirutNow().date : undefined}
                  maxLength={
                    key === 'name' || key === 'nameArabic' ? 120 : key === 'idNumber' ? 30 : 254
                  }
                  aria-invalid={!!errors[key]}
                  aria-describedby={`error-${key}`}
                  onChange={(e) => setField(key, e.target.value)}
                />
                <small id={`error-${key}`} className={errors[key] ? 'field-error' : 'field-hint'}>
                  {errors[key] ? t(errors[key]!) : key === 'password' ? t('passwordHint') : ''}
                </small>
              </label>
            );
          })}
        </div>
      </section>
      <section>
        <div className="form-section-title">
          <span>02</span>
          <h2>{t('identityDocuments')}</h2>
        </div>
        <p className="form-note">
          {
            {
              en: 'ID number and identity uploads are optional. Parents may register with their own details to prepare a child’s first documents. Upload only your own documents here; the receiving authority will confirm the child’s requirements.',
              ar: 'رقم الهوية والمستندات الثبوتية اختيارية. يمكن للوالدين التسجيل ببياناتهما لتحضير أول مستندات للطفل. ارفع مستنداتك الشخصية فقط هنا؛ تؤكد الجهة المختصة مستندات الطفل المطلوبة.',
              fr: 'Le numéro d’identité et les justificatifs sont facultatifs. Les parents peuvent s’inscrire avec leurs propres informations pour préparer les premiers documents de leur enfant. Téléversez uniquement vos propres justificatifs ici ; l’administration confirmera les pièces concernant l’enfant.',
            }[locale]
          }
        </p>
        <div className="upload-grid">
          {(['idPhoto', 'extract'] as const).map((kind) => (
            <DocumentUpload
              key={kind}
              kind={kind}
              file={files[kind]}
              onChange={(file) => setFiles((f) => ({ ...f, [kind]: file }))}
              error={errors[kind]}
              onError={(error) => setErrors((e) => ({ ...e, [kind]: error }))}
              onBusy={(value) => setBusy((b) => ({ ...b, [kind]: value }))}
            />
          ))}
        </div>
      </section>
      <label className="consent-label">
        <input
          type="checkbox"
          checked={fields.consent}
          aria-invalid={!!errors.consent}
          aria-describedby="error-consent"
          onChange={(e) => setField('consent', e.target.checked)}
        />
        <span>{t('consent')}</span>
      </label>
      <p className="field-error" id="error-consent">
        {errors.consent && t(errors.consent)}
      </p>
      {serverError && (
        <p role="alert" className="field-error">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        className="primary full"
        disabled={busy.idPhoto || busy.extract || submitting}
      >
        <UserRound size={18} />
        {t('createPreview')}
      </button>
    </form>
  );
}
