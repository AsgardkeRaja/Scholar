'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { type Paper } from '@/types';
import { searchPapersAction, suggestPapersAction, type SearchPapersActionParams } from '@/app/actions';
import { SearchBar } from '@/components/search-bar';
import { PaperList } from '@/components/paper-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Lightbulb, Loader2, Sparkles, Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { LiteratureReviewDialog } from '@/components/literature-review-dialog';
import { useToast } from '@/hooks/use-toast';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

// All available columns for quick review
const ALL_COLUMNS = [
  'Abstract Summary',
  'Results',
  'Limitations',
  'Methods Used',
  'Research Gap',
  'Contribution',
  'Future Work',
  'Key Findings',
];

export default function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [isFetchingMore, startFetchingMoreTransition] = useTransition();
  const [isQuickReviewPending, startQuickReviewTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Paper[]>([]);
  const [suggestions, setSuggestions] = useState<Paper[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  const [currentQuery, setCurrentQuery] = useState('');
  const [currentYearFilter, setCurrentYearFilter] = useState<number | undefined>();

  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [isReviewDialogOpen, setReviewDialogOpen] = useState(false);

  const selectedPapers = useMemo(() => {
    return results.filter(p => selectedPaperIds.has(p.paperId));
  }, [results, selectedPaperIds]);

  const handleSelectionChange = (paperId: string, isSelected: boolean) => {
    setSelectedPaperIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(paperId);
      } else {
        newSet.delete(paperId);
      }
      return newSet;
    });
  };

  const runSearch = useCallback(async (params: SearchPapersActionParams, isNewSearch: boolean) => {
    const transition = isNewSearch ? startTransition : startFetchingMoreTransition;

    transition(async () => {
      if (isNewSearch) {
        setError(null);
        setSuggestions([]);
        setSelectedPaperIds(new Set());
      }

      const searchResult = await searchPapersAction(params);

      if (searchResult.error) {
        setError(searchResult.error);
        if (isNewSearch) setResults([]);
        return;
      }

      const papers = searchResult.papers || [];

      if (isNewSearch) {
        setResults(papers);
      } else {
        // Filter out duplicates before appending
        const newPapers = papers.filter(p => !results.some(r => r.paperId === p.paperId));
        setResults(prev => [...prev, ...newPapers]);
      }

      setOffset(params.offset! + 10);
      setHasMore(papers.length > 0);

      // Fetch suggestions only on a new search with results
      if (isNewSearch && papers.length > 0) {
        const suggestionInput = {
          searchQuery: params.query,
          searchResults: papers.map(p => ({ title: p.title, abstract: p.abstract || '' })),
          numSuggestions: 3,
        };
        const suggestionResult = await suggestPapersAction(suggestionInput, papers);
        if (suggestionResult.error) {
          console.warn('Could not fetch suggestions:', suggestionResult.error);
          setSuggestions([]);
        } else {
          setSuggestions(suggestionResult.papers || []);
        }
      }
    });
  }, [results]);

  const handleSearch = (query: string) => {
    if (!query) {
      setResults([]);
      setSuggestions([]);
      setError(null);
      setOffset(0);
      setCurrentQuery('');
      setHasMore(false);
      setSelectedPaperIds(new Set());
      return;
    }
    setCurrentQuery(query);
    setOffset(0); // Reset for new search
    setResults([]); // Clear previous results
    runSearch({ query, year: currentYearFilter, offset: 0 }, true);
  };

  const handleQuickReview = (query: string) => {
    if (!query) return;

    startQuickReviewTransition(async () => {
      toast({
        title: 'Generating Quick Review',
        description: 'Searching for the most relevant papers...',
      });

      // Search for papers
      const searchResult = await searchPapersAction({ query, offset: 0 });

      if (searchResult.error) {
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: searchResult.error,
        });
        return;
      }

      const papers = searchResult.papers || [];

      if (papers.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Papers Found',
          description: 'No papers found for this query. Try a different search term.',
        });
        return;
      }

      // Select top 5-6 papers (prioritize those with abstracts)
      const papersWithAbstracts = papers.filter(p => p.abstract && p.abstract.length > 100);
      const topPapers = papersWithAbstracts.length >= 5
        ? papersWithAbstracts.slice(0, 6)
        : papers.slice(0, 6);

      // Store papers and columns in localStorage
      localStorage.setItem('review_papers', JSON.stringify(topPapers));
      localStorage.setItem('review_columns', JSON.stringify(ALL_COLUMNS));

      toast({
        title: 'Papers Selected',
        description: `Selected ${topPapers.length} papers. Redirecting to review...`,
      });

      // Navigate to review page
      window.location.href = '/review';
    });
  };

  const handleYearChange = (value: string) => {
    const year = value === 'all' ? undefined : parseInt(value, 10);
    setCurrentYearFilter(year);
    // If there's an active query, re-run the search with the new year
    if (currentQuery) {
      setOffset(0);
      setResults([]);
      runSearch({ query: currentQuery, year, offset: 0 }, true);
    }
  };

  const handleLoadMore = () => {
    if (hasMore) {
      runSearch({ query: currentQuery, year: currentYearFilter, offset }, false);
    }
  };

  const isLoading = isPending || isFetchingMore;

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <section className="text-center pt-12 pb-16">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter mb-4">
            Search Papers
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Your AI-powered research assistant. Find, explore, and summarize scholarly articles with ease.
          </p>
        </section>

        <section className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchBar
              onSearch={handleSearch}
              onQuickReview={handleQuickReview}
              isLoading={isPending}
              isQuickReviewLoading={isQuickReviewPending}
            />
            <Select onValueChange={handleYearChange} defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px] h-14 rounded-full px-4 border-input bg-background">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {isPending && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className={suggestions.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
            {!isPending && results.length > 0 && (
              <PaperList
                papers={results}
                title="Search Results"
                selectedPaperIds={selectedPaperIds}
                onSelectionChange={handleSelectionChange}
              />
            )}
            {!isPending && !error && results.length === 0 && (
              <Card className="text-center border-dashed py-20 bg-transparent shadow-none">
                <CardHeader className="flex items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <SearchIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">Ready to explore?</h3>
                  <p className="text-muted-foreground">Enter a topic above to start your research journey.</p>
                </CardContent>
              </Card>
            )}
            {!isPending && hasMore && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} disabled={isFetchingMore} size="lg" variant="secondary">
                  {isFetchingMore ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                  ) : (
                    'Load More Results'
                  )}
                </Button>
              </div>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="lg:col-span-1">
              {!isPending && (
                <div className="sticky top-24">
                  <PaperList papers={suggestions} title="Suggested Papers" icon={<Lightbulb className="w-5 h-5 text-yellow-500" />} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPaperIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              size="lg"
              className="shadow-2xl"
              onClick={() => {
                // Save selected papers to localStorage to pass to the review page
                localStorage.setItem('review_papers', JSON.stringify(selectedPapers));
                // Navigate to the review page
                window.location.href = '/review';
              }}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Literature Review ({selectedPaperIds.size} selected)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
