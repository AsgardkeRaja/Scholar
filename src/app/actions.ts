'use server';

import { generateEmbeddings } from '@/ai/flows/generate-embeddings';
import { suggestSimilarPapers, type SuggestSimilarPapersInput } from '@/ai/flows/suggest-similar-papers';
import { summarizeAbstract } from '@/ai/flows/summarize-abstract';
import { generateLiteratureReview, type GenerateLiteratureReviewInput } from '@/ai/flows/generate-literature-review';
import { extractPaperAttributesFlow, type ExtractAttributesInput } from '@/ai/flows/extract-paper-attributes';
import { type Paper } from '@/types';

const PAGE_SIZE = 10;

// Helper function to parse XML text
function parseXml(xmlText: string, tagName: string): string[] {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'g');
    const matches = xmlText.match(regex) || [];
    return matches.map(match => match.replace(new RegExp(`</?${tagName}[^>]*>`, 'g'), '').trim());
}

async function searchArxiv(query: string, year?: number, offset = 0): Promise<Paper[]> {
    let searchQuery = `all:${encodeURIComponent(query)}`;
    if (year) {
        searchQuery += `+AND+submittedDate:[${year}0101+TO+${year}1231]`;
    }
    const url = `http://export.arxiv.org/api/query?search_query=${searchQuery}&start=${offset}&max_results=${PAGE_SIZE}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            console.error('ArXiv API Error:', await response.text());
            return [];
        }
        const xmlData = await response.text();
        const entries = xmlData.split('<entry>').slice(1);
        return entries.map((entryXml): Paper => {
            const fullEntryXml = '<entry>' + entryXml;
            const id = parseXml(fullEntryXml, 'id')[0] || '';
            const url = parseXml(fullEntryXml, 'id')[0] || null;
            const title = parseXml(fullEntryXml, 'title')[0] || 'No title';
            const abstract = parseXml(fullEntryXml, 'summary')[0] || 'No abstract';
            const authors = parseXml(fullEntryXml, 'author').map(authorXml => ({
                name: parseXml(authorXml, 'name')[0] || 'N/A',
                authorId: null
            }));
            const yearPublished = parseXml(fullEntryXml, 'published')[0];
            const publishedYear = yearPublished ? new Date(yearPublished).getFullYear() : null;
            return {
                paperId: id,
                url: url,
                title: title.replace(/\s+/g, ' ').trim(),
                abstract: abstract.replace(/\s+/g, ' ').trim(),
                authors,
                year: publishedYear,
                journal: null,
                isOpenAccess: true, // arXiv papers are open access
            };
        });
    } catch (e) {
        console.error('Failed to fetch from ArXiv:', e);
        return [];
    }
}

async function searchSemanticScholar(query: string, year?: number, offset = 0): Promise<Paper[]> {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    if (!apiKey) {
        console.warn("Semantic Scholar API key not found. Skipping search.");
        return [];
    }

    const fields = 'paperId,url,title,abstract,authors,year,journal,isOpenAccess';
    let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}&fields=${fields}`;
    if (year) {
        url += `&year=${year}`;
    }

    try {
        const response = await fetch(url, { headers: { 'x-api-key': apiKey }, cache: 'no-store' });

        if (!response.ok) {
            if (response.status === 429) {
                console.error('Semantic Scholar API rate limit exceeded.');
            } else {
                console.error('Semantic Scholar API Error:', await response.text());
            }
            return [];
        }

        const jsonData = await response.json();
        const results = jsonData.data || [];
        return results.map((paper: any): Paper => ({
            paperId: paper.paperId,
            url: paper.url,
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors,
            year: paper.year,
            journal: paper.journal,
            isOpenAccess: paper.isOpenAccess,
        }));
    } catch (e) {
        console.error('Failed to fetch from Semantic Scholar:', e);
        return [];
    }
}

async function searchCrossRef(query: string, year?: number, offset = 0): Promise<Paper[]> {
    let url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=${PAGE_SIZE}&offset=${offset}`;
    if (year) {
        url += `&filter=from-publication-date:${year}-01-01,until-publication-date:${year}-12-31`;
    }

    // CrossRef API requests a User-Agent header with a mailto link for politeness.
    const headers = { 'User-Agent': 'ScholarSummarizer/1.0 (mailto:scholar.summarizer@example.com)' };

    try {
        const response = await fetch(url, { headers, cache: 'no-store' });
        if (!response.ok) {
            console.error('CrossRef API Error:', await response.text());
            return [];
        }
        const jsonData = await response.json();
        const items = jsonData.message?.items || [];

        return items.map((item: any): Paper => {
            const authors = item.author?.map((a: any) => ({ name: a.given ? `${a.given} ${a.family}` : a.name, authorId: null })) || [];
            const published = item.published || item['published-print'] || item['published-online'];
            const yearPublished = published?.['date-parts']?.[0]?.[0] || null;

            return {
                paperId: item.DOI,
                url: item.URL,
                title: item.title?.[0] || 'No title',
                abstract: item.abstract?.replace(/<[^>]+>/g, '') || null, // Strip XML/HTML tags
                authors,
                year: yearPublished,
                journal: {
                    name: item['container-title']?.[0] || 'N/A',
                    volume: item.volume || null,
                    pages: item.page || null,
                },
                isOpenAccess: item['is-open-access'],
            };
        });
    } catch (e) {
        console.error('Failed to fetch from CrossRef:', e);
        return [];
    }
}

async function searchCore(query: string, year?: number, offset = 0): Promise<Paper[]> {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) {
        console.warn('CORE API key not found. Skipping search.');
        return [];
    }

    let searchUrl = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}`;
    if (year) {
        searchUrl = `https://api.core.ac.uk/v3/search/works?q=year:${year} AND (${encodeURIComponent(query)})&limit=${PAGE_SIZE}&offset=${offset}`;
    }

    try {
        const response = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('CORE API Error:', await response.text());
            return [];
        }

        const data = await response.json();
        const results = data.results || [];

        return results.map((item: any): Paper => ({
            paperId: item.id.toString(),
            url: item.downloadUrl,
            title: item.title,
            abstract: item.abstract,
            authors: item.authors.map((name: string) => ({ name, authorId: null })),
            year: item.yearPublished,
            journal: item.journals?.[0] ? { name: item.journals[0].title, volume: null, pages: null } : null,
            isOpenAccess: !!item.downloadUrl,
        }));
    } catch (error) {
        console.error('Failed to fetch from CORE API:', error);
        return [];
    }
}

export interface SearchPapersActionParams {
    query: string;
    year?: number;
    offset?: number;
}
/**
 * Searches for papers using multiple APIs.
 * @param query The search query string.
 * @returns An object containing an array of papers or an error message.
 */
export async function searchPapersAction({ query, year, offset = 0 }: SearchPapersActionParams): Promise<{ papers?: Paper[], error?: string }> {
    if (!query) {
        return { papers: [] };
    }

    try {
        const [arxivResults, semanticScholarResults, crossRefResults, coreResults] = await Promise.all([
            searchArxiv(query, year, offset),
            searchSemanticScholar(query, year, offset),
            searchCrossRef(query, year, offset),
            searchCore(query, year, offset),
        ]);

        const combinedResults = [...arxivResults, ...semanticScholarResults, ...crossRefResults, ...coreResults];

        // Deduplicate results based on title (case-insensitive)
        const uniquePapers = Array.from(new Map(combinedResults.map(p => [p.title.toLowerCase(), p])).values());

        if (uniquePapers.length === 0 && offset === 0) {
            return { error: 'Could not retrieve results from any API. Please check your query or API keys.' };
        }

        return { papers: uniquePapers };
    } catch (e) {
        const error = e as Error;
        console.error('Failed to fetch papers:', error);
        return { error: `Failed to fetch papers. Please check your connection or try again later. Details: ${error.message}` };
    }
}


/**
 * Summarizes a given abstract using an AI flow.
 * @param abstract The abstract text to summarize.
 * @returns An object containing the summary or an error message.
 */
export async function summarizeAbstractAction(abstract: string): Promise<{ summary?: string; error?: string }> {
    if (!abstract) {
        return { error: 'Abstract is empty.' };
    }
    try {
        const result = await summarizeAbstract({ abstract });
        return { summary: result.summary };
    } catch (e) {
        const error = e as Error;
        console.error('Summarization Error:', error);
        return { error: `Failed to generate summary: ${error.message}` };
    }
}

/**
 * Suggests similar papers based on search results using an AI flow.
 * @param input The input for the suggestion flow, including the query and search results.
 * @param originalPapers The full original list of papers to find matches in.
 * @returns An object containing an array of suggested papers or an error message.
 */
export async function suggestPapersAction(input: SuggestSimilarPapersInput, originalPapers: Paper[]): Promise<{ papers?: Paper[]; error?: string }> {
    try {
        const searchResultsForEmbedding = input.searchResults.map(p => p.abstract);
        const embeddings = await generateEmbeddings({ documents: searchResultsForEmbedding });

        // This is a simplified example. A real implementation would use embeddings 
        // to calculate similarity and find the most relevant papers.
        // For now, we'll continue to use the title-based suggestion flow.
        const suggestedResults = await suggestSimilarPapers(input);
        const suggestedTitles = new Set(suggestedResults.map(p => p.title));
        const fullSuggestedPapers = originalPapers.filter(p => suggestedTitles.has(p.title));

        return { papers: fullSuggestedPapers };
    } catch (e) {
        const error = e as Error;
        console.error('Suggestion Error:', error);
        return { error: `Failed to get suggestions: ${error.message}` };
    }
}

/**
 * Generates a literature review from a list of papers.
 * @param input The input for the literature review flow.
 * @returns An object containing the literature review or an error message.
 */
export async function generateLiteratureReviewAction(input: GenerateLiteratureReviewInput): Promise<{ literatureReview?: string; error?: string }> {
    try {
        const result = await generateLiteratureReview(input);
        return { literatureReview: result.literatureReview };
    } catch (e) {
        const error = e as Error;
        console.error('Literature Review Generation Error:', error);
        return { error: `Failed to generate literature review: ${error.message}` };
    }
}

/**
 * Extracts structured attributes from a list of papers.
 * @param input The input containing papers and attributes to extract.
 * @returns An object containing the extracted data or an error message.
 */
export async function extractPaperAttributesAction(input: ExtractAttributesInput): Promise<{ data?: any[]; error?: string }> {
    try {
        const result = await extractPaperAttributesFlow(input);
        return { data: result.results };
    } catch (e) {
        const error = e as Error;
        console.error('Attribute Extraction Error:', error);
        return { error: `Failed to extract attributes: ${error.message}` };
    }
}
