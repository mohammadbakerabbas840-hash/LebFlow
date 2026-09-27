import { useState } from 'react';
import { getGuide } from '../../data/serviceGuides';
import { useI18n, localeTags } from '../../i18n';
import { useV1 } from '../../i18n/v1';
import type { Notification } from '../../services/client';
export function NotificationList({
  notifications,
  onRead,
  onSelect,
}: {
  notifications: Notification[];
  onRead: (ids: string[]) => void;
  onSelect: (id: string) => void;
}) {
  const { locale } = useI18n();
  const v = useV1();
  const [unread, setUnread] = useState(false);
  const list = notifications.filter((n) => !unread || !n.read);
  return (
    <section className="panel notifications">
      <h2>{v('notifications')}</h2>
      <div className="action-row">
        <button aria-pressed={!unread} onClick={() => setUnread(false)}>
          {v('allNotifications')}
        </button>
        <button aria-pressed={unread} onClick={() => setUnread(true)}>
          {v('unread')}
        </button>
        <button
          disabled={!notifications.some((n) => !n.read)}
          onClick={() => onRead(notifications.map((n) => n.id))}
        >
          {v('markAll')}
        </button>
      </div>
      {!list.length && <p>{v('noNotifications')}</p>}
      {list.map((n) => (
        <article className={`notification-item ${n.read ? 'read' : ''}`} key={n.id}>
          <button
            onClick={() => {
              onRead([n.id]);
              onSelect(n.serviceId);
            }}
          >
            <strong>{v(n.title)}</strong>
            <span>
              {getGuide(n.serviceId, locale).title}
              {n.date &&
                ` · ${new Intl.DateTimeFormat(localeTags[locale], { dateStyle: 'medium' }).format(new Date(n.date + 'T12:00:00'))}`}
            </span>
          </button>
          {!n.read && <button onClick={() => onRead([n.id])}>{v('markRead')}</button>}
        </article>
      ))}
    </section>
  );
}
