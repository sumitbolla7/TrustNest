import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Find a home | TrustNest' };

export default function PropertiesPage({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} />;
}
