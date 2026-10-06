import { AlertTriangle } from 'lucide-react';

export default function AlertBanner({ children }) {
  if (!children) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-secondary">
      <AlertTriangle size={16} className="shrink-0" />
      <span>{children}</span>
    </div>
  );
}
