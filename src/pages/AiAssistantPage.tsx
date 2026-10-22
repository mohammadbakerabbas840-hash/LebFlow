import { MessageCircle } from 'lucide-react';
import { AiAssistant } from '../components/services/AiAssistant';
import { EmptyState } from '../components/common/EmptyState';
import { apiMode } from '../services/backend';
import { services } from '../data/services';
import { L, useI18n } from '../i18n';
import type { Page } from '../types/navigation';

export function AiAssistantPage({
  serviceId,
  navigate,
}: {
  serviceId?: string;
  navigate: (page: Page) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="assistant-page">
      {apiMode ? (
        <AiAssistant
          presentation="page"
          serviceId={services.some((service) => service.id === serviceId) ? serviceId : undefined}
          onSignIn={() => navigate('account')}
        />
      ) : (
        <EmptyState
          icon={MessageCircle}
          title={
            L(
              'Chat in the connected app',
              'المحادثة في النسخة المتصلة',
              'Discutez dans la version connectée',
            )[locale]
          }
          description={
            L(
              'AI chat is available when LebFlow is connected to its server. You can explore the service guides in this demo.',
              'تتوفر المحادثة مع المساعد عند اتصال LebFlow بالخادم. يمكنك تصفّح أدلة الخدمات في هذه النسخة التجريبية.',
              'La conversation avec l’assistant est disponible lorsque LebFlow est connecté au serveur. Vous pouvez consulter les guides dans cette démonstration.',
            )[locale]
          }
        >
          <button className="primary" onClick={() => navigate('explore')}>
            {t('explore')}
          </button>
        </EmptyState>
      )}
    </div>
  );
}
