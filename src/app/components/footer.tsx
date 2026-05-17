"use client";

import { usePathname } from "next/navigation";

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const footerLinks = {
  services: [
    { label: "Recherche de stage", href: "/recherche" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Tarifs", href: "#pricing" },
  ],
  entreprise: [
    { label: "À propos", href: "#" },
    { label: "Témoignages", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function Footer() {
  const pathname = usePathname();
  
  if (pathname === "/recherche" || pathname?.startsWith("/stage/") || pathname?.startsWith("/checkout/")) {
    return null;
  }

  return (
    <footer className="bg-[#1278CC] text-white pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span className="text-2xl font-extrabold text-white tracking-tight italic" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
              PermisAcceler
            </span>
            <p className="mt-4 text-sm text-white text-opacity-90 leading-relaxed">
              Votre permis de conduire en formation accéléré avec nos auto écoles partenaires
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="flex items-center justify-center h-11 w-11 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-110 transform text-[#1278CC] shadow-sm">
                <FacebookIcon />
              </a>
              <a href="#" className="flex items-center justify-center h-11 w-11 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-110 transform text-[#1278CC] shadow-sm">
                <InstagramIcon />
              </a>
              <a href="#" className="flex items-center justify-center h-11 w-11 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-110 transform text-[#1278CC] shadow-sm">
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Services</h3>
            <ul className="space-y-4">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-white text-opacity-80 hover:text-opacity-100 transition-all duration-200 font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Entreprise</h3>
            <ul className="space-y-4">
              {footerLinks.entreprise.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-white text-opacity-80 hover:text-opacity-100 transition-all duration-200 font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white border-opacity-20 pt-8 text-center text-sm text-white text-opacity-70">
          <p>&copy; {new Date().getFullYear()} PermisAcceler. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
