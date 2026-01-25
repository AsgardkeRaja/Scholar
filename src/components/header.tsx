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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="mr-2 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-lg font-headline">Scholar Summarizer</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => {
              // Hide auth-required links if not authenticated
              if (link.authRequired && !user) return null;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'transition-colors hover:text-primary flex items-center gap-1.5',
                    pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground'
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
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <UserDropdown />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
