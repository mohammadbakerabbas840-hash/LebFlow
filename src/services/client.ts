import { services } from '../data/services';
import { serviceContent } from '../data/serviceContent';
import { getGuide, documentsFor, requestStages, type RequestKind } from '../data/serviceGuides';
import { offices } from '../data/offices';
import { parseCases, beirutNow, validDate, futureAppointment } from '../features/cases/caseStorage';
import {
  passportRequirements,
  type PassportAnswers,
} from '../features/services/passportRequirements';
import type { Appointment, Case, PersonalRequest } from '../types/case';
import type { Locale } from '../i18n';
import type { Preferences } from '../types/preferences';
import type { V1Key } from '../i18n/v1';
import { apiMode, apiRequest, ApiError } from './backend';

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 100));
let memory: Case[] | undefined;
let storageFailed = false;
const snapshot = () => ({ cases: [...(memory ?? [])], storageFailed });
function commit(cases: Case[]) {
  memory = parseCases(JSON.stringify(cases));
  try {
    localStorage.setItem('lebflow-cases', JSON.stringify(memory));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  return snapshot();
}
export async function getServices() {
  if (apiMode) {
    const catalogue =
      await apiRequest<{ id: string; content?: (typeof serviceContent)[string] }[]>('services');
    for (const entry of catalogue)
      if (entry.content && serviceContent[entry.id]) serviceContent[entry.id] = entry.content;
    return services.filter((s) => catalogue.some((item) => item.id === s.id));
  }
  await pause();
  return [...services];
}
export async function getServiceById(id: string, locale: Locale) {
  if (apiMode)
    return apiRequest<ReturnType<typeof getGuide> & { id: string }>(
      `services/${encodeURIComponent(id)}?locale=${locale}`,
    );
  await pause();
  if (!services.some((s) => s.id === id)) throw new Error('Unknown service');
  return { ...getGuide(id, locale), id };
}
export async function getCases() {
  if (apiMode) {
    try {
      return { cases: await apiRequest<Case[]>('cases'), storageFailed: false };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        return { cases: [], storageFailed: false };
      throw error;
    }
  }
  await pause();
  if (!memory) {
    try {
      memory = parseCases(localStorage.getItem('lebflow-cases') ?? '[]');
    } catch {
      memory = [];
      storageFailed = true;
    }
  }
  return snapshot();
}
export async function createCase(
  serviceId: string,
  kind: RequestKind,
  appointment?: Appointment,
  answers?: PassportAnswers,
  draft: Partial<PersonalRequest> = {},
) {
  if (apiMode) {
    await apiRequest('cases', {
      method: 'POST',
      body: JSON.stringify({
        serviceId,
        familyMemberId: draft.familyMemberId,
        kind,
        appointment,
        passportAnswers: answers,
        documents: draft.documents ?? [],
        notApplicable: draft.notApplicable ?? [],
      }),
    });
    return getCases();
  }
  await getCases();
  if (!services.some((s) => s.id === serviceId)) throw new Error('Unknown service');
  if (answers && passportRequirements(answers).needsAuthority)
    throw new Error('Authority review required');
  if (memory!.some((c) => c.serviceId === serviceId)) return snapshot();
  return commit([
    ...memory!,
    {
      ...draft,
      id: crypto.randomUUID(),
      serviceId,
      kind,
      stage: requestStages[0],
      documents: draft.documents ?? [],
      due: '',
      created: new Date().toISOString(),
      appointment,
      ...(serviceId === 'passport' && answers
        ? { passportAnswers: answers, notApplicable: passportRequirements(answers).excluded }
        : {}),
    },
  ]);
}
export async function updateCase(id: string, patch: Partial<PersonalRequest>) {
  if (apiMode) {
    const payload = {
      ...patch,
      ...('appointment' in patch ? { appointment: patch.appointment ?? null } : {}),
    };
    await apiRequest(`cases/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return getCases();
  }
  await getCases();
  if (!memory!.some((c) => c.id === id)) throw new Error('Unknown case');
  return commit(
    memory!.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)),
  );
}
export async function getOffices(_serviceId: string) {
  if (apiMode)
    return apiRequest<typeof offices>(`services/${encodeURIComponent(_serviceId)}/offices`);
  await pause();
  return offices;
}
export async function getSlots(branchId: string, date: string) {
  if (apiMode) {
    if (!date || !branchId) return [];
    return apiRequest<string[]>(
      `appointment-slots?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`,
    );
  }
  await pause();
  if (
    !offices.some((o) => o.id === branchId) ||
    !validDate(date) ||
    new Date(date + 'T12:00:00Z').getUTCDay() === 0
  )
    return [];
  return ['09:00', '10:30', '12:00', '14:00'].filter((time) => futureAppointment({ date, time }));
}
export async function bookAppointment(
  serviceId: string,
  branchId: string,
  date: string,
  time: string,
): Promise<Appointment> {
  if (!services.some((s) => s.id === serviceId) || !(await getSlots(branchId, date)).includes(time))
    throw new Error('Slot unavailable');
  return {
    date,
    time,
    branchId,
    mode: 'demo',
    reference: `DEMO-${crypto.randomUUID().slice(0, 8)}`,
  };
}
export const defaultPreferences: Preferences = {
  savedServices: [],
  appointmentAlerts: true,
  expiryAlerts: true,
  incompleteAlerts: true,
  updateAlerts: true,
  readNotifications: [],
};
export function getPreferences(): Preferences {
  if (apiMode) return { ...defaultPreferences };
  try {
    const raw = JSON.parse(localStorage.getItem('lebflow-preferences') ?? '{}');
    return {
      ...defaultPreferences,
      ...Object.fromEntries(
        ['appointmentAlerts', 'expiryAlerts', 'incompleteAlerts', 'updateAlerts'].map((key) => [
          key,
          typeof raw?.[key] === 'boolean' ? raw[key] : true,
        ]),
      ),
      savedServices: Array.isArray(raw?.savedServices)
        ? raw.savedServices.filter((id: unknown) => services.some((s) => s.id === id))
        : [],
      readNotifications: Array.isArray(raw?.readNotifications)
        ? raw.readNotifications.filter((id: unknown) => typeof id === 'string').slice(-500)
        : [],
    };
  } catch {
    return { ...defaultPreferences };
  }
}
export function savePreferences(value: Preferences) {
  try {
    localStorage.setItem('lebflow-preferences', JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export type Notification = {
  id: string;
  serviceId: string;
  title: V1Key;
  date?: string;
  read: boolean;
};
export function getNotifications(cases: Case[], preferences: Preferences): Notification[] {
  const today = beirutNow().date;
  const soon = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
  const items: Notification[] = [];
  const add = (c: Case, title: V1Key, suffix: string, date?: string) => {
    const id = `${c.id}:${suffix}`;
    items.push({
      id,
      serviceId: c.serviceId,
      title,
      date,
      read: preferences.readNotifications.includes(id),
    });
  };
  for (const c of cases) {
    if (preferences.updateAlerts && c.updatedAt) add(c, 'updated', c.updatedAt);
    if (preferences.expiryAlerts && c.expiresOn && c.expiresOn <= soon)
      add(c, 'expiryNotice', `expiry:${c.expiresOn}`, c.expiresOn);
    if (c.stage === 'Completed') continue;
    if (
      preferences.appointmentAlerts &&
      c.appointment &&
      c.appointment.date >= today &&
      c.appointment.date <= soon
    )
      add(
        c,
        'appointmentNotice',
        `appointment:${c.appointment.date}:${c.appointment.time}`,
        c.appointment.date,
      );
    if (
      preferences.incompleteAlerts &&
      documentsFor(c.serviceId, c.kind ?? 'application').some(
        (d) => !c.notApplicable?.includes(d.id) && !c.documents?.includes(d.id),
      )
    )
      add(c, 'incompleteNotice', 'incomplete');
  }
  return items;
}
