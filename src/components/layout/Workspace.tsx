import { useWorkspaceRoute } from '../../routes/useWorkspaceRoute';
import { useResource } from '../../hooks/useResource';
import {
  getServiceById,
  getPreferences,
  savePreferences,
  getNotifications,
  type Notification,
} from '../../services/client';
import { LoadingState, ErrorState } from '../common/ResourceState';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { NotificationList } from '../common/NotificationList';
import { useV1 } from '../../i18n/v1';
import type { Preferences } from '../../types/preferences';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { apiMode, apiRequest } from '../../services/backend';
import { useBackendText } from '../../i18n/backend';
import { ArrowRight, FileText, MapPin, TreePine, X } from 'lucide-react';
import { useI18n, L, type MessageKey } from '../../i18n';
import type { FamilyMember } from '../account/FamilyManager';
import { CaseTools } from '../cases/CaseTools';
import { services } from '../../data/services';
import { useCases } from '../../hooks/useCases';
import type { Page } from '../../types/navigation';
import type { Profile } from '../../types/user';
import { ServiceDetails } from '../../features/services/ServiceGuidePanel';
import { Modal } from '../common/Modal';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { ExplorePage } from '../../pages/ExplorePage';
import { CasesPage } from '../../pages/CasesPage';
import { AppointmentsPage } from '../../pages/AppointmentsPage';
import { RemindersPage } from '../../pages/RemindersPage';
import { AccountPage } from '../../pages/AccountPage';
import { AiAssistant } from '../services/AiAssistant';

const titles: Record<Page, MessageKey> = {
  explore: 'heading',
  cases: 'casesHeading',
  appointments: 'appointmentHeading',
  reminders: 'reminderHeading',
  account: 'accountTitle',
};
const subtitles: Record<Page, MessageKey> = {
  explore: 'subtitle',
  cases: 'casesSubtitle',
  appointments: 'appointmentSubtitle',
  reminders: 'reminderSubtitle',
  account: 'accountSubtitle',
};

export function Workspace() {
  const { user } = useAuth();
  const b = useBackendText();
  const preferenceQueue = useRef(Promise.resolve());
  const [preferencesReady, setPreferencesReady] = useState(!apiMode || !user);
  const { t, locale } = useI18n();
  const route = useWorkspaceRoute();
  const page = route.page === 'notFound' ? 'explore' : route.page;
  const selected = route.selected;
  const selectedCaseId = route.caseId;
  const [draftVersion, setDraftVersion] = useState(0);
  const [beneficiary, setBeneficiary] = useState('');
  const setSelected = (id: string | null, caseId?: string) => {
    setBeneficiary('');
    route.select(id, caseId);
  };
  const family = useResource(
    useCallback(
      () =>
        apiMode && user && selected ? apiRequest<FamilyMember[]>('family') : Promise.resolve([]),
      [user?.id, selected],
    ),
  );
  const v = useV1();
  const [preferences, setPreferences] = useState(getPreferences);
  const [preferenceFailure, setPreferenceFailure] = useState(false);
  useEffect(() => {
    if (!apiMode || !user) return;
    let active = true;
    apiRequest<Preferences>('preferences')
      .then((p) => {
        if (active) {
          setPreferences(p);
          setPreferencesReady(true);
        }
      })
      .catch(() => {
        if (active) setPreferenceFailure(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  function changePreferences(next: Preferences) {
    if (apiMode) {
      if (!user) {
        navigate('account');
        return;
      }
      if (!preferencesReady) {
        setPreferenceFailure(true);
        return;
      }
      setPreferences(next);
      preferenceQueue.current = preferenceQueue.current
        .then(async () => {
          await apiRequest('preferences', { method: 'PATCH', body: JSON.stringify(next) });
          setPreferenceFailure(false);
        })
        .catch(() => setPreferenceFailure(true));
      return;
    }
    setPreferences(next);
    setPreferenceFailure(!savePreferences(next));
  }
  const [mobileMenu, setMobileMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const {
    cases,
    appointments,
    reminders,
    create,
    updateCase,
    storageFailed,
    dismissStorageError,
    loading,
    error,
    retry,
    pending,
  } = useCases();
  const activeCase = cases.find(
    (c) =>
      c.serviceId === selected &&
      (selectedCaseId ? c.id === selectedCaseId : (c.familyMemberId ?? '') === beneficiary),
  );
  useEffect(() => {
    if (apiMode && selected && activeCase && route.caseId !== activeCase.id)
      route.select(selected, activeCase.id);
  }, [selected, activeCase?.id]);
  const detail = useResource(
    useCallback(
      () => (selected ? getServiceById(selected, locale) : Promise.resolve(null)),
      [selected, locale],
    ),
  );
  const guide = detail.data?.id === selected ? detail.data : undefined;
  const notFound =
    route.page === 'notFound' || (!!selected && !services.some((s) => s.id === selected));
  const notifications = getNotifications(cases, preferences);
  const serverNotifications = useResource(
    useCallback(
      () => (apiMode && user ? apiRequest<Notification[]>('notifications') : Promise.resolve([])),
      [user?.id, cases, preferences],
    ),
  );
  const visibleNotifications = apiMode ? (serverNotifications.data ?? []) : notifications;
  const SelectedIcon = services.find((s) => s.id === selected)?.icon ?? FileText;
  function navigate(next: Page) {
    route.navigate(next);
    setMobileMenu(false);
  }
  const pageProps = { onSelect: setSelected, navigate };

  return (
    <div className="app-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar
        page={page}
        mobileMenu={mobileMenu}
        caseCount={cases.length}
        appointmentCount={appointments.length}
        navigate={navigate}
        onAbout={() => setAbout(true)}
      />
      {mobileMenu && (
        <button
          className="navigation-scrim"
          aria-label={t('close')}
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="main-shell">
        <Topbar
          page={page}
          mobileMenu={mobileMenu}
          reminderCount={reminders.length + visibleNotifications.filter((n) => !n.read).length}
          hasProfile={apiMode ? !!user : !!profile}
          navigate={navigate}
          onToggleMenu={() => setMobileMenu(!mobileMenu)}
        />
        <main aria-busy={pending}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">{t('lessPaper')}</div>
              <h1>{t(titles[page])}</h1>
              <p>{t(subtitles[page])}</p>
            </div>
            <span className="location">
              <MapPin size={15} />
              {t('lebanon')}
            </span>
          </div>
          {(storageFailed || preferenceFailure) && (
            <div role="alert" className="info-note">
              {t('saveFailed')}
              <button
                onClick={() => {
                  dismissStorageError();
                  setPreferenceFailure(false);
                }}
                aria-label={t('close')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <p className="demo-label">{apiMode ? b('serverMode') : v('demoMode')}</p>
          {error && <ErrorState retry={retry} />}
          {notFound && <NotFoundPage onHome={() => navigate('explore')} />}
          {/* Keep discovery state when navigating to another page. */}
          <div hidden={page !== 'explore' || notFound}>
            <ExplorePage {...pageProps} />
          </div>
          {page === 'cases' &&
            (loading ? <LoadingState /> : <CasesPage cases={cases} {...pageProps} />)}
          {page === 'appointments' &&
            (loading ? <LoadingState /> : <AppointmentsPage cases={appointments} {...pageProps} />)}
          {page === 'reminders' &&
            (loading ? (
              <LoadingState />
            ) : (
              <>
                <RemindersPage cases={reminders} {...pageProps} />
                <NotificationList
                  notifications={visibleNotifications}
                  onSelect={setSelected}
                  onRead={(ids) =>
                    changePreferences({
                      ...preferences,
                      readNotifications: [
                        ...new Set([...preferences.readNotifications, ...ids]),
                      ].slice(-500),
                    })
                  }
                />
              </>
            ))}
          {page === 'account' && (
            <AccountPage
              profile={profile}
              onProfileChange={setProfile}
              preferences={preferences}
              onPreferences={changePreferences}
              preferencesLoading={!preferencesReady}
              preferencesError={preferenceFailure}
              onSelect={setSelected}
            />
          )}
          {apiMode && !selected && (
            <AiAssistant key={`${user?.id}-${locale}`} onSignIn={() => navigate('account')} />
          )}
          <Footer />
        </main>
      </div>
      {selected && !notFound && (
        <Modal wide onClose={() => setSelected(null)}>
          {(detail.loading && !guide) || loading ? (
            <>
              <h2 id="dialog-title">{v('loading')}</h2>
              <LoadingState />
            </>
          ) : detail.error ? (
            <ErrorState retry={detail.retry} />
          ) : (
            guide && (
              <>
                <span className="service-icon">
                  <SelectedIcon size={27} />
                </span>
                <div className="eyebrow modal-eyebrow">{guide.category}</div>
                <h2 id="dialog-title">{guide.title}</h2>
                <p>{guide.subtitle}</p>
                <button
                  className="bookmark-button"
                  disabled={!preferencesReady}
                  aria-pressed={preferences.savedServices.includes(selected)}
                  onClick={() =>
                    changePreferences({
                      ...preferences,
                      savedServices: preferences.savedServices.includes(selected)
                        ? preferences.savedServices.filter((id) => id !== selected)
                        : [...preferences.savedServices, selected],
                    })
                  }
                >
                  {v(preferences.savedServices.includes(selected) ? 'unsave' : 'saveService')}
                </button>
                {apiMode && user && (
                  <label className="form-field">
                    {L('Applicant', 'صاحب الطلب', 'Demandeur')[locale]}
                    <select
                      aria-label={L('Applicant', 'صاحب الطلب', 'Demandeur')[locale]}
                      value={activeCase?.familyMemberId ?? beneficiary}
                      disabled={family.loading}
                      onChange={(e) => {
                        setBeneficiary(e.target.value);
                        route.select(selected);
                      }}
                    >
                      <option value="">{L('Myself', 'أنا', 'Moi-même')[locale]}</option>
                      {family.data?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {locale === 'ar' ? member.name_arabic : member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {family.error && <ErrorState retry={family.retry} />}
                {activeCase && (
                  <CaseTools
                    request={activeCase}
                    onArchived={() => {
                      setBeneficiary(activeCase.familyMemberId ?? '');
                      setDraftVersion((value) => value + 1);
                      route.select(selected);
                      retry();
                    }}
                  />
                )}
                <ServiceDetails
                  key={`${selected}-${activeCase?.familyMemberId ?? beneficiary}-${draftVersion}`}
                  serviceId={selected}
                  request={activeCase}
                  guideOverride={guide}
                  onCreate={(kind, appointment, answers, draft) => {
                    if (apiMode && !user) {
                      navigate('account');
                      return;
                    }
                    return create(selected, kind, appointment, answers, {
                      ...draft,
                      familyMemberId: beneficiary || null,
                    });
                  }}
                  onUpdate={(patch) => activeCase && updateCase(activeCase.id, patch)}
                  onViewCases={() => navigate('cases')}
                />
                {apiMode && (
                  <AiAssistant
                    key={`${selected}-${locale}`}
                    serviceId={selected}
                    onSignIn={() => navigate('account')}
                  />
                )}
              </>
            )
          )}
        </Modal>
      )}
      {about && (
        <Modal onClose={() => setAbout(false)}>
          <span className="service-icon">
            <TreePine size={27} />
          </span>
          <h2 id="dialog-title">{t('clearer')}</h2>
          <p>{t('aboutText')}</p>
          <div className="info-note">{t('notGovernment')}</div>
          <button
            className="primary full"
            onClick={() => {
              setAbout(false);
              navigate('explore');
            }}
          >
            {t('explore')} <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </div>
  );
}
