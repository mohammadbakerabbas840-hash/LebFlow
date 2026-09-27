import {
  ArrowUpRight,
  LayoutGrid,
  FolderOpen,
  Bell,
  ShieldCheck,
  TreePine,
  CalendarDays,
  UserRound,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Page } from '../../types/navigation';
type Props = {
  page: Page;
  mobileMenu: boolean;
  caseCount: number;
  appointmentCount: number;
  navigate: (page: Page) => void;
  onAbout: () => void;
};
export function Sidebar({
  page,
  mobileMenu,
  caseCount,
  appointmentCount,
  navigate,
  onAbout,
}: Props) {
  const { t } = useI18n();
  return (
    <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
      <a
        href="#"
        className="brand"
        dir="ltr"
        onClick={(e) => {
          e.preventDefault();
          navigate('explore');
        }}
      >
        <span className="brand-icon">
          <TreePine size={24} />
        </span>
        Leb<span>Flow</span>
        <span className="brand-dot">.</span>
      </a>
      <div className="workspace-label">{t('everyday')}</div>
      <nav aria-label={t('workspace')}>
        {(
          [
            { id: 'explore', icon: LayoutGrid },
            { id: 'cases', icon: FolderOpen },
            { id: 'appointments', icon: CalendarDays },
            { id: 'reminders', icon: Bell },
            { id: 'account', icon: UserRound },
          ] as const
        ).map(({ id, icon: Icon }) => (
          <button
            className={`nav-item ${page === id ? 'active' : ''}`}
            aria-current={page === id ? 'page' : undefined}
            key={id}
            onClick={() => navigate(id)}
          >
            <Icon size={19} />
            {t(id)}
            {id === 'cases' && <span className="count">{caseCount}</span>}
            {id === 'appointments' && appointmentCount > 0 && (
              <span className="count">{appointmentCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-guide">
        <div className="guide-icon">
          <ShieldCheck size={23} />
        </div>
        <h3>{t('clearer')}</h3>
        <p>{t('madeFor')}</p>
        <button onClick={() => onAbout()}>
          {t('about')} <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="sidebar-bottom">
        <span className="lebanon-dot" />
        {t('built')}
        <span className="version">v0.2</span>
      </div>
    </aside>
  );
}
