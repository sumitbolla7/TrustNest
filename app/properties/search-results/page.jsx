import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Rental search | TrustNest', description: 'Filter and compare Irish rental listings.', alternates: { canonical: '/properties' } };

export default function SearchResults({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} />;
}
