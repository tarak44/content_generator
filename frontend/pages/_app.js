import '@/styles/globals.css';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token && router.pathname !== '/auth') {
      router.replace('/auth');
    } else {
      setCheckedAuth(true);
    }
  }, [router]);

  // Show loader while checking auth (optional, improves UX)
  if (!checkedAuth && router.pathname !== '/auth') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
