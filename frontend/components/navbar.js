import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Bars3Icon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && router.pathname !== "/auth") {
      router.replace("/auth");
    } else {
      setIsLoggedIn(!!token);
      setAuthChecked(true);
      const email = localStorage.getItem("userEmail");
      setUserEmail(email || "");
    }
  }, [router]);

  const handleDashboard = () => {
    router.push(router.pathname === "/dashboard" ? "/" : "/dashboard");
  };

  const handleProfileToggle = () => setShowProfileMenu((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    router.replace("/auth");
  };

  if (!authChecked && router.pathname !== "/auth") {
    return (
      <div className="w-full bg-black text-white p-4 text-center font-medium">
        Checking authentication...
      </div>
    );
  }

  return (
    <header className="bg-black text-white px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Dashboard / Hamburger */}
      <button
        onClick={handleDashboard}
        className="focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
        aria-label="Dashboard"
      >
        <Bars3Icon className="h-7 w-7" />
      </button>

      {/* Logo / Title */}
      <h1
        className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase cursor-pointer select-none hover:text-indigo-400 transition-colors"
        onClick={() => router.push("/")}
      >
        Content Generator
      </h1>

      {/* Right Section: Auth / Profile */}
      {isLoggedIn ? (
        <div className="relative">
          <button
            onClick={handleProfileToggle}
            className="focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1 border border-gray-600 hover:border-indigo-500 transition"
            aria-label="Profile"
          >
            <UserCircleIcon className="h-8 w-8 text-gray-300" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
                <span className="text-sm text-gray-400 font-medium">Your Account</span>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Email */}
              {userEmail && (
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 truncate">
                  {userEmail}
                </div>
              )}

              {/* Links */}
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                onClick={() => setShowProfileMenu(false)}
              >
                View / Edit Profile
              </Link>
              <Link
                href="/profile#upload"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                onClick={() => setShowProfileMenu(false)}
              >
                Upload Profile Picture
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/auth"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition shadow-md"
        >
          Login / Signup
        </Link>
      )}
    </header>
  );
}
