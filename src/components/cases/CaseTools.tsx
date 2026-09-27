import { useCallback, useState } from 'react';
import { L, useI18n } from '../../i18n';
import { getGuide, requestStages } from '../../data/serviceGuides';
import { stageTranslations } from '../../data/serviceContent';
import { apiMode, apiRequest } from '../../services/backend';
import type { Case } from '../../types/case';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { appointmentCalendar, downloadCalendar } from '../../utils/calendar';
import { ErrorState } from '../common/ResourceState';
export function CaseTools({ request, onArchived }: { request: Case; onArchived: () => void }) {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const [confirm, setConfirm] = useState(false);
  const action = useAction();
  const history = useResource(
    useCallback(
      () =>
        apiMode
          ? apiRequest<{ id: number; type: string; value: string; created_at: string }[]>(
              `cases/${request.id}/history`,
            )
          : Promise.resolve([]),
      [request.id, request.updatedAt],
    ),
  );
  return (
    <section className="case-tools">
      <div className="action-row">
        <button onClick={() => window.print()}>
          {text('Print checklist', 'طباعة قائمة المستندات', 'Imprimer la liste')}
        </button>
        {request.appointment && (
          <button
            onClick={() =>
              downloadCalendar(
                appointmentCalendar(
                  request.id,
                  getGuide(request.serviceId, locale).title,
                  request.appointment!,
                ),
              )
            }
          >
            {text(
              'Add planned visit to calendar',
              'إضافة الزيارة المخطّطة إلى التقويم',
              'Ajouter la visite prévue au calendrier',
            )}
          </button>
        )}
        {apiMode && (
          <button onClick={() => setConfirm(!confirm)}>
            {text('Archive application', 'أرشفة الطلب', 'Archiver le dossier')}
          </button>
        )}
      </div>
      {confirm && (
        <div className="info-note">
          <p>
            {text(
              'Archiving makes this application read-only and lets you start another one. The archive remains in your account.',
              'تجعل الأرشفة هذا الطلب للقراءة فقط وتتيح لك بدء طلب جديد. يبقى الطلب المؤرشف في حسابك.',
              'L’archivage rend ce dossier accessible en lecture seule et permet une nouvelle demande. Il reste disponible dans votre compte.',
            )}
          </p>
          <button
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await apiRequest(`cases/${request.id}/archive`, { method: 'POST' });
                onArchived();
              })
            }
          >
            {text('Confirm archive', 'تأكيد الأرشفة', 'Confirmer l’archivage')}
          </button>
        </div>
      )}
      {!!history.data?.length && (
        <details>
          <summary>{text('Case history', 'سجل الطلب', 'Historique du dossier')}</summary>
          <ol>
            {history.data.map((event) => (
              <li key={event.id}>
                <bdi>{event.created_at}</bdi> —{' '}
                {event.type === 'requirements_updated'
                  ? text(
                      'Requirements changed. Review the latest guide.',
                      'تغيّرت المتطلّبات. راجع الدليل المحدّث.',
                      'Les exigences ont changé. Consultez le guide actualisé.',
                    )
                  : (stageTranslations[
                      requestStages.indexOf(event.value as (typeof requestStages)[number])
                    ]?.[locale] ?? event.value)}
              </li>
            ))}
          </ol>
        </details>
      )}
      {history.error && <ErrorState retry={history.retry} />}
      {action.message && <p role={action.failed ? 'alert' : 'status'}>{action.message}</p>}
    </section>
  );
}
