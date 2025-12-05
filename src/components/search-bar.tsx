'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onQuickReview?: (query: string) => void;
  isLoading: boolean;
  isQuickReviewLoading?: boolean;
}

export function SearchBar({ onSearch, onQuickReview, isLoading, isQuickReviewLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  const handleQuickReview = () => {
    if (!query.trim() || !onQuickReview) return;
    onQuickReview(query);
  };

  const anyLoading = isLoading || isQuickReviewLoading;

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'quantum computing applications' or 'crispr gene editing'"
          className="pl-12 h-14 text-lg rounded-full"
          disabled={anyLoading}
        />
      </div>
      <Button type="submit" disabled={anyLoading || !query.trim()} className="h-14 px-6 rounded-full text-base font-medium" size="default">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <Search className="h-5 w-5 mr-2" />
        )}
        Search
      </Button>
      {onQuickReview && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={handleQuickReview}
                disabled={anyLoading || !query.trim()}
                className="h-14 px-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isQuickReviewLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Quick Review
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search & generate a full literature review instantly</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </form>
  );
}
