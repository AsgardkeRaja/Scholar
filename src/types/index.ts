export interface Paper {
    paperId: string;
    url: string | null;
    title: string;
    abstract: string | null;
    authors: { authorId: string | null; name: string }[];
    year: number | null;
    journal: { name: string; pages: string | null; volume: string | null } | null;
    isOpenAccess: boolean;
  }
  