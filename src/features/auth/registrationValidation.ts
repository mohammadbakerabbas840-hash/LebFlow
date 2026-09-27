import { beirutNow, validDate } from '../cases/caseStorage';
import type { MessageKey } from '../../i18n';
export type RegistrationFields = {
  name: string;
  nameArabic: string;
  dob: string;
  idNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
};
export type { Profile } from '../../types/user';
export type RegistrationErrors = Partial<
  Record<keyof RegistrationFields | 'idPhoto' | 'extract', MessageKey>
>;
export function validateRegistration(
  f: RegistrationFields,
  _files: { idPhoto: File | null; extract: File | null },
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (
    f.name.trim().length < 2 ||
    f.name.trim().length > 120 ||
    !/^[\p{Script=Latin}\p{M} .’'\-]+$/u.test(f.name)
  )
    errors.name = 'nameError';
  if (
    !f.nameArabic ||
    f.nameArabic.trim().length < 2 ||
    f.nameArabic.trim().length > 120 ||
    !/^[\p{Script=Arabic}\p{M} .’'\-]+$/u.test(f.nameArabic)
  )
    errors.nameArabic = 'nameError';
  if (!validDate(f.dob) || f.dob >= beirutNow().date || f.dob < '1900-01-01')
    errors.dob = 'dobError';
  if (f.idNumber.trim() && (f.idNumber.trim().length < 3 || f.idNumber.trim().length > 30))
    errors.idNumber = 'idError';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'emailError';
  if (f.password.length < 12) errors.password = 'passwordError';
  if (f.confirmPassword !== f.password) errors.confirmPassword = 'passwordMismatch';
  if (!f.consent) errors.consent = 'consentError';
  return errors;
}
export async function validateIdentityFile(
  file: File,
  allowPdf: boolean,
): Promise<MessageKey | null> {
  if (file.size === 0 || file.size > 5 * 1024 * 1024) return 'fileSize';
  const types = ['image/jpeg', 'image/png', 'image/webp', ...(allowPdf ? ['application/pdf'] : [])];
  if (!types.includes(file.type)) return 'fileType';
  try {
    const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const text = new TextDecoder().decode(b);
    const matches =
      file.type === 'image/jpeg'
        ? b[0] === 255 && b[1] === 216 && b[2] === 255
        : file.type === 'image/png'
          ? [137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => b[i] === x)
          : file.type === 'image/webp'
            ? text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP'
            : text.startsWith('%PDF-');
    return matches ? null : 'fileInvalid';
  } catch {
    return 'fileUnreadable';
  }
}
