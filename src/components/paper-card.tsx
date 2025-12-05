'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { type Paper } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { summarizeAbstractAction } from '@/app/actions';
import { generateBibtex } from '@/lib/citations';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star, Copy, Check, BookOpen, Quote, Book, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface PaperCardProps {
  paper: Paper;
  isSelected?: boolean;
  onSelectionChange?: (paperId: string, isSelected: boolean) => void;
}

export function PaperCard({ paper, isSelected, onSelectionChange }: PaperCardProps) {
  const [bookmarks, setBookmarks] = useLocalStorage<Paper[]>('bookmarks', []);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const isBookmarked = bookmarks.some(b => b.paperId === paper.paperId);

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.paperId !== paper.paperId));
      toast({ title: "Bookmark removed", description: `"${paper.title}" removed from your bookmarks.` });
    } else {
      setBookmarks([...bookmarks, paper]);
      toast({ title: "Bookmarked!", description: `"${paper.title}" added to your bookmarks.` });
    }
  };

  const handleSummarize = () => {
    if (!paper.abstract) {
      toast({ variant: "destructive", title: "No Abstract", description: "This paper does not have an abstract to summarize." });
      return;
    }
    startSummaryTransition(async () => {
      const result = await summarizeAbstractAction(paper.abstract!);
      if (result.error) {
        toast({ variant: "destructive", title: "Summarization Failed", description: result.error });
      } else {
        setSummary(result.summary || 'Could not generate summary.');
      }
    });
  };

  const handleCopyCitation = () => {
    const bibtex = generateBibtex(paper);
    navigator.clipboard.writeText(bibtex).then(() => {
      setIsCopied(true);
      toast({ title: "Citation Copied", description: "BibTeX citation copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const authors = paper.authors?.map(a => a.name).join(', ') || 'N/A';
  const cardId = `paper-card-${paper.paperId}`;

  return (
    <Card className={cn(
      "bg-card text-card-foreground transition-all duration-300 group",
      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "shadow-sm hover:shadow-lg border"
    )}>

      <CardHeader>
        <div className="flex gap-4">
          {onSelectionChange && (
            <div className="pt-1">
              <Checkbox
                id={cardId}
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(paper.paperId, !!checked)}
                aria-label="Select paper"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4">
              <Label htmlFor={cardId} className="w-full">
                <CardTitle className="font-headline text-xl leading-tight">
                  {paper.url ? (
                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-2">
                      {paper.title}
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    paper.title
                  )}
                </CardTitle>
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmarkToggle}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className="text-muted-foreground hover:text-amber-500 shrink-0"
              >
                <Star className={cn('h-5 w-5', isBookmarked && 'fill-amber-400 text-amber-500')} />
              </Button>
            </div>
            <CardDescription className="text-sm mt-2 space-y-1">
              <p className="break-words">
                <span className="font-semibold text-foreground/80">Authors:</span> {authors}
              </p>
              <p>
                <span className="font-semibold text-foreground/80">Published:</span> {paper.year || 'N/A'} in{' '}
                <span className="italic">{paper.journal?.name || 'N/A'}</span>
              </p>
            </CardDescription>
            {paper.isOpenAccess && <Badge variant="secondary" className="w-fit mt-3"><Check className="w-3 h-3 mr-1.5" />Open Access</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="abstract">
            <AccordionTrigger>
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                <span>View Abstract</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground text-base pt-4">
              <p>{paper.abstract || 'No abstract available.'}</p>
              {paper.abstract && (
                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}>
                  {isSummarizing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate AI Summary</>
                  )}
                </Button>
              )}
              {isSummarizing && <Skeleton className="w-full h-24 mt-2" />}
              {summary && !isSummarizing && (
                <div className="p-4 bg-secondary rounded-lg border space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground"><Quote className="w-4 h-4 text-primary" /> AI Summary</h4>
                  <p className="text-secondary-foreground">{summary}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {paper.url && (
          <Button asChild variant="secondary">
            <Link href={paper.url} target="_blank" rel="noopener noreferrer">
              <Book className="mr-2 h-4 w-4" /> Read Paper
            </Link>
          </Button>
        )}
        <Button onClick={handleCopyCitation} variant="outline">
          {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          Cite
        </Button>
      </CardFooter>
    </Card>
  );
}

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
