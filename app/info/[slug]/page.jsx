import Link from 'next/link';
import { notFound } from 'next/navigation';
import RentalSafety from '@/components/RentalSafety';

const pages = {
  about: { title: 'About TrustNest', lines: ['TrustNest is an Irish rental marketplace developed for the National College of Ireland Secure Web Development module.', 'Housing is the current service. Jobs, tradespeople, student services and local directories are planned.'] },
  contact: { title: 'Contact and support', lines: ['Use the help centre for account and rental questions. For a particular rental, open the listing to contact its landlord or submit a private report.', 'If money has been sent to a suspected scammer, contact your bank and use the official reporting guidance.'] },
  faq: { title: 'Frequently asked questions', lines: ['How do I arrange a viewing? Sign in as a tenant, open a live rental and submit a preferred date and time.', 'How do I publish a rental? Register as a landlord, save the details and submit the listing for review.', 'What does TrustNest verification mean? It is a platform review. It does not certify ownership or guarantee a transaction.'] },
  safety: { title: 'Rental safety in Ireland', lines: ['Keep conversations on the platform where possible. Treat requests to pay before viewing or unusually low rents with caution.'] },
  guide: { title: 'How TrustNest works', lines: ['Search by county, town and monthly rent. Save suitable rentals or enquire from the listing page.', 'Landlords submit listings for moderation and manage enquiries and requests from their dashboards.'] },
  privacy: { title: 'Draft privacy policy', lines: ['Academic draft requiring review before commercial launch.', 'Accounts, preferences, private messages, viewing requests and reports are stored in the dedicated TrustNest database. Public listings omit exact address details and contact information.', 'Account deletion disables sign-in and removes account credentials and identifying profile fields. Existing conversations and moderation records may remain for other participants and accountability. A production retention policy is pending.'] },
  terms: { title: 'Draft terms and conditions', lines: ['Academic draft requiring review before commercial launch.', 'Use the platform lawfully. Post only accommodation you have authority to let and give accurate information.', 'TrustNest does not process rent or deposits. Sample properties are fictional and unavailable for reservations.'] },
  cookies: { title: 'Cookie information', lines: ['Academic draft requiring review before commercial launch.', 'TrustNest uses authentication, session and request-protection cookies needed for account features. The demo does not configure advertising cookies.'] },
  help: { title: 'Help centre', lines: ['Use Sign in or Register to access your dashboard. If account email is configured, use Forgot password or Resend verification from the account page.', 'Use your dashboard to review enquiries, viewing requests, reports and notification settings.'] },
};

export default async function InformationPage({ params }) {
  const { slug } = await params;
  if (!Object.hasOwn(pages, slug)) notFound();
  const page = pages[slug];
  const support = process.env.TRUSTNEST_SUPPORT_EMAIL;
  return <article className='mx-auto max-w-3xl space-y-5 px-4 py-12'>
    <h1 className='text-3xl font-bold text-brand-800'>{page.title}</h1>
    {page.lines.map(line => <p key={line} className='leading-relaxed'>{line}</p>)}
    {slug === 'safety' && <RentalSafety />}
    {slug === 'contact' && support && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support) && <a href={'mailto:' + support} className='text-brand-700 underline'>Email TrustNest support</a>}
    <nav aria-label='Related help' className='flex flex-wrap gap-4 text-brand-700 underline'><Link href='/info/help'>Help centre</Link><Link href='/info/faq'>FAQs</Link><Link href='/info/safety'>Rental safety</Link></nav>
  </article>;
}
