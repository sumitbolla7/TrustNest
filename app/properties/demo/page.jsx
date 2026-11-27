import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Sample rentals | TrustNest', description: 'Explore fictional rentals created for the TrustNest academic demo.', robots: { index: false, follow: false } };

export default function SampleRentals({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} sample />;
}
