import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

export default function DashboardShell({ title, links, children }) {
  return <div className='mx-auto max-w-screen-2xl px-4 py-7 sm:px-8 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7'>
    <aside className='mb-5 min-w-0 lg:mb-0'>
      <nav aria-label={title + ' sections'} className='tn-panel p-3 lg:sticky lg:top-5'>
        <p className='mb-2 flex items-center gap-2 px-2 text-sm font-bold text-slate-900'><LayoutGrid size={16} /> {title}</p>
        <div className='flex flex-wrap gap-1 lg:grid'>{links.map(([href, label]) => (
          <Link key={href} href={href} className='rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-brand-700'>{label}</Link>
        ))}</div>
      </nav>
    </aside>
    <div className='min-w-0'>{children}</div>
  </div>;
}
