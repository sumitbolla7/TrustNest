const statusStyles = {
  active: 'bg-emerald-100 text-emerald-900', approved: 'bg-emerald-100 text-emerald-900',
  accepted: 'bg-emerald-100 text-emerald-900', applied: 'bg-emerald-100 text-emerald-900',
  pending: 'bg-amber-100 text-amber-950', 'in-review': 'bg-amber-100 text-amber-950',
  rejected: 'bg-red-100 text-red-900', suspended: 'bg-red-100 text-red-900',
  removed: 'bg-red-100 text-red-900',
};

export default function StatusBadge({ status }) {
  return <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ' + (statusStyles[status] ?? 'bg-slate-100 text-slate-800')}>{status.replaceAll('-', ' ')}</span>;
}
