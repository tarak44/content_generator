import { useRouter } from "next/router";
import Navbar from "./navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const router = useRouter();
  const hideNavbarOn = ["/auth"];
  const shouldHideNavbar = hideNavbarOn.includes(router.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      
      {/* Navbar */}
      {!shouldHideNavbar && <Navbar />}

      {/* Main Content */}
      <main className="flex-grow flex justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-7xl bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col min-h-[70vh]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
