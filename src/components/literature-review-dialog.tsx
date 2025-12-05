'use client';
import { useState, useTransition } from 'react';
import { type Paper } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateLiteratureReviewAction } from '@/app/actions';
import { Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Markdown } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface LiteratureReviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedPapers: Paper[];
}

export function LiteratureReviewDialog({ isOpen, onOpenChange, selectedPapers }: LiteratureReviewDialogProps) {
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setError(null);
    setReview(null);
    startGeneratingTransition(async () => {
      const papersToReview = selectedPapers.map(p => ({
        title: p.title,
        abstract: p.abstract || '',
      }));

      const result = await generateLiteratureReviewAction({ papers: papersToReview });

      if (result.error) {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error,
        });
      } else {
        setReview(result.literatureReview || 'Could not generate a review.');
      }
    });
  };

  const handleCopy = () => {
    if (!review) return;
    navigator.clipboard.writeText(review).then(() => {
      setIsCopied(true);
      toast({ title: 'Review Copied!' });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleClose = (open: boolean) => {
    if (!open) {
        setReview(null);
        setError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6" />
            Create Literature Review
          </DialogTitle>
          <DialogDescription>
            Generate a literature review from your {selectedPapers.length} selected papers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-hidden">
            <h3 className="font-semibold">Selected Papers</h3>
            <ScrollArea className="flex-1 border rounded-lg p-4">
              <ul className="space-y-3">
                {selectedPapers.map(paper => (
                  <li key={paper.paperId} className="text-sm p-2 bg-secondary rounded-md">
                    <p className="font-semibold truncate">{paper.title}</p>
                    <p className="text-xs text-muted-foreground">{paper.authors.map(a => a.name).join(', ')} ({paper.year})</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
          <div className="flex flex-col gap-4 overflow-hidden">
             <h3 className="font-semibold">Generated Review</h3>
            <ScrollArea className="flex-1 border rounded-lg p-4 bg-background">
                {isGenerating && (
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <br />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                )}
                {error && <p className="text-destructive">{error}</p>}
                {review && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                       <Markdown content={review} />
                    </div>
                )}
                {!review && !isGenerating && !error && (
                    <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                        <p>Click "Generate" to create a literature review.</p>
                    </div>
                )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
            {review && !isGenerating && (
                <Button variant="outline" onClick={handleCopy}>
                    {isCopied ? <Check className="mr-2"/> : <Copy className="mr-2" />}
                    Copy Review
                </Button>
            )}
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <><Loader2 className="mr-2 animate-spin" /> Generating...</>
            ) : (
                '✨ Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
