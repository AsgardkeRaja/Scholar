'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type Paper } from '@/types';
import { PaperList } from '@/components/paper-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';

export default function BookmarksPage() {
  const [bookmarks] = useLocalStorage<Paper[]>('bookmarks', []);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
       <section className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Bookmark className="w-10 h-10 text-primary"/>
          My Bookmarks
        </h1>
        <p className="text-lg text-muted-foreground">
          Your saved articles for quick access.
        </p>
      </section>

      {bookmarks.length > 0 ? (
        <PaperList papers={bookmarks} />
      ) : (
        <Card className="text-center border-dashed py-12">
          <CardHeader>
            <CardTitle>No Bookmarks Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your saved articles will appear here. Start by {' '}
              <Link href="/search" className="text-primary hover:underline">
                searching for papers
              </Link>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
