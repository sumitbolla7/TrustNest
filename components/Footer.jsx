import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-emerald-100 py-8 mt-16'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between px-4'>
        <div className='mb-4 md:mb-0'>
          <Image src='/icon.svg' width={32} height={32} alt='TrustNest' unoptimized className='h-8 w-auto' />
        </div>

        <Link href="/properties/demo" className="text-brand-700 underline">Sample rentals</Link>
        <Link href="/community" className="text-brand-700 underline">Community services</Link>
        <div>
          <p className='text-sm text-gray-500 mt-2 md:mt-0'>
            &copy; {currentYear} TrustNest. Everything local. Built on trust.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
