import { useRouter } from 'next/router';
import Navbar from './navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();
  const hideNavbarOn = ["/auth"];
  const shouldHideNavbar = hideNavbarOn.includes(router.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {!shouldHideNavbar && <Navbar />}
      <main className="flex-grow container mx-auto p-6 bg-gray-900 text-white rounded-lg mt-4 shadow-md">
        {children}
      </main>
      <Footer />
    </div>
  );
}
