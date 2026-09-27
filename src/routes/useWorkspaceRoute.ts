import { useEffect, useState } from 'react';
import type { Page } from '../types/navigation';
const pages: Page[] = ['explore', 'cases', 'appointments', 'reminders', 'account'];
function readRoute() {
  const route =
    location.hash.replace(/^#\/?/, '').split('?')[0] ||
    (location.pathname === '/' ? 'explore' : location.pathname.slice(1));
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
