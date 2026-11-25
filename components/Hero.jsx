import PropertySearchForm from './PropertySearchForm';

const Hero = () => {
  return (
    <section className='bg-gradient-to-br from-brand-800 to-brand-700 py-16 sm:py-24 mb-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'>
        <div className='text-center'>
          <h1 className='text-4xl font-extrabold text-white sm:text-5xl md:text-6xl'>
            Find your next home in Ireland
          </h1>
          <p className='my-4 text-xl text-brand-400'>
            Everything local. Built on trust.
          </p>
        </div>
        <PropertySearchForm />
      </div>
    </section>
  );
};
export default Hero;
