'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { type Paper } from '@/types';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface ReviewTableProps {
    papers: Paper[];
    extractedData: Record<number, Record<string, string>>; // paperIndex -> { attribute -> value }
    visibleColumns: string[];
    isLoading: boolean;
}

export function ReviewTable({
    papers,
    extractedData,
    visibleColumns,
    isLoading,
}: ReviewTableProps) {
    return (
        <div className="rounded-md border bg-card">
            <ScrollArea className="h-[calc(100vh-300px)] w-full rounded-md">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow>
                            <TableHead className="w-[300px] min-w-[300px] font-bold">Paper Details</TableHead>
                            {visibleColumns.map((col) => (
                                <TableHead key={col} className="min-w-[250px] font-bold">
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {papers.map((paper, index) => (
                            <TableRow key={paper.paperId}>
                                <TableCell className="font-medium align-top">
                                    <div className="space-y-2">
                                        <a
                                            href={paper.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline font-semibold block leading-tight"
                                        >
                                            {paper.title} <ExternalLink className="inline h-3 w-3 ml-1" />
                                        </a>
                                        <div className="text-xs text-muted-foreground">
                                            {paper.authors.map(a => a.name).slice(0, 3).join(', ')}
                                            {paper.authors.length > 3 && ' et al.'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {paper.year} • {paper.journal?.name || 'Unknown Journal'}
                                        </div>
                                    </div>
                                </TableCell>
                                {visibleColumns.map((col) => {
                                    const value = extractedData[index]?.[col];
                                    return (
                                        <TableCell key={`${paper.paperId}-${col}`} className="align-top">
                                            {isLoading && !value ? (
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                </div>
                                            ) : (
                                                <div className="text-sm whitespace-pre-wrap">
                                                    {value || <span className="text-muted-foreground italic">Not extracted</span>}
                                                </div>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
