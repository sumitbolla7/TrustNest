export default function LoadingRentals() {
  return <section className='mx-auto max-w-7xl px-4 py-10 sm:px-8' role='status'>
    <h1 className='text-2xl font-bold'>Loading rentals…</h1>
    <div className='mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3' aria-hidden>{[1, 2, 3].map(item => <div key={item} className='overflow-hidden rounded-xl border bg-white'><div className='aspect-video bg-slate-200' /><div className='space-y-3 p-5'><div className='h-4 w-2/3 rounded bg-slate-200' /><div className='h-4 w-1/2 rounded bg-slate-100' /></div></div>)}</div>
  </section>;
}
