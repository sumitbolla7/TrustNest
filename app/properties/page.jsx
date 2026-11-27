import RentalCatalogue from '@/components/RentalCatalogue';

export const metadata = { title: 'Find a home | TrustNest', description: 'Browse Irish rentals by county, monthly rent, furnishing and availability.', alternates: { canonical: '/properties' } };

export default function PropertiesPage({ searchParams }) {
  return <RentalCatalogue searchParams={searchParams} />;
}
