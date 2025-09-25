import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token && router.pathname !== "/auth") {
      // Delay the redirect slightly for smoother UX
      setTimeout(() => router.replace("/auth"), 100);
    } else {
      setIsAuthChecked(true);
    }
  }, [router]);

  if (!isAuthChecked && router.pathname !== "/auth") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        <p className="ml-4 text-lg font-medium">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
