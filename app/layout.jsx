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
  keywords: 'rental, find rentals, find properties',
};

const MainLayout = ({ children }) => {
  return (
    <GlobalProvider>
      <AuthProvider>
        <html lang='en-IE'>
          <body>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ToastContainer />
          </body>
        </html>
      </AuthProvider>
    </GlobalProvider>
  );
};
export default MainLayout;
