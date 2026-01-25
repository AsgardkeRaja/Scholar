'use client';

import { useEffect, useState } from 'react';
import { type Paper } from '@/types';
import { PaperList } from '@/components/paper-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { getUserBookmarks, migrateLocalStorageBookmarks } from '@/lib/firestore-service';
import { useToast } from '@/hooks/use-toast';

function BookmarksContent() {
  const [bookmarks, setBookmarks] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function loadBookmarks() {
      if (!user) return;

      try {
        setLoading(true);

        // Check if there are localStorage bookmarks to migrate
        const localStorageBookmarks = localStorage.getItem('bookmarks');
        if (localStorageBookmarks) {
          try {
            const parsedBookmarks = JSON.parse(localStorageBookmarks);
            if (Array.isArray(parsedBookmarks) && parsedBookmarks.length > 0) {
              // Migrate to Firestore
              await migrateLocalStorageBookmarks(user.uid, parsedBookmarks);
              // Clear localStorage after successful migration
              localStorage.removeItem('bookmarks');

              toast({
                title: 'Bookmarks Migrated',
                description: `Successfully migrated ${parsedBookmarks.length} bookmarks to your account.`,
              });
            }
          } catch (error) {
            console.error('Error migrating bookmarks:', error);
          }
        }

        // Fetch bookmarks from Firestore
        const firestoreBookmarks = await getUserBookmarks(user.uid);
        setBookmarks(firestoreBookmarks);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load bookmarks. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    }

    loadBookmarks();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <section className="mb-8">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Bookmark className="w-10 h-10 text-primary" />
            My Bookmarks
          </h1>
          <p className="text-lg text-muted-foreground">
            Your saved articles for quick access.
          </p>
        </section>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <section className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Bookmark className="w-10 h-10 text-primary" />
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

export default function BookmarksPage() {
  return (
    <ProtectedRoute>
      <BookmarksContent />
    </ProtectedRoute>
  );
}
