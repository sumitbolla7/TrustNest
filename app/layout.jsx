import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { ToastContainer } from 'react-toastify';
import { GlobalProvider } from '@/context/GlobalContext';
import '@/assets/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import 'photoswipe/dist/photoswipe.css';

export const metadata = {
  title: 'TrustNest | Everything local. Built on trust.',
  description: 'Find rental listings and connect with local listing owners.',
  applicationName: 'TrustNest',
  keywords: ['Irish rentals', 'housing', 'TrustNest'],
};

const MainLayout = ({ children }) => {
  return (
    <html lang='en-IE'>
      <body>
        <GlobalProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ToastContainer />
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
};
export default MainLayout;
