# Scholar Summarizer: AI-Powered Research Assistant

Scholar Summarizer is a web application designed to accelerate academic research by providing a unified interface to search, discover, and analyze scholarly articles from multiple academic databases. Leveraging the power of generative AI, it offers tools to summarize papers, find similar articles, and generate comprehensive literature reviews.

## ✨ Features

- **Unified Search**: Simultaneously search for research papers across four major academic APIs:
  - ArXiv
  - Semantic Scholar
  - CrossRef
  - CORE
- **AI-Powered Summarization**: Generate concise summaries of paper abstracts with a single click.
- **AI-Driven Suggestions**: Get intelligent recommendations for similar papers based on your search results.
- **Literature Review Generation**: Select multiple papers and automatically generate a structured literature review, complete with an introduction, thematic analysis, and conclusion.
- **Advanced Filtering**: Filter search results by publication year.
- **Infinite Scroll**: Seamlessly load more results as you scroll.
- **Bookmarking**: Save interesting papers for later access on a dedicated bookmarks page.
- **Citation Helper**: Instantly generate BibTeX citations for any paper.
- **Modern UI**: A clean, responsive, and aesthetically pleasing interface built with the latest web technologies.

## 🚀 Technology Stack

This project is built on a modern, robust, and scalable tech stack:

- **Frontend**:
  - **Next.js**: React framework for server-side rendering and static site generation (App Router).
  - **React**: A JavaScript library for building user interfaces.
  - **TypeScript**: For static typing and improved code quality.
  - **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
  - **ShadCN UI**: A collection of beautifully designed, accessible, and reusable components.
  - **Framer Motion**: For smooth animations and transitions.

- **Backend & AI**:
  - **Genkit (by Firebase)**: An open-source framework for building AI-powered applications, used here to orchestrate calls to Google's Gemini models.
  - **Google Gemini**: The generative AI model family used for summarization, suggestions, and literature review generation.
  - **Next.js Server Actions**: For handling server-side logic like API calls and AI flow invocations without needing to create separate API endpoints.

- **Deployment**:
  - **Firebase App Hosting**: For continuous deployment and scalable hosting.

## 🏗️ Project Structure & Flow

The application follows a logical structure that separates concerns and promotes maintainability.

```
src/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── actions.ts        # Server Actions for API calls and business logic
│   └── page.tsx          # Main search interface
├── ai/                   # Genkit AI Flows
│   ├── flows/            # Definitions for AI-powered features
│   └── genkit.ts         # Genkit and Google AI plugin configuration
├── components/           # Reusable React components
│   ├── ui/               # Core ShadCN UI components
│   └── *.tsx             # Application-specific components (PaperCard, SearchBar, etc.)
├── hooks/                # Custom React hooks (e.g., useLocalStorage)
├── lib/                  # Utility functions (e.g., citation generation, cn)
└── types/                # TypeScript type definitions (e.g., Paper)
```

### Application Flow:

1.  **User Search**: The user enters a query into the `SearchBar` on the main page (`src/app/page.tsx`).
2.  **Server Action**: The `searchPapersAction` in `src/app/actions.ts` is triggered.
3.  **API Aggregation**: This action makes parallel calls to the ArXiv, Semantic Scholar, CrossRef, and CORE APIs.
4.  **Data Unification**: Results from all APIs are normalized into a single `Paper` format (defined in `src/types/index.ts`), de-duplicated, and sent back to the client.
5.  **AI Suggestions**: Simultaneously, the `suggestPapersAction` is called, which uses the `suggestSimilarPapers` Genkit flow (`src/ai/flows/suggest-similar-papers.ts`) to find relevant papers from the initial results.
6.  **Rendering**: The `PaperList` and `PaperCard` components (`src/components/`) render the results.
7.  **AI Feature Interaction**:
    - Clicking "Generate AI Summary" on a `PaperCard` calls the `summarizeAbstractAction`, which in turn executes the `summarizeAbstract` Genkit flow.
    - Selecting papers and clicking "Create Literature Review" opens the `LiteratureReviewDialog` and triggers the `generateLiteratureReviewAction`, which runs the corresponding Genkit flow to produce a structured review.

## ⚙️ Environment Variables

To run this project locally, you need to create a `.env` file in the root directory and add the following API keys.

```
# Get from https://www.semanticscholar.org/product/api
SEMANTIC_SCHOLAR_API_KEY="YOUR_API_KEY"

# Get from https://core.ac.uk/services/api
CORE_API_KEY="YOUR_API_KEY"

# Get from Google AI Studio at https://aistudio.google.com/app/apikey
GEMINI_API_KEY="YOUR_API_KEY"
```

**Note**: The ArXiv and CrossRef APIs do not require an API key.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/scholar-summarizer.git
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    ```
3.  **Set up your environment variables:**
    - Create a `.env` file in the root of the project.
    - Add your API keys as described in the "Environment Variables" section above.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
