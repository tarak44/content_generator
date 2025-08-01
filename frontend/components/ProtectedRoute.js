import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && router.pathname !== "/auth") {
      router.replace("/auth");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked && router.pathname !== "/auth") {
    return null; // Don't render until checked, prevents hydration issues
  }

  return children;
}
