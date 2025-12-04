'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clearSession, getSession } from '@/lib/session';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getSession());
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  const navLinks = isLoggedIn
    ? [
        { href: '/feed', label: 'Feed' },
        { href: '/upload', label: 'Upload' },
        { href: '/members', label: 'Members' },
        { href: '/profile', label: 'Profile' },
      ]
    : [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/images/supabase-dsm-logo.png" 
              alt="Supabase Des Moines" 
              width={140}
              height={40}
              priority
            />
            <div className="text-2xl font-bold text-gray-800">The Wall</div>
          </Link>

          {isLoggedIn && (
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-supabase'
                      : 'text-gray-700 hover:text-supabase'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
