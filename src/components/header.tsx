'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, Search, Bookmark, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { UserDropdown } from '@/components/user-dropdown';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const navLinks = [
    { href: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { href: '/upload', label: 'Upload Papers', icon: <Upload className="w-4 h-4" /> },
    { href: '/bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-4 h-4" />, authRequired: true },
  ];

  return (
    <header className="sticky top-4 z-50 mx-auto w-[95%] max-w-7xl">
      <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-black/20 px-6 backdrop-blur-2xl transition-all duration-300 hover:bg-black/35 hover:border-white/15">
        <div className="flex items-center gap-6">
          <div className="mr-2 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-bold text-lg font-headline gradient-text transition-opacity group-hover:opacity-80">
                The research
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-5 text-sm font-medium">
            {navLinks.map((link) => {
              // Hide auth-required links if not authenticated
              if (link.authRequired && !user) return null;

              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200',
                    isActive
                      ? 'text-primary-foreground bg-primary/90 font-semibold shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <UserDropdown />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-primary/90 text-primary-foreground hover:bg-primary shadow-md shadow-primary/20">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
