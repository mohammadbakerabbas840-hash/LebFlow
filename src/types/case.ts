import type { RequestKind, RequestStage } from '../data/serviceGuides';
export type Appointment = {
  date: string;
  time: string;
  branchId?: string;
  mode?: 'demo';
  reference?: string;
};
export type PersonalRequest = {
  familyMemberId?: string | null;
  applicantName?: string | null;
  applicantNameArabic?: string | null;
  archivedAt?: string | null;
  kind?: RequestKind;
  stage?: RequestStage;
  documents?: string[];
  notApplicable?: string[];
  due: string;
  expiresOn?: string;
  updatedAt?: string;
  appointment?: Appointment;
  passportAnswers?: import('../features/services/passportRequirements').PassportAnswers;
};
export type Case = PersonalRequest & { id: string; serviceId: string; created: string };
