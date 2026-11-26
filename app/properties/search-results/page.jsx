import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Rental search | TrustNest' };

export default function SearchResults({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} />;
}
