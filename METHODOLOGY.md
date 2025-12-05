# Scholar Summarizer: Development Methodology

This document outlines the methodology and architectural approach used to develop the Scholar Summarizer application. The project integrates modern web technologies with powerful generative AI to create a comprehensive research assistant.

## 1. System Architecture Overview

The application is built on a decoupled, client-server architecture leveraging the Next.js App Router. This architecture clearly separates frontend concerns from backend logic and AI processing.

The system is composed of four primary layers:

1.  **Frontend (Client-Side)**: A responsive and interactive user interface built with React, Next.js, and ShadCN UI components. It is responsible for rendering data and capturing user input.
2.  **Backend (Server-Side Logic)**: Implemented using Next.js Server Actions, this layer orchestrates data fetching from external APIs and invokes AI functionalities. This serverless approach eliminates the need for managing a traditional backend server.
3.  **AI Integration Layer**: Powered by **Genkit**, this layer defines and manages the AI "flows." It acts as an intermediary between the application's backend logic and the underlying generative models, handling prompt construction, execution, and output formatting.
4.  **External Services**: This layer includes third-party academic APIs (ArXiv, Semantic Scholar, CrossRef, CORE) for data retrieval and Google's AI services (Gemini models) for generative tasks.

## 2. Frontend Development Methodology

The frontend is designed to be performant, accessible, and maintainable.

-   **Framework**: **Next.js 14 with the App Router** is used as the primary framework. This choice enables Server Components by default, which reduces the amount of JavaScript sent to the client and improves initial page load times.
-   **Component-Based UI**: The user interface is constructed from reusable **React Components**. We utilize **ShadCN UI** for a base set of accessible and beautifully designed components (like Cards, Buttons, and Dialogs), which are then customized and extended for the application's specific needs.
-   **Styling**: **Tailwind CSS** is used for styling, following a utility-first approach. This allows for rapid UI development and ensures a consistent design system. A custom theme is defined in `src/app/globals.css` to manage the application's color palette.
-   **State Management**: Local component state is managed using React's built-in hooks (`useState`, `useTransition`). For state that needs to persist across sessions, such as user bookmarks, the `useLocalStorage` custom hook is employed.
-   **Client-Server Communication**: **Next.js Server Actions** are used exclusively for communication between the client and server. This modern approach simplifies data fetching and mutations by allowing the client to call server-side functions directly, without the need to manually create and manage API endpoints.

## 3. Backend & Data Aggregation Methodology

The backend logic is consolidated within Server Actions (`src/app/actions.ts`) to maintain a clear and organized structure.

-   **API Aggregation**: When a user performs a search, the `searchPapersAction` makes concurrent requests to four external academic APIs: **ArXiv**, **Semantic Scholar**, **CrossRef**, and **CORE**. `Promise.all` is used to execute these fetches in parallel, minimizing latency.
-   **Data Normalization**: Each API returns data in a different format (XML for ArXiv, JSON for the others). A crucial step in the backend process is to normalize these disparate data structures into a single, consistent `Paper` type (defined in `src/types/index.ts`). This ensures that the frontend components can handle data from any source in a uniform way.
-   **Deduplication**: After aggregating results, a deduplication process is run to remove duplicate entries. This is efficiently handled using a JavaScript `Map` keyed by the paper's title (converted to lowercase for case-insensitive matching), ensuring that each unique paper is displayed only once.

## 4. Generative AI Integration Methodology

The AI capabilities of the application are orchestrated using **Genkit**, a framework designed for building AI-powered applications.

-   **AI Flows**: All AI-driven logic is encapsulated in **Genkit Flows** (located in `src/ai/flows/`). Each flow is a server-side function that defines a specific task, such as `summarizeAbstract` or `generateLiteratureReview`.
-   **Prompt Engineering**: Each flow utilizes a carefully crafted prompt to guide the **Google Gemini** model. Prompts are defined using `ai.definePrompt` and use Handlebars templating (`{{{...}}}`) to dynamically insert data. For features requiring structured output (like JSON), the prompt includes instructions for the desired format, which the model adheres to.
-   **Structured I/O with Zod**: To ensure type safety and reliable communication with the AI flows, **Zod** schemas are used to define the expected input and output structures for each flow. This provides compile-time validation and helps prevent runtime errors.
-   **Key AI Features & Methodology**:
    -   **Summarization**: The `summarizeAbstract` flow takes a paper's abstract and instructs the model to produce a concise summary, acting as an expert scientific summarizer.
    -   **Literature Review Generation**: The `generateLiteratureReview` flow is given the titles and abstracts of multiple selected papers. Its prompt instructs the model to act as a research assistant and generate a review with a specific structure: Introduction, Thematic Analysis, and Conclusion.

## 5. Development & Deployment

-   **Version Control**: The project is managed using Git, with a clear commit history to track changes.
-   **Environment Management**: API keys and other secrets are managed through an `.env` file, which is kept out of version control.
-   **Deployment**: The application is configured for continuous deployment via **Firebase App Hosting**. The `apphosting.yaml` file contains the configuration for the hosting environment. When new code is pushed to the main branch, Firebase can automatically build and deploy the application.