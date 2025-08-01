export default function Footer() {
  return (
    <footer className="bg-black text-white text-center text-sm py-4 px-6 border-t border-gray-700 select-none">
      <p className="mb-2">&copy; 2025 Content Generator. All rights reserved.</p>
      {/* Optional social links placeholder */}
      <div className="flex justify-center space-x-6 text-gray-400">
        {/* You can replace these with real icons & links */}
        <a
          href="#"
          className="hover:text-white transition-colors duration-200"
          aria-label="Twitter"
          tabIndex={0}
        >
          Twitter
        </a>
        <a
          href="#"
          className="hover:text-white transition-colors duration-200"
          aria-label="GitHub"
          tabIndex={0}
        >
          GitHub
        </a>
        <a
          href="#"
          className="hover:text-white transition-colors duration-200"
          aria-label="LinkedIn"
          tabIndex={0}
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
