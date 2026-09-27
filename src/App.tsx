import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import './v1.css';
import { I18nProvider } from './i18n';
import { Workspace } from './components/layout/Workspace';
import './styles.css';
import './features.css';
import './release.css';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { apiMode } from './services/backend';

function AccountWorkspace() {
  const { user } = useAuth();
  return <Workspace key={apiMode ? (user?.id ?? 'guest') : 'demo'} />;
}

export { Workspace };
export default function App() {
  return (
    <I18nProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <AccountWorkspace />
        </AuthProvider>
      </AppErrorBoundary>
    </I18nProvider>
  );
}
