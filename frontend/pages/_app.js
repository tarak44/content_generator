import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (router.pathname !== "/auth") {
          router.replace("/auth");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Loading screen (UX friendly)
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p className="text-lg animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  // Don't wrap auth page inside Layout
  if (router.pathname === "/auth") {
    return <Component {...pageProps} />;
  }

  // Wrap all other pages with Layout
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
