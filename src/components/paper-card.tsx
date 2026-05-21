'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type Paper } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { summarizeAbstractAction } from '@/app/actions';
import { generateBibtex } from '@/lib/citations';
import { useAuth } from '@/contexts/auth-context';
import { addBookmark, removeBookmark, isBookmarked as checkIsBookmarked } from '@/lib/firestore-service';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Copy, Check, BookOpen, Quote, Book, Loader2, Sparkles, ExternalLink, Bot } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface PaperCardProps {
  paper: Paper;
  isSelected?: boolean;
  onSelectionChange?: (paperId: string, isSelected: boolean) => void;
}

export function PaperCard({ paper, isSelected, onSelectionChange }: PaperCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [checkingBookmark, setCheckingBookmark] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'groq'>('gemini');
  const [usedModel, setUsedModel] = useState<'gemini' | 'groq' | null>(null);
  const { toast } = useToast();

  // Check if paper is bookmarked on mount and when user changes
  useEffect(() => {
    async function checkBookmark() {
      if (user) {
        setCheckingBookmark(true);
        const bookmarked = await checkIsBookmarked(user.uid, paper.paperId);
        setIsBookmarked(bookmarked);
        setCheckingBookmark(false);
      } else {
        setIsBookmarked(false);
      }
    }
    checkBookmark();
  }, [user, paper.paperId]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark papers.",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        ),
      });
      return;
    }

    try {
      if (isBookmarked) {
        await removeBookmark(user.uid, paper.paperId);
        setIsBookmarked(false);
        toast({ title: "Bookmark removed", description: `"${paper.title}" removed from your bookmarks.` });
      } else {
        await addBookmark(user.uid, paper);
        setIsBookmarked(true);
        toast({ title: "Bookmarked!", description: `"${paper.title}" added to your bookmarks.` });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
      });
    }
  };

  const handleSummarize = () => {
    if (!paper.abstract && !paper.fullText) {
      toast({ variant: "destructive", title: "No Abstract", description: "This paper does not have an abstract to summarize." });
      return;
    }
    const textToSummarize = paper.fullText || paper.abstract!;
    startSummaryTransition(async () => {
      const result = await summarizeAbstractAction(textToSummarize, selectedModel);
      if (result.error) {
        toast({ variant: "destructive", title: "Summarization Failed", description: result.error });
      } else {
        setSummary(result.summary || 'Could not generate summary.');
        setUsedModel(selectedModel);
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
                disabled={checkingBookmark}
              >
                {checkingBookmark ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Star className={cn('h-5 w-5', isBookmarked && 'fill-amber-400 text-amber-500')} />
                )}
              </Button>
            </div>
            <CardDescription className="text-sm mt-2 space-y-1">
              <p className="break-words">
                <span className="font-semibold text-foreground/80">Authors:</span> {authors}
              </p>
              <p>
                <span className="font-semibold text-foreground/80">Published:</span> {paper.year || 'N/A'} in{' '}
                <span className="italic">{paper.journal?.name || 'N/A'}</span>
                {paper.source && (
                  <span className="ml-2 text-xs text-muted-foreground">· via <span className="font-medium text-primary/80">{paper.source}</span></span>
                )}
              </p>
            </CardDescription>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {paper.isOpenAccess && <Badge variant="secondary" className="w-fit"><Check className="w-3 h-3 mr-1.5" />Open Access</Badge>}
              {paper.fullText && <Badge variant="outline" className="w-fit text-emerald-400 border-emerald-400/50">Full Text Available</Badge>}
            </div>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as 'gemini' | 'groq')}>
                    <SelectTrigger className="w-[200px] h-9">
                      <Bot className="w-4 h-4 mr-2 shrink-0" />
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="groq">Llama 3.3 70B (Groq)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}>
                    {isSummarizing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Generate AI Summary</>
                    )}
                  </Button>
                </div>
              )}
              {isSummarizing && <Skeleton className="w-full h-24 mt-2" />}
              {summary && !isSummarizing && (
                <div className="p-4 bg-secondary rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground"><Quote className="w-4 h-4 text-primary" /> AI Summary</h4>
                    {usedModel && (
                      <Badge variant="outline" className="text-xs">
                        {usedModel === 'gemini' ? 'Gemini 2.5 Flash' : 'Llama 3.3 70B (Groq)'}
                      </Badge>
                    )}
                  </div>
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
