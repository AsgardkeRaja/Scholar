import { type Paper } from '@/types';
import { PaperCard } from './paper-card';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PaperListProps {
  papers: Paper[];
  title?: string;
  icon?: React.ReactNode;
  selectedPaperIds?: Set<string>;
  onSelectionChange?: (paperId: string, isSelected: boolean) => void;
}

export function PaperList({ papers, title, icon, selectedPaperIds, onSelectionChange }: PaperListProps) {
  if (papers.length === 0 && !title) {
    return null;
  }
  
  if (papers.length === 0 && title) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No papers to display.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="font-headline text-2xl font-bold tracking-tight flex items-center gap-2">
          {icon}
          {title}
        </h2>
      )}
      <div className="space-y-6">
        {papers.map((paper) => (
          <PaperCard 
            key={paper.paperId} 
            paper={paper} 
            isSelected={selectedPaperIds?.has(paper.paperId)}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>
    </section>
  );
}
