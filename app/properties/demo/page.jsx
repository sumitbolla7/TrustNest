import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Sample rentals | TrustNest' };

export default function SampleRentals({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} sample />;
}
