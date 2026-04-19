import type { ReactNode } from 'react';
import type { BatchStatus, Buyer } from '../../types';
import { cn } from '../../utils/cn';
import { industryLabel, statusLabel } from '../../utils/format';

const industryClasses: Record<Buyer['industry_type'], string> = {
  cement: 'bg-gray-200 text-gray-800',
  plaster: 'bg-blue-100 text-blue-800',
  fertilizer: 'bg-green-100 text-green-800',
  construction: 'bg-orange-100 text-orange-800',
  'recycling startup': 'bg-purple-100 text-purple-800',
};

const statusClasses: Record<BatchStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-orange-100 text-orange-700',
  closed: 'bg-green-100 text-green-700',
};

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function IndustryBadge({ industry }: { industry: Buyer['industry_type'] }) {
  return <Badge className={industryClasses[industry]}>{industryLabel(industry)}</Badge>;
}

export function StatusBadge({ status }: { status: BatchStatus }) {
  return <Badge className={statusClasses[status]}>{statusLabel(status)}</Badge>;
}
