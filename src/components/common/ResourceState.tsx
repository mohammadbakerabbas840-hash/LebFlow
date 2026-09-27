import { useV1 } from '../../i18n/v1';
export function LoadingState() {
  const v = useV1();
  return (
    <div role="status" className="loading-state">
      <p>{v('loading')}</p>
      {[1, 2, 3].map((x) => (
        <div key={x} className="skeleton" />
      ))}
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  const v = useV1();
  return (
    <div role="alert" className="empty-state">
      <h2>{v('error')}</h2>
      <button className="primary" onClick={retry}>
        {v('retry')}
      </button>
    </div>
  );
}
