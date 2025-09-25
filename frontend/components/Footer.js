import { Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white select-none relative">
      {/* Accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

      <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Copyright */}
        <p className="text-sm text-gray-400">
          &copy; 2025 Content Generator. All rights reserved.
        </p>

        {/* Social Links */}
        <div className="flex space-x-6">
          <a
            href="#"
            className="text-gray-400 hover:text-indigo-500 transition-colors duration-300"
            aria-label="Twitter"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-blue-500 transition-colors duration-300"
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
