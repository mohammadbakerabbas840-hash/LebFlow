import { useV1 } from '../i18n/v1';
export function NotFoundPage({ onHome }: { onHome: () => void }) {
  const v = useV1();
  return (
    <section className="empty-state">
      <h1>404</h1>
      <h2>{v('notFound')}</h2>
      <button className="primary" onClick={onHome}>
        {v('home')}
      </button>
    </section>
  );
}
