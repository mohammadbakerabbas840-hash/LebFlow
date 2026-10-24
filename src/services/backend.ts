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
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (unsafe && !document.cookie.split('; ').some((c) => c.startsWith('XSRF-TOKEN='))) {
    csrf ??= fetch('/sanctum/csrf-cookie', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((r) => {
        if (r.status !== 204)
          throw new ApiError(r.ok ? 502 : r.status, 'Unable to initialize secure session.');
      })
      .finally(() => {
        csrf = null;
      });
    await csrf;
  }
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const token = document.cookie
    .split('; ')
    .find((c) => c.startsWith('XSRF-TOKEN='))
    ?.slice(11);
  if (unsafe && token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
  const response = await fetch(`/api/v1/${path}`, { ...options, headers, credentials: 'include' });
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
