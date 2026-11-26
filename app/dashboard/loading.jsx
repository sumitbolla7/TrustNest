export default function DashboardLoading() {
  return <section className='mx-auto max-w-7xl px-4 py-10' role='status'><h1 className='text-2xl font-bold'>Loading dashboard…</h1><div className='mt-5 grid gap-4 md:grid-cols-2' aria-hidden>{[1,2,3,4].map(item => <div key={item} className='h-32 rounded-xl bg-slate-200' />)}</div></section>;
}
