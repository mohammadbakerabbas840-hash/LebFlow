import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useV1 } from '../../i18n/v1';
import { bookAppointment, getOffices, getSlots } from '../../services/client';
import { beirutNow } from '../../features/cases/caseStorage';
import type { Appointment } from '../../types/case';
import { useResource } from '../../hooks/useResource';
import { LoadingState, ErrorState } from '../common/ResourceState';
import { DateSuggestions } from './DateSuggestions';
export function DemoBooking({
  serviceId,
  value,
  onSave,
  onRemove,
}: {
  serviceId: string;
  value?: Appointment;
  onSave: (a: Appointment) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}) {
  const { locale, t } = useI18n();
  const v = useV1();
  const [open, setOpen] = useState(value?.mode === 'demo');
  const [branch, setBranch] = useState(value?.branchId ?? 'demo-beirut');
  const [date, setDate] = useState(value?.date ?? '');
  const [time, setTime] = useState(value?.time ?? '');
  const [step, setStep] = useState<'edit' | 'review' | 'saved' | 'cancel'>(
    value?.mode === 'demo' ? 'saved' : 'edit',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    if (value?.mode === 'demo') {
      setOpen(true);
      setBranch(value.branchId ?? 'demo-beirut');
      setDate(value.date);
      setTime(value.time);
      setStep('saved');
    }
  }, [value?.reference]);
  const branches = useResource(useCallback(() => getOffices(serviceId), [serviceId]));
  const slots = useResource(useCallback(() => getSlots(branch, date), [branch, date]));
  if (!open)
    return (
      <button type="button" className="wizard-start" onClick={() => setOpen(true)}>
        {v('demoBooking')}
      </button>
    );
  return (
    <section className="demo-booking panel">
      <h3>{v('demoBooking')}</h3>
      <p className="info-note">{v('demoNote')}</p>
      {error && (
        <div role="alert">
          {v('error')}
          <button
            type="button"
            onClick={() => {
              setError(false);
              setStep('edit');
            }}
          >
            {v('retry')}
          </button>
        </div>
      )}
      {cancelled && <p role="status">{v('cancelled')}</p>}
      {step === 'edit' ? (
        <>
          {branches.loading ? (
            <LoadingState />
          ) : branches.error ? (
            <ErrorState retry={branches.retry} />
          ) : (
            <label className="form-field">
              {v('branch')}
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setTime('');
                }}
              >
                {branches.data?.map((o) => (
                  <option value={o.id} key={o.id}>
                    {o.name[locale]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="form-field">
            {t('date')}
            <input
              type="date"
              min={beirutNow().date}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
            />
          </label>
          <DateSuggestions
            value={date}
            skipSunday
            onChange={(next) => {
              setDate(next);
              setTime('');
            }}
          />
          {date &&
            (slots.loading ? (
              <LoadingState />
            ) : slots.error ? (
              <ErrorState retry={slots.retry} />
            ) : slots.data?.length ? (
              <label className="form-field">
                {v('slot')}
                <select value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">—</option>
                  {slots.data.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p role="status">{v('noSlots')}</p>
            ))}
          <p>{t('beirutTime')}</p>
          <button
            type="button"
            className="primary"
            disabled={!time || slots.loading || !slots.data?.includes(time)}
            onClick={() => {
              setCancelled(false);
              setStep('review');
            }}
          >
            {v('review')}
          </button>
        </>
      ) : (
        <>
          <h4>{v('summary')}</h4>
          <dl className="summary-list">
            <dt>{v('branch')}</dt>
            <dd>
              {
                branches.data?.find((o) => o.id === (step === 'saved' ? value?.branchId : branch))
                  ?.name[locale]
              }
            </dd>
            <dt>{t('date')}</dt>
            <dd>
              <bdi>{step === 'saved' ? value?.date : date}</bdi>
            </dd>
            <dt>{t('time')}</dt>
            <dd>
              <bdi>{step === 'saved' ? value?.time : time}</bdi>
            </dd>
          </dl>
          {step === 'review' && (
            <div className="action-row">
              <button
                className="primary"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(false);
                  try {
                    const booking = await bookAppointment(serviceId, branch, date, time);
                    await onSave(booking);
                    setStep('saved');
                  } catch {
                    setError(true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {v('confirm')}
              </button>
              <button type="button" disabled={busy} onClick={() => setStep('edit')}>
                {v('back')}
              </button>
            </div>
          )}
          {step === 'saved' && (
            <>
              <p role="status">
                {v('demoConfirmed')} <bdi>{value?.reference}</bdi>
              </p>
              <div className="action-row">
                <button type="button" disabled={busy} onClick={() => setStep('edit')}>
                  {v('reschedule')}
                </button>
                <button type="button" disabled={busy} onClick={() => setStep('cancel')}>
                  {v('cancelBooking')}
                </button>
              </div>
            </>
          )}
          {step === 'cancel' && (
            <div className="action-row">
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onRemove();
                    setStep('edit');
                    setTime('');
                    setDate('');
                    setCancelled(true);
                  } catch {
                    setError(true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {v('confirmCancel')}
              </button>
              <button type="button" onClick={() => setStep('saved')}>
                {v('keep')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
