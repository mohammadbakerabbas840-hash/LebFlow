declare const __LEBFLOW_API__: boolean;
export const apiMode = typeof __LEBFLOW_API__ !== 'undefined' && __LEBFLOW_API__;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}
let csrf: Promise<void> | null = null;
function csrfToken() {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith('XSRF-TOKEN='))
    ?.slice(11);
}
function refreshCsrf() {
  csrf ??= fetch('/sanctum/csrf-cookie', {
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (response.status !== 204)
        throw new ApiError(
          response.ok ? 502 : response.status,
          'Unable to initialize secure session.',
        );
    })
    .finally(() => {
      csrf = null;
    });
  return csrf;
}

async function sendRequest<T>(path: string, options: RequestInit): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (unsafe && !csrfToken()) await refreshCsrf();

  for (let attempt = 0; ; attempt++) {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body && !(options.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    const token = csrfToken();
    if (unsafe && token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
    const response = await fetch(`/api/v1/${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual',
    });
    if (response.type === 'opaqueredirect')
      throw new ApiError(409, 'Your session changed. Reload this page and try again.');
    // Laravel rejects CSRF failures before executing the action. Retry only that failure, once.
    if (unsafe && response.status === 419 && attempt === 0) {
      await response.text();
      await refreshCsrf();
      continue;
    }
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new ApiError(
        response.ok ? 502 : response.status,
        'The server is unavailable. Please try again.',
      );
    const data = await response.json().catch(() => {
      throw new ApiError(502, 'The server returned an invalid response. Please try again.');
    });
    if (!response.ok)
      throw new ApiError(response.status, data.message ?? 'Request failed.', data.errors ?? {});
    return data.data ?? data;
  }
}

let sessionChange: Promise<unknown> = Promise.resolve();
const pending = new Set<Promise<unknown>>();
export function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const changesSession =
    (method === 'POST' && /^auth\/(register|login|logout|mfa)$/.test(path)) ||
    (method === 'PUT' && path === 'me/password');
  // Finish earlier responses before rotating the session cookie, and hold new requests until
  // rotation finishes. Otherwise a late account response can overwrite the new session cookie.
  const dependencies = changesSession ? [sessionChange, ...pending] : [sessionChange];
  const request = Promise.allSettled(dependencies).then(() => sendRequest<T>(path, options));
  if (changesSession) sessionChange = request;
  pending.add(request);
  void request.then(
    () => pending.delete(request),
    () => pending.delete(request),
  );
  return request;
}
export type ServerUser = {
  id: number;
  name: string;
  email: string;
  dob: string;
  idNumberMasked: string;
  locale: 'en' | 'ar' | 'fr';
  identityVerified: false;
  nameArabic?: string | null;
  documents: {
    id: string;
    kind: string;
    mime: string;
    size: number;
    scanStatus?: string;
    downloadAvailable?: boolean;
    reviewReason?: string | null;
    reviewStatus?: string;
  }[];
};
