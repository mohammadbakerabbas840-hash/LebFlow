import { Bell, ChevronRight, Menu, UserRound } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import type { Page } from '../../types/navigation';
type Props = {
  page: Page;
  mobileMenu: boolean;
  reminderCount: number;
  hasProfile: boolean;
  navigate: (page: Page) => void;
  onToggleMenu: () => void;
};
export function Topbar({
  page,
  mobileMenu,
  reminderCount,
  hasProfile,
  navigate,
  onToggleMenu,
}: Props) {
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="mobile-toggle"
          aria-label={t('menu')}
          aria-expanded={mobileMenu}
          onClick={() => onToggleMenu()}
        >
          <Menu size={22} />
        </button>
        <span>{t('workspace')}</span>
        <ChevronRight className="directional" size={14} />
        <strong>{t(page)}</strong>
      </div>
      <div className="header-actions">
        <LanguageSwitcher />
        <button
          className="notification-button"
          aria-label={t('reminders')}
          onClick={() => navigate('reminders')}
        >
          <Bell size={19} />
          {reminderCount > 0 && <i />}
        </button>
        <button className="account-button" onClick={() => navigate('account')}>
          <UserRound size={17} />
          <span>{t(hasProfile ? 'account' : 'register')}</span>
        </button>
      </div>
    </header>
  );
}
