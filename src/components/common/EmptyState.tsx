import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={40} />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
