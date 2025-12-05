'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { type Paper } from '@/types';
import { extractPaperAttributesAction } from '@/app/actions';
import { ReviewTable } from '@/components/review-table';
import { ColumnSelector, type ColumnOption } from '@/components/column-selector';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Download, Loader2, Sparkles, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_COLUMNS: ColumnOption[] = [
    { id: 'Abstract Summary', label: 'Abstract Summary' },
    { id: 'Results', label: 'Results' },
    { id: 'Limitations', label: 'Limitations' },
    { id: 'Methods Used', label: 'Methods Used' },
    { id: 'Research Gap', label: 'Research Gap' },
    { id: 'Contribution', label: 'Contribution' },
    { id: 'Future Work', label: 'Future Work' },
    { id: 'Key Findings', label: 'Key Findings' },
];

export default function ReviewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['Abstract Summary', 'Results']);
    const [extractedData, setExtractedData] = useState<Record<number, Record<string, string>>>({});
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        // Retrieve papers from localStorage to avoid re-fetching or passing huge query params
        const storedPapers = localStorage.getItem('review_papers');
        const storedColumns = localStorage.getItem('review_columns');

        if (storedPapers) {
            try {
                const parsedPapers = JSON.parse(storedPapers);
                setPapers(parsedPapers);

                // Check if columns were pre-selected (from quick review)
                if (storedColumns) {
                    try {
                        const parsedColumns = JSON.parse(storedColumns);
                        if (Array.isArray(parsedColumns) && parsedColumns.length > 0) {
                            setSelectedColumns(parsedColumns);
                        }
                        // Clean up the columns from localStorage after reading
                        localStorage.removeItem('review_columns');
                    } catch (e) {
                        console.error('Failed to parse columns from storage', e);
                    }
                }
            } catch (e) {
                console.error('Failed to parse papers from storage', e);
                toast({ variant: 'destructive', title: 'Error loading papers' });
            }
        } else {
            // Fallback or redirect if no papers found
            toast({ variant: 'destructive', title: 'No papers selected', description: 'Please select papers from the search page.' });
            router.push('/search');
        }
    }, [router, toast]);

    useEffect(() => {
        if (papers.length === 0) return;

        const attributesToFetch = selectedColumns.filter(col => {
            // Check if we already have data for this column for at least one paper
            // Ideally we check if we have it for ALL papers, but for simplicity, 
            // we'll fetch if we are missing data for the first paper or if the column is new.
            // A better check: is this column present in the extractedData for paper 0?
            return !extractedData[0]?.[col];
        });

        if (attributesToFetch.length === 0) return;

        startTransition(async () => {
            const input = {
                papers: papers.map(p => ({ title: p.title, abstract: p.abstract || '' })),
                attributes: attributesToFetch,
            };

            const result = await extractPaperAttributesAction(input);

            if (result.error) {
                toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error });
                return;
            }

            if (result.data) {
                setExtractedData(prev => {
                    const newData = { ...prev };
                    result.data?.forEach((item: any) => {
                        const paperIndex = item.paperIndex;
                        if (!newData[paperIndex]) newData[paperIndex] = {};
                        // Merge new attributes
                        newData[paperIndex] = { ...newData[paperIndex], ...item.attributes };
                    });
                    return newData;
                });
            }
        });
    }, [selectedColumns, papers]);

    const handleExportCSV = () => {
        // Simple CSV export
        const headers = ['Title', 'Year', ...selectedColumns];
        const rows = papers.map((paper, index) => {
            const rowData = [
                `"${paper.title.replace(/"/g, '""')}"`,
                paper.year || '',
                ...selectedColumns.map(col => `"${(extractedData[index]?.[col] || '').replace(/"/g, '""')}"`)
            ];
            return rowData.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'literature_review.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Complete', description: 'CSV file downloaded successfully.' });
    };

    const handleExportWord = () => {
        // Generate Word document content in paragraph format like research papers
        const authors = (paper: Paper) => paper.authors?.map(a => a.name).join(', ') || 'Unknown Authors';

        let content = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Literature Review</title>
<style>
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; max-width: 8.5in; margin: 1in auto; padding: 0 1in; }
h1 { font-size: 18pt; text-align: center; margin-bottom: 24pt; }
h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 12pt; }
h3 { font-size: 12pt; font-style: italic; margin-top: 14pt; margin-bottom: 8pt; }
p { text-align: justify; margin-bottom: 12pt; text-indent: 0.5in; }
p.no-indent { text-indent: 0; }
.paper-title { font-weight: bold; }
.citation { font-style: italic; color: #333; }
.section-content { margin-left: 0; }
</style>
</head>
<body>
<h1>Literature Review</h1>

<h2>Introduction</h2>
<p class="no-indent">This literature review synthesizes findings from ${papers.length} scholarly papers, examining key themes including ${selectedColumns.join(', ').toLowerCase()}. The following sections present a comprehensive analysis of each paper's contributions to the field.</p>

<h2>Review of Literature</h2>
`;

        papers.forEach((paper, index) => {
            const data = extractedData[index] || {};
            const year = paper.year || 'n.d.';
            const authorList = authors(paper);
            const firstAuthor = paper.authors?.[0]?.name?.split(' ').pop() || 'Unknown';

            content += `
<h3>${index + 1}. ${paper.title}</h3>
<p class="no-indent citation">${authorList} (${year})</p>
`;

            // Add each selected column as a paragraph
            selectedColumns.forEach(col => {
                const value = data[col];
                if (value) {
                    content += `
<p><span class="paper-title">${col}:</span> ${value}</p>
`;
                }
            });

            content += `\n`;
        });

        // Add summary section
        content += `
<h2>Summary</h2>
<p class="no-indent">This review examined ${papers.length} papers focusing on ${selectedColumns.slice(0, 2).join(' and ').toLowerCase()}. The analyzed studies provide valuable insights into the current state of research in this domain. Future investigations should consider the limitations and research gaps identified across these works to advance the field further.</p>

</body>
</html>
`;

        // Create and download as .doc file (HTML format that Word can open)
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'literature_review.doc');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Complete', description: 'Word document downloaded successfully.' });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            Literature Review
                        </h1>
                        <p className="text-muted-foreground">
                            Analyzing {papers.length} papers
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ColumnSelector
                        columns={AVAILABLE_COLUMNS}
                        selectedColumns={selectedColumns}
                        onSelectionChange={setSelectedColumns}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportCSV}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportWord}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export as Word
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1">
                <ReviewTable
                    papers={papers}
                    extractedData={extractedData}
                    visibleColumns={selectedColumns}
                    isLoading={isPending}
                />
            </div>
        </div>
    );
}
