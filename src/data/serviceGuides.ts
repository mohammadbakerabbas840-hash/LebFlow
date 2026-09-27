import { getGuide, serviceContent } from './serviceContent';
import type { Locale } from '../i18n';
export { getGuide, serviceContent } from './serviceContent';
export const requestStages = [
  'Preparing documents',
  'Ready to submit',
  'Appointment',
  'Submitted',
  'Processing',
  'Completed',
] as const;
export type RequestStage = (typeof requestStages)[number];
export type RequestKind = 'application' | 'renewal';
export type ServiceGuide = ReturnType<typeof getGuide>;
export type DocumentItem = ServiceGuide['documents'][number];
export const guides = Object.fromEntries(
  Object.keys(serviceContent).map((id) => [id, getGuide(id)]),
);
export const conditionalDocuments: Record<string, string[]> = {
  birth: [],
  family: [],
  marriage: [],
  passport: ['guardian'],
  police: ['authorization', 'residence', 'employer'],
  driving: [],
  civil: [],
  identity: ['residence', 'loss'],
  university: ['translation'],
  municipality: ['property', 'plans', 'planning', 'valuation'],
  professional: ['qualification', 'membership', 'practice'],
};
export function documentsFor(id: string, kind: RequestKind, locale: Locale = 'en') {
  return getGuide(id, locale).documents.filter(
    (d) => (!d.renewalOnly || kind === 'renewal') && (!d.applicationOnly || kind === 'application'),
  );
}
