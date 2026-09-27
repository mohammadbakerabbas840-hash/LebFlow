import { useV1 } from '../../i18n/v1';
import { apiMode } from '../../services/backend';
import { useBackendText } from '../../i18n/backend';
import { RequirementsWizard } from './RequirementsWizard';
import { CaseReadiness } from '../../components/cases/CaseReadiness';
import type { ServiceGuide } from '../../types/service';
import { SourceReferences } from '../../components/services/SourceReferences';
import { OfficeDirectory } from '../../components/services/OfficeDirectory';
import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, FileText, Landmark, Plus } from 'lucide-react';
import {
  conditionalDocuments,
  documentsFor,
  getGuide,
  requestStages,
  type RequestKind,
  type RequestStage,
} from '../../data/serviceGuides';
import { stageTranslations } from '../../data/serviceContent';
import { useI18n, formatDocumentProgress } from '../../i18n';
import { AppointmentPicker } from '../appointments/AppointmentPicker';
import type { PersonalRequest, Appointment } from '../cases/caseStorage';
import '../../service-details.css';
import { PassportWizard, WizardStart, type PassportDraft } from './PassportWizard';
import {
  passportRequirements,
  validPassportAnswers,
  type PassportAnswers,
} from './passportRequirements';
export type { PersonalRequest } from '../cases/caseStorage';
type Props = {
  serviceId: string;
  request?: PersonalRequest;
  onCreate: (
    kind: RequestKind,
    appointment?: Appointment,
    answers?: PassportAnswers,
    draft?: Partial<PersonalRequest>,
  ) => void | Promise<void>;
  onUpdate: (patch: Partial<PersonalRequest>) => void | Promise<void>;
  guideOverride?: ServiceGuide;
  onViewCases: () => void;
};
export function ServiceDetails({
  serviceId,
  request,
  onCreate,
  onUpdate,
  onViewCases,
  guideOverride,
}: Props) {
  const { t, locale } = useI18n();
  const v = useV1();
  const b = useBackendText();
  const [genericOpen, setGenericOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [draftDocuments, setDraftDocuments] = useState<string[]>([]);
  const [draftExcluded, setDraftExcluded] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const safelyUpdate = (patch: Partial<PersonalRequest>) => {
    Promise.resolve(onUpdate(patch)).catch(() => setSaveError(true));
  };
  const [saving, setSaving] = useState(false);
  const [draftKind, setDraftKind] = useState<RequestKind>('application');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [answers, setAnswers] = useState<PassportDraft>({});
  const personalized = serviceId === 'passport' && (wizardOpen || !!request?.passportAnswers);
  const activeAnswers = request?.passportAnswers ?? answers;
  const result =
    personalized && validPassportAnswers(activeAnswers)
      ? passportRequirements(activeAnswers)
      : null;
  const blocked = personalized && (!result || result.needsAuthority);
  const guide = guideOverride ?? getGuide(serviceId, locale);
  const kind = request?.kind ?? result?.kind ?? draftKind;
  const documents = guide.documents.filter(
    (d) => (!d.renewalOnly || kind === 'renewal') && (!d.applicationOnly || kind === 'application'),
  );
  const stage = request?.stage ?? requestStages[0];
  const checked = request?.documents ?? draftDocuments;
  const excluded = request?.notApplicable ?? result?.excluded ?? draftExcluded;
  const previewDocuments =
    !request && ((result && !result.needsAuthority) || generated)
      ? documents.filter((d) => !excluded.includes(d.id))
      : documents;
  async function create(appointment?: Appointment) {
    if (blocked || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onCreate(
        kind,
        appointment,
        personalized && validPassportAnswers(activeAnswers) ? activeAnswers : undefined,
        {
          documents: draftDocuments.filter(
            (id) => documents.some((d) => d.id === id) && !excluded.includes(id),
          ),
          notApplicable: excluded,
        },
      );
      if (!appointment) setSavedNotice(true);
    } catch (error) {
      setSaveError(true);
      if (appointment) throw error;
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      {saveError && (
        <p role="alert" className="field-error">
          {t('saveFailed')}
        </p>
      )}
      <p className="guide-scope">{guide.scope}</p>
      {apiMode && <OfficeDirectory serviceId={serviceId} />}
      <span className={`evidence-badge ${guide.evidence}`}>
        {t(guide.evidence === 'core' ? 'sourceBased' : 'draft')}
      </span>
      {serviceId === 'passport' && !request && !wizardOpen && (
        <WizardStart onClick={() => setWizardOpen(true)} />
      )}
      {personalized && (
        <PassportWizard
          answers={activeAnswers}
          onChange={setAnswers}
          saved={!!request}
          onClose={() => {
            setWizardOpen(false);
            setAnswers({});
          }}
        />
      )}
      {serviceId !== 'passport' && !request && (
        <>
          {!genericOpen && !generated && (
            <button type="button" className="wizard-start" onClick={() => setGenericOpen(true)}>
              {v('personalize')}
            </button>
          )}
          {genericOpen && (
            <RequirementsWizard
              serviceId={serviceId}
              onGenerate={(ids, nextKind) => {
                if (nextKind) setDraftKind(nextKind);
                setDraftExcluded(ids);
                setDraftDocuments((d) => d.filter((id) => !ids.includes(id)));
                setGenerated(true);
                setGenericOpen(false);
              }}
            />
          )}
          {generated && (
            <div className="info-note">
              <div>
                {v('personalized')}
                <button
                  type="button"
                  onClick={() => {
                    setGenericOpen(true);
                    setGenerated(false);
                  }}
                >
                  {v('editAnswers')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {guide.renewal && !personalized && (
        <fieldset className="request-kind">
          <legend>{t('whatNeed')}</legend>
          {(['application', 'renewal'] as const).map((value) => (
            <label key={value} className={kind === value ? 'chosen' : ''}>
              <input
                type="radio"
                name="request-kind"
                checked={kind === value}
                disabled={!!request}
                onChange={() => {
                  setDraftKind(value);
                  setDraftDocuments([]);
                  setGenerated(false);
                }}
              />
              {t(value === 'application' ? 'newApplication' : 'renewal')}
            </label>
          ))}
        </fieldset>
      )}
      <section className="documents-section" aria-labelledby="documents-heading">
        <div className="documents-heading">
          <div>
            <span className="eyebrow">{t('beforeRequest')}</span>
            <h3 id="documents-heading">{t('requiredDocs')}</h3>
          </div>
          <span className="document-count">
            {previewDocuments.length} {t('items')}
          </span>
        </div>
        <p className="document-intro">{t('evidenceNote')}</p>
        <div className="document-list">
          {previewDocuments.map((doc, index) => (
            <div
              className={`document-row ${checked.includes(doc.id) ? 'prepared' : ''} ${excluded.includes(doc.id) ? 'not-applicable' : ''}`}
              key={doc.id}
            >
              {request || generated || (personalized && !blocked) ? (
                <input
                  type="checkbox"
                  disabled={excluded.includes(doc.id)}
                  aria-label={`${t('prepare')}: ${doc.title}`}
                  checked={checked.includes(doc.id)}
                  onChange={() =>
                    (request
                      ? safelyUpdate
                      : (patch: Partial<PersonalRequest>) =>
                          setDraftDocuments(patch.documents ?? []))({
                      documents: checked.includes(doc.id)
                        ? checked.filter((id) => id !== doc.id)
                        : [...checked, doc.id],
                    })
                  }
                />
              ) : (
                <span className="document-number">{String(index + 1).padStart(2, '0')}</span>
              )}
              <div>
                <strong>{doc.title}</strong>
                <p>{doc.note}</p>
                {request && !personalized && conditionalDocuments[serviceId].includes(doc.id) && (
                  <button
                    type="button"
                    className="document-applicability"
                    aria-pressed={excluded.includes(doc.id)}
                    onClick={() =>
                      safelyUpdate({
                        documents: checked.filter((id) => id !== doc.id),
                        notApplicable: excluded.includes(doc.id)
                          ? excluded.filter((id) => id !== doc.id)
                          : [...excluded, doc.id],
                      })
                    }
                  >
                    {t(excluded.includes(doc.id) ? 'includeDocument' : 'notApplicable')}
                  </button>
                )}
              </div>
              {checked.includes(doc.id) && <Check size={16} />}
            </div>
          ))}
        </div>
        {request && (
          <p className="preparation-summary" aria-live="polite">
            {formatDocumentProgress(
              locale,
              documents.filter((d) => checked.includes(d.id)).length,
              documents.filter((d) => !excluded.includes(d.id)).length,
            )}
            {excluded.length > 0 && (
              <>
                {' '}
                · {excluded.length} {t('excluded')}
              </>
            )}
          </p>
        )}
      </section>
      <section className="requirements-section">
        <h3>{t('eligibility')}</h3>
        <ul>
          {guide.eligibility.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {kind === 'renewal' && (
          <p className="renewal-note">
            <strong>{t('renewal')}:</strong> {guide.renewal}
          </p>
        )}
      </section>
      <div className="guide-facts">
        <section>
          <FileText size={19} />
          <h3>{t('fees')}</h3>
          <p>{guide.fees}</p>
        </section>
        <section>
          <Landmark size={19} />
          <h3>{t('where')}</h3>
          <p>{guide.location}</p>
        </section>
        <section>
          <CalendarDays size={19} />
          <h3>{t('tests')}</h3>
          <p>{guide.appointments}</p>
        </section>
      </div>
      <section className="panel">
        <h3>{v('steps')}</h3>
        <ol>
          {(['step1', 'step2', 'step3'] as const).map((key) => (
            <li key={key}>{v(key)}</li>
          ))}
        </ol>
        <h3>{v('estimatedTime')}</h3>
        <p>{serviceId === 'passport' ? guide.appointments : v('timeUnknown')}</p>
      </section>
      <SourceReferences guide={guide} />
      {!blocked && (
        <AppointmentPicker
          serviceId={serviceId}
          value={request?.appointment}
          hasRequest={!!request}
          onSave={(appointment) => (request ? onUpdate({ appointment }) : create(appointment))}
          onRemove={() => onUpdate({ appointment: undefined })}
        />
      )}
      {request && (
        <section className="panel">
          <CaseReadiness serviceId={serviceId} request={request} />
          <label className="form-field">
            {v('expiry')}
            <input
              type="date"
              value={request.expiresOn ?? ''}
              onChange={(e) => safelyUpdate({ expiresOn: e.target.value })}
            />
          </label>
          {request.updatedAt && (
            <p>
              {v('updated')}: <bdi>{new Date(request.updatedAt).toLocaleDateString()}</bdi>
            </p>
          )}
        </section>
      )}
      <section className="request-workflow">
        <h3>{t(request ? 'progress' : 'futureProgress')}</h3>
        <p>{t('selfReported')}</p>
        <ol className="stage-list">
          {requestStages.map((item, index) => (
            <li
              key={item}
              className={request && index <= requestStages.indexOf(stage) ? 'reached' : ''}
              aria-current={request && item === stage ? 'step' : undefined}
            >
              <span>{index + 1}</span>
              {stageTranslations[index][locale]}
            </li>
          ))}
        </ol>
        {request && (
          <>
            <label className="stage-label">
              {t('currentStage')}
              <select
                value={stage}
                onChange={(e) => safelyUpdate({ stage: e.target.value as RequestStage })}
              >
                {requestStages.map((item, i) => (
                  <option key={item} value={item}>
                    {stageTranslations[i][locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="date-label">
              <CalendarDays size={17} />
              {t('nextAction')}
              <input
                type="date"
                value={request.due}
                onChange={(e) => safelyUpdate({ due: e.target.value })}
              />
            </label>
          </>
        )}
      </section>
      <div className="request-action">
        {savedNotice && <p role="status">{v('saved')}</p>}
        <p>
          <strong>
            {request && apiMode ? b('saved') : t(request ? 'savedHere' : 'createExplain')}
          </strong>
          <br />
          {t('notGovernment')}
        </p>
        {request ? (
          <button className="primary full" onClick={onViewCases}>
            {t('viewCases')} <ArrowRight size={17} />
          </button>
        ) : (
          <button className="primary full" disabled={blocked || saving} onClick={() => create()}>
            <Plus size={17} />
            {t('createRequest')}
          </button>
        )}
      </div>
    </>
  );
}
