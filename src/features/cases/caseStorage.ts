import { offices } from '../../data/offices';
import { validPassportAnswers, passportRequirements } from '../services/passportRequirements';
import {
  conditionalDocuments,
  documentsFor,
  requestStages,
  serviceContent,
  type RequestKind,
} from '../../data/serviceGuides';
import type { Appointment, Case } from '../../types/case';
export type { Appointment, PersonalRequest, Case } from '../../types/case';
export function beirutNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validAppointment(value: unknown): value is Appointment {
  if (!value || typeof value !== 'object') return false;
  const a = value as Appointment;
  return (
    typeof a.date === 'string' &&
    validDate(a.date) &&
    typeof a.time === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time)
  );
}
export function futureAppointment(value: Appointment, now = new Date()) {
  const current = beirutNow(now);
  return (
    validAppointment(value) && `${value.date}T${value.time}` > `${current.date}T${current.time}`
  );
}
export function parseCases(raw: string): Case[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const result: Case[] = [];
  for (const item of data) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      typeof item.serviceId !== 'string' ||
      !Object.hasOwn(serviceContent, item.serviceId) ||
      typeof item.created !== 'string'
    )
      continue;
    if (result.some((c) => c.id === item.id || c.serviceId === item.serviceId)) continue;
    const kind: RequestKind =
      item.kind === 'renewal' && serviceContent[item.serviceId].renewal ? 'renewal' : 'application';
    const allowed = documentsFor(item.serviceId, kind).map((d) => d.id);
    const answerInput = item.passportAnswers;
    const passportAnswers =
      item.serviceId === 'passport' &&
      validPassportAnswers(answerInput) &&
      !passportRequirements(answerInput).needsAuthority &&
      passportRequirements(answerInput).kind === kind
        ? {
            route: answerInput.route,
            ageBand: answerInput.ageBand,
            hasPrevious: answerInput.hasPrevious,
          }
        : undefined;
    const notApplicable = Array.isArray(item.notApplicable)
      ? [
          ...new Set<string>(
            item.notApplicable.filter(
              (x: unknown) =>
                typeof x === 'string' &&
                allowed.includes(x) &&
                conditionalDocuments[item.serviceId].includes(x),
            ),
          ),
        ]
      : [];
    if (passportAnswers) {
      const guardianIndex = notApplicable.indexOf('guardian');
      if (passportAnswers.ageBand === 'minor' && guardianIndex !== -1)
        notApplicable.splice(guardianIndex, 1);
      if (passportAnswers.ageBand === 'adult' && guardianIndex === -1)
        notApplicable.push('guardian');
    }
    result.push({
      ...(passportAnswers ? { passportAnswers } : {}),
      id: item.id,
      serviceId: item.serviceId,
      created: item.created,
      kind,
      stage: requestStages.includes(item.stage) ? item.stage : requestStages[0],
      documents: Array.isArray(item.documents)
        ? [
            ...new Set<string>(
              item.documents.filter(
                (x: unknown) =>
                  typeof x === 'string' && allowed.includes(x) && !notApplicable.includes(x),
              ),
            ),
          ]
        : [],
      notApplicable,
      expiresOn:
        typeof item.expiresOn === 'string' && validDate(item.expiresOn)
          ? item.expiresOn
          : undefined,
      updatedAt:
        typeof item.updatedAt === 'string' && Number.isFinite(Date.parse(item.updatedAt))
          ? item.updatedAt
          : undefined,
      due: typeof item.due === 'string' && validDate(item.due) ? item.due : '',
      appointment: validAppointment(item.appointment)
        ? {
            date: item.appointment.date,
            time: item.appointment.time,
            ...(item.appointment.mode === 'demo' &&
            offices.some((o) => o.id === item.appointment.branchId)
              ? {
                  mode: 'demo' as const,
                  branchId: item.appointment.branchId,
                  reference:
                    typeof item.appointment.reference === 'string' &&
                    /^DEMO-[a-z0-9-]{8}$/.test(item.appointment.reference)
                      ? item.appointment.reference
                      : undefined,
                }
              : {}),
          }
        : undefined,
    });
  }
  return result;
}
export function readCases() {
  try {
    return parseCases(localStorage.getItem('lebflow-cases') ?? '[]');
  } catch {
    return [];
  }
}
