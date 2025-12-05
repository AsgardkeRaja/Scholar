'use client';

import { useState, useTransition } from 'react';
import { Upload, FileText, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// All available columns for review
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

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(
                file => file.type === 'application/pdf'
            );

            if (newFiles.length !== e.target.files.length) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Files',
                    description: 'Only PDF files are supported.',
                });
            }

            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerateReview = () => {
        if (files.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Files',
                description: 'Please upload at least one PDF file.',
            });
            return;
        }

        startTransition(async () => {
            toast({
                title: 'Processing Papers',
                description: 'Extracting text from PDFs...',
            });

            try {
                // Extract text from PDFs
                const papers = await Promise.all(
                    files.map(async (file, index) => {
                        const text = await extractTextFromPDF(file);

                        // Create a paper object from the extracted text
                        return {
                            paperId: `uploaded-${Date.now()}-${index}`,
                            title: file.name.replace('.pdf', ''),
                            abstract: text.substring(0, 1000), // Use first 1000 chars as abstract
                            authors: [],
                            year: new Date().getFullYear(),
                            url: '',
                            isOpenAccess: false,
                        };
                    })
                );

                // Store papers and columns in localStorage
                localStorage.setItem('review_papers', JSON.stringify(papers));
                localStorage.setItem('review_columns', JSON.stringify(ALL_COLUMNS));

                toast({
                    title: 'Papers Processed',
                    description: `Processed ${papers.length} papers. Redirecting to review...`,
                });

                // Navigate to review page
                router.push('/review');
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Processing Failed',
                    description: 'Failed to extract text from PDFs. Please try again.',
                });
            }
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen">
            <section className="text-center pt-12 pb-16">
                <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter mb-4 flex items-center justify-center gap-4">
                    <Upload className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                    Upload Papers
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Upload your research papers (PDF) and generate a comprehensive literature review automatically.
                </p>
            </section>

            <div className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Research Papers</CardTitle>
                        <CardDescription>
                            Upload one or more PDF files to generate a literature review with AI-powered analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-4"
                            >
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold mb-1">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        PDF files only (max 10 files)
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground">
                                    Uploaded Files ({files.length})
                                </h3>
                                <div className="space-y-2">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-medium text-sm">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                                className="h-8 w-8"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerateReview}
                            disabled={files.length === 0 || isPending}
                            className="w-full h-12 text-base"
                            size="lg"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Generate Literature Review
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-lg">How it works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Upload your research papers in PDF format (up to 10 files)</p>
                        <p>2. Our AI will extract and analyze the content from each paper</p>
                        <p>3. Get a comprehensive literature review with all key insights</p>
                        <p>4. Export your review as CSV or Word document</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper function to extract text from PDF
async function extractTextFromPDF(file: File): Promise<string> {
    // This is a placeholder - in a real implementation, you would use a library like pdf.js
    // or send the file to a backend API that extracts the text

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                // For now, we'll just use the filename and a placeholder
                // In production, you'd use pdf.js or similar to extract actual text
                const text = `This is a research paper titled: ${file.name}. 
        
Abstract: This paper presents novel findings in the field of research. The methodology employed demonstrates significant improvements over existing approaches. Our results indicate promising directions for future work.

Introduction: The field has seen considerable advancement in recent years. This study builds upon previous work while introducing innovative techniques.

Methods: We employed a rigorous experimental design with appropriate controls and validation procedures.

Results: Our findings demonstrate statistically significant improvements across multiple metrics.

Discussion: These results have important implications for the field and suggest several avenues for future research.

Conclusion: This work contributes to the growing body of knowledge and opens new possibilities for investigation.`;

                resolve(text);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}
