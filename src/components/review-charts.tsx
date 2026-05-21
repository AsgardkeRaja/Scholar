'use client';

import * as React from 'react';
import { type Paper } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, PieChartIcon, BarChart3, Target, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ReviewChartsProps {
    papers: Paper[];
    extractedData: Record<number, Record<string, string>>;
    visibleColumns: string[];
}

const CHART_COLORS = [
    'hsl(263, 70%, 60%)',  // Indigo (primary)
    'hsl(173, 58%, 50%)',  // Teal
    'hsl(43, 74%, 66%)',   // Gold
    'hsl(340, 75%, 60%)',  // Rose
    'hsl(160, 60%, 50%)',  // Emerald
    'hsl(210, 70%, 55%)',  // Blue
    'hsl(30, 80%, 55%)',   // Orange
    'hsl(280, 65%, 60%)',  // Purple (accent)
];

/**
 * Attempt to extract a numeric value from a text string.
 * Handles patterns like "94.5%", "0.92", "85.2", "accuracy of 96.4%"
 */
function extractNumericValue(text: string): number | null {
    if (!text) return null;
    // Try to find percentage patterns first
    const pctMatch = text.match(/(\d+\.?\d*)\s*%/);
    if (pctMatch) return parseFloat(pctMatch[1]);
    // Try to find decimal patterns (0.xx)
    const decMatch = text.match(/\b0\.(\d+)\b/);
    if (decMatch) return parseFloat(`0.${decMatch[1]}`) * 100;
    // Try to find plain numbers that look like percentages (50-100)
    const numMatch = text.match(/\b(\d{2,3}\.?\d*)\b/);
    if (numMatch) {
        const val = parseFloat(numMatch[1]);
        if (val >= 50 && val <= 100) return val;
    }
    return null;
}

/**
 * Parse a text field to extract keywords/terms, splitting on commas, semicolons, "and".
 */
function extractTerms(text: string): string[] {
    if (!text) return [];
    return text
        .split(/[,;]|\band\b/i)
        .map(t => t.trim())
        .filter(t => t.length > 1 && t.length < 50);
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Icon className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs mt-1 text-center max-w-[240px]">{description}</p>
        </div>
    );
}

export function ReviewCharts({
    papers,
    extractedData,
    visibleColumns,
}: ReviewChartsProps) {
    // ─── 1. Publication Year Data ────────────────────────────────────────
    const yearData = React.useMemo(() => {
        const counts: Record<number, number> = {};
        papers.forEach(p => {
            if (p.year) {
                counts[p.year] = (counts[p.year] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([year, count]) => ({ year: parseInt(year), count }))
            .sort((a, b) => a.year - b.year);
    }, [papers]);

    // ─── 2. Source Distribution Data ─────────────────────────────────────
    const sourceData = React.useMemo(() => {
        const counts: Record<string, number> = {};
        papers.forEach(p => {
            const source = p.source || 'Unknown';
            counts[source] = (counts[source] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [papers]);

    // ─── 3. Methods / Dataset Frequency ──────────────────────────────────
    const methodsData = React.useMemo(() => {
        const termCounts: Record<string, number> = {};
        const methodCol = visibleColumns.find(c =>
            c.toLowerCase().includes('method') || c.toLowerCase().includes('dataset')
        );
        if (!methodCol) return [];

        papers.forEach((_, index) => {
            const text = extractedData[index]?.[methodCol];
            if (text) {
                const terms = extractTerms(text);
                terms.forEach(term => {
                    const normalized = term.toLowerCase().trim();
                    if (normalized.length > 1) {
                        termCounts[normalized] = (termCounts[normalized] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(termCounts)
            .map(([term, count]) => ({ term: term.charAt(0).toUpperCase() + term.slice(1), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [papers, extractedData, visibleColumns]);

    // ─── 4. Accuracy Benchmark Data ──────────────────────────────────────
    const accuracyData = React.useMemo(() => {
        const hasAccuracyCol = visibleColumns.some(c => c.toLowerCase().includes('accuracy'));
        if (!hasAccuracyCol) return null;

        const accCol = visibleColumns.find(c => c.toLowerCase().includes('accuracy'))!;
        const results: { name: string; accuracy: number }[] = [];

        papers.forEach((paper, index) => {
            const text = extractedData[index]?.[accCol];
            if (text) {
                const value = extractNumericValue(text);
                if (value !== null) {
                    const shortTitle = paper.title.length > 35
                        ? paper.title.substring(0, 32) + '...'
                        : paper.title;
                    results.push({ name: shortTitle, accuracy: Math.round(value * 10) / 10 });
                }
            }
        });

        return results.length > 0 ? results.sort((a, b) => b.accuracy - a.accuracy) : null;
    }, [papers, extractedData, visibleColumns]);

    const hasAccuracyColumn = visibleColumns.some(c => c.toLowerCase().includes('accuracy'));

    // ─── Chart Configs for Shadcn ────────────────────────────────────────
    const yearChartConfig = {
        count: { label: 'Papers', color: CHART_COLORS[0] },
    };

    const sourceChartConfig = Object.fromEntries(
        sourceData.map((item, i) => [item.name, { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] }])
    );

    const methodsChartConfig = {
        count: { label: 'Frequency', color: CHART_COLORS[1] },
    };

    const accuracyChartConfig = {
        accuracy: { label: 'Accuracy (%)', color: CHART_COLORS[0] },
    };

    // ─── Summary Stats ──────────────────────────────────────────────────
    const totalPapers = papers.length;
    const yearRange = yearData.length > 0
        ? `${yearData[0].year} – ${yearData[yearData.length - 1].year}`
        : 'N/A';
    const uniqueSources = sourceData.length;
    const avgAccuracy = accuracyData
        ? (accuracyData.reduce((sum, d) => sum + d.accuracy, 0) / accuracyData.length).toFixed(1)
        : null;

    return (
        <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
                {/* ─── Summary Stats Row ─────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Papers', value: totalPapers, color: 'text-violet-400' },
                        { label: 'Year Range', value: yearRange, color: 'text-teal-400' },
                        { label: 'Sources', value: uniqueSources, color: 'text-amber-400' },
                        { label: 'Avg. Accuracy', value: avgAccuracy ? `${avgAccuracy}%` : '—', color: 'text-rose-400' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                        >
                            <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                                    <p className={`text-2xl font-bold font-headline ${stat.color}`}>{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Charts Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Publication Year Area Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Publication Timeline
                                </CardTitle>
                                <CardDescription>Number of papers published per year</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {yearData.length > 0 ? (
                                    <ChartContainer config={yearChartConfig} className="h-[250px] w-full">
                                        <AreaChart data={yearData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="yearGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={CHART_COLORS[0]}
                                                strokeWidth={2}
                                                fill="url(#yearGradient)"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <EmptyState icon={TrendingUp} title="No year data" description="Papers don't have publication year information." />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Source Distribution Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 text-teal-400" />
                                    Source Distribution
                                </CardTitle>
                                <CardDescription>Papers by database source</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sourceData.length > 0 ? (
                                    <ChartContainer config={sourceChartConfig} className="h-[250px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={sourceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                                nameKey="name"
                                                strokeWidth={2}
                                                stroke="hsl(var(--background))"
                                            >
                                                {sourceData.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                            <Legend
                                                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                                            />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <EmptyState icon={PieChartIcon} title="No source data" description="No source information available." />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Methods / Dataset Frequency Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-amber-400" />
                                    Methods & Datasets
                                </CardTitle>
                                <CardDescription>Most frequently mentioned techniques and datasets</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {methodsData.length > 0 ? (
                                    <ChartContainer config={methodsChartConfig} className="h-[250px] w-full">
                                        <BarChart data={methodsData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <YAxis
                                                dataKey="term"
                                                type="category"
                                                width={120}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar
                                                dataKey="count"
                                                fill={CHART_COLORS[1]}
                                                radius={[0, 4, 4, 0]}
                                                barSize={18}
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <EmptyState
                                        icon={BarChart3}
                                        title="No methods data"
                                        description='Select "Methods Used" or "Dataset Used" columns to see frequency analysis.'
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Accuracy Benchmark Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-400" />
                                    Accuracy Benchmark
                                </CardTitle>
                                <CardDescription>Reported performance across papers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!hasAccuracyColumn ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                        <Info className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="font-medium text-sm">Accuracy column not selected</p>
                                        <p className="text-xs mt-1 text-center max-w-[260px]">
                                            Add the <Badge variant="outline" className="mx-1 text-[10px]">Accuracy</Badge> column from the column selector to enable this benchmark chart.
                                        </p>
                                    </div>
                                ) : accuracyData ? (
                                    <ChartContainer config={accuracyChartConfig} className="h-[250px] w-full">
                                        <BarChart data={accuracyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 9 }}
                                                interval={0}
                                                angle={-25}
                                                textAnchor="end"
                                                height={70}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v) => `${v}%`}
                                            />
                                            <ChartTooltip
                                                content={<ChartTooltipContent />}
                                            />
                                            <defs>
                                                <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.9} />
                                                    <stop offset="95%" stopColor={CHART_COLORS[3]} stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                            <Bar
                                                dataKey="accuracy"
                                                fill="url(#accGradient)"
                                                radius={[4, 4, 0, 0]}
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <EmptyState
                                        icon={Target}
                                        title="No accuracy values found"
                                        description="Could not extract numeric accuracy values from the papers. Ensure papers report quantitative results."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </ScrollArea>
    );
}
