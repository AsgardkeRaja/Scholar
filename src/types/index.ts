export interface Paper {
  paperId: string;
  url: string | null;
  title: string;
  abstract: string | null;
  fullText?: string | null;
  source?: 'ArXiv' | 'Semantic Scholar' | 'CrossRef' | 'CORE' | 'Upload';
  authors: { authorId: string | null; name: string }[];
  year: number | null;
  journal: { name: string; pages: string | null; volume: string | null } | null;
  isOpenAccess: boolean;
}
