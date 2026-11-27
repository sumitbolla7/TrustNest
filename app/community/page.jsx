import { upcomingServices } from '@/config/community';

export const metadata = { title: 'Community services | TrustNest', description: 'See the local jobs, trades and community services planned for TrustNest.' };

export default function CommunityPage() {
  return (
    <section className='mx-auto max-w-5xl px-6 py-14'>
      <h1 className='text-4xl font-bold text-brand-700'>Community services</h1>
      <p className='my-4'>Coming soon to TrustNest</p>
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {upcomingServices.map(service => (
          <li key={service} className='rounded-xl border border-emerald-100 bg-white p-5 font-semibold'>{service}</li>
        ))}
      </ul>
    </section>
  );
}
