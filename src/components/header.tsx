'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { href: '/upload', label: 'Upload Papers', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center">
        <div className="mr-6 flex items-center">
          <Link href="/" className="flex items-center gap-2">

            <span className="font-bold text-lg font-headline">Scholar Summarizer</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
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
          ))}
        </nav>
      </div>
    </header>
  );
}
