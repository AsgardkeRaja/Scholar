import { type Paper } from '@/types';

/**
 * Generates a BibTeX citation string for a given paper.
 * @param paper The paper object containing metadata.
 * @returns A string formatted as a BibTeX entry.
 */
export function generateBibtex(paper: Paper): string {
  const entryType = '@article';
  const citationKey = `${paper.authors?.[0]?.name.split(' ').pop() || 'Unknown'}${paper.year || ''}${paper.title.split(' ')[0] || 'NoTitle'}`.replace(/[^a-zA-Z0-9]/g, '');

  const fields: { [key: string]: string | number | null | undefined } = {
    title: `{${paper.title}}`,
    author: paper.authors?.map(a => a.name).join(' and ') || undefined,
    journal: paper.journal?.name ? `{${paper.journal.name}}` : undefined,
    volume: paper.journal?.volume || undefined,
    pages: paper.journal?.pages || undefined,
    year: paper.year,
    url: paper.url,
  };

  let bibtexString = `${entryType}{${citationKey},\n`;
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      bibtexString += `  ${key} = {${value}},\n`;
    }
  }
  bibtexString += '}';

  return bibtexString;
}
