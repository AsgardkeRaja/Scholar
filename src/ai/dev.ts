import { config } from 'dotenv';
config();

import '@/ai/flows/generate-embeddings';
import '@/ai/flows/suggest-similar-papers.ts';
import '@/ai/flows/summarize-abstract.ts';
import '@/ai/flows/generate-literature-review.ts';
