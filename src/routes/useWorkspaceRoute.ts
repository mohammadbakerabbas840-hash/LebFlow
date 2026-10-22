import { useEffect, useState } from 'react';
import type { Page } from '../types/navigation';
const pages: Page[] = ['explore', 'assistant', 'cases', 'appointments', 'reminders', 'account'];
function readRoute() {
  const base = import.meta.env.BASE_URL;
  const pathname = location.pathname.startsWith(base)
    ? location.pathname.slice(base.length)
    : location.pathname.replace(/^\//, '');
  const route =
    location.hash.replace(/^#\/?/, '').split('?')[0] ||
    (!pathname || pathname === 'index.html' ? 'explore' : pathname);
  if (route === 'services') return { page: 'explore' as const, selected: null };
  if (route.startsWith('services/')) return { page: 'explore' as const, selected: route.slice(9) };
  const parts = route.split('/');
  if (pages.includes(parts[0] as Page) && parts[1] === 'services' && parts.length === 3)
    return { page: parts[0] as Page, selected: parts[2] };
  return {
    page: pages.includes(route as Page) ? (route as Page) : ('notFound' as const),
    selected: null,
  };
}
export function useWorkspaceRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const changed = () => setRoute(readRoute());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  const go = (path: string) => {
    location.hash = `/${path}`;
    setRoute(readRoute());
  };
  return {
    ...route,
    caseId: new URLSearchParams(location.hash.split('?')[1]).get('case'),
    assistantService: new URLSearchParams(location.hash.split('?')[1]).get('service'),
    ask: (serviceId: string) => go(`assistant?service=${encodeURIComponent(serviceId)}`),
    navigate: (page: Page) => go(page),
    select: (id: string | null, caseId?: string) =>
      go(
        id
          ? `${route.page === 'notFound' ? 'explore' : route.page}/services/${id}${caseId ? '?case=' + encodeURIComponent(caseId) : ''}`
          : route.page === 'notFound'
            ? 'explore'
            : route.page,
      ),
  };
}
