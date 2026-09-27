import { DemoBooking } from '../../components/appointments/DemoBooking';
import { DateSuggestions } from '../../components/appointments/DateSuggestions';
import { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, X } from 'lucide-react';
import { beirutNow, futureAppointment, type Appointment } from '../cases/caseStorage';
import { getGuide } from '../../data/serviceGuides';
import { useI18n } from '../../i18n';
export function AppointmentPicker({
  serviceId,
  value,
  hasRequest,
  onSave,
  onRemove,
}: {
  serviceId: string;
  value?: Appointment;
  hasRequest: boolean;
  onSave: (value: Appointment) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}) {
  const { t, locale } = useI18n();
  const guide = getGuide(serviceId, locale);
  const [date, setDate] = useState(value?.date ?? '');
  const [time, setTime] = useState(value?.time ?? '');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDate(value?.date ?? '');
    setTime(value?.time ?? '');
  }, [value?.date, value?.time]);
  const [message, setMessage] = useState<
    'dateSaved' | 'removedDate' | 'futureDate' | 'saveFailed' | null
  >(null);
  return (
    <section className="appointment-picker" aria-labelledby={`appointment-${serviceId}`}>
      <div className="appointment-title">
        <span className="service-icon">
          <CalendarDays size={23} />
        </span>
        <div>
          <span className="eyebrow">{t('appointments')}</span>
          <h3 id={`appointment-${serviceId}`}>{t('nearest')}</h3>
        </div>
      </div>
      <div className="availability">
        <span className="availability-dot" />
        {t('unknown')}
      </div>
      <p>{t('noLive')}</p>
      <p className="appointment-channel">
        {guide.channel ? (
          <a href={guide.channel.url} target="_blank" rel="noreferrer">
            {guide.channel.title} <ExternalLink size={14} />
          </a>
        ) : (
          t('contactOffice')
        )}
      </p>
      <DemoBooking serviceId={serviceId} value={value} onSave={onSave} onRemove={onRemove} />
      {value?.mode !== 'demo' && (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (!futureAppointment({ date, time })) {
              setMessage('futureDate');
              return;
            }
            try {
              setBusy(true);
              await onSave({ date, time });
              setMessage('dateSaved');
            } catch {
              setMessage('saveFailed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <h4>{t('chooseDate')}</h4>
          <DateSuggestions
            value={date}
            disabled={busy}
            onChange={(next) => {
              setDate(next);
              setMessage(null);
            }}
          />
          <div className="appointment-fields">
            <label>
              {t('date')}
              <input
                aria-invalid={message === 'futureDate'}
                aria-describedby={`appointment-message-${serviceId}`}
                type="date"
                required
                min={beirutNow().date}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setMessage(null);
                }}
              />
            </label>
            <label>
              {t('time')}
              <input
                aria-invalid={message === 'futureDate'}
                aria-describedby={`appointment-message-${serviceId}`}
                type="time"
                required
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setMessage(null);
                }}
              />
            </label>
          </div>
          <p className="small-note">
            {t('beirutTime')} {t('preferred')}
          </p>
          <div
            id={`appointment-message-${serviceId}`}
            role={message === 'futureDate' || message === 'saveFailed' ? 'alert' : 'status'}
            className={
              message === 'futureDate' || message === 'saveFailed' ? 'field-error' : 'saved-message'
            }
          >
            {message && t(message)}
          </div>
          <button className="primary full" type="submit" disabled={busy} aria-busy={busy}>
            <CalendarDays size={17} />
            {t(hasRequest ? 'saveDate' : 'saveDateCreate')}
          </button>
          {value && (
            <button
              className="text-button full"
              disabled={busy}
              type="button"
              onClick={async () => {
                setBusy(true);
                try {
                  await onRemove();
                } catch {
                  setMessage('saveFailed');
                  return;
                } finally {
                  setBusy(false);
                }
                setDate('');
                setTime('');
                setMessage('removedDate');
              }}
            >
              <X size={15} />
              {t('removeDate')}
            </button>
          )}
        </form>
      )}
    </section>
  );
}
