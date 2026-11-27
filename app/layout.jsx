import { siteOrigin } from '@/utils/siteOrigin.mjs';
import '@fontsource-variable/inter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { ToastContainer } from 'react-toastify';
import { GlobalProvider } from '@/context/GlobalContext';
import '@/assets/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  metadataBase: new URL(siteOrigin()),
  title: 'TrustNest | Everything local. Built on trust.',
  description: 'Find rental listings and connect with local listing owners.',
  openGraph: { title: 'TrustNest — Irish rentals', description: 'Find your next home in Ireland.', siteName: 'TrustNest', locale: 'en_IE', type: 'website' },
  applicationName: 'TrustNest',
  keywords: ['Irish rentals', 'housing', 'TrustNest'],
};

const MainLayout = ({ children }) => {
  return (
    <html lang='en-IE'>
      <body>
        <GlobalProvider>
          <AuthProvider>
            <a href='#main-content' className='sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3'>Skip to content</a>
            <Navbar />
            <main id='main-content'>{children}</main>
            <Footer />
            <ToastContainer position='bottom-right' newestOnTop />
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
};
export default MainLayout;
