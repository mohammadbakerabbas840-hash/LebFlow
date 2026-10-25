import { ApiError } from '../../services/backend';
import type { useBackendText } from '../../i18n/backend';

export function authErrorMessage(
  error: unknown,
  text: ReturnType<typeof useBackendText>,
  form: 'login' | 'register' | 'mfa',
): string {
  if (!(error instanceof ApiError)) return text('connectionError');
  if (error.status === 419 || error.status === 401) return text('sessionExpired');
  if (error.status === 409) return text('sessionChanged');
  if (error.status === 429) return text('tooManyAttempts');
  if (error.status >= 500) return text('serverUnavailable');
  if (error.status === 422) {
    if (form === 'login') return text('invalidCredentials');
    if (form === 'mfa') return text('invalidMfa');
    if (error.errors.email?.some((message) => message.includes('already been taken')))
      return text('emailTaken');
    return Object.values(error.errors).flat()[0] ?? text('error');
  }
  return text('error');
}
