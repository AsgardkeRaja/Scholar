# **App Name**: Scholar Summarizer

## Core Features:

- Keyword Search: Provide a search bar for users to input keywords or topics.
- Paper Metadata Retrieval: Fetch the title, author(s), abstract, publication year, and link to the full article (when available) from the Semantic Scholar API based on the user's search query.
- Search Results Display: Display the search results with fetched metadata in a clear, readable format.
- Abstract Summarization: Automatically generate a summary of the abstract using a Hugging Face Transformers model.
- Bookmark Articles: Allow users to save or bookmark favorite articles locally using browser storage.
- Export Citations: Enable users to export citations in BibTeX format for easy integration with reference management tools.
- Suggest Similar Papers: Based on user search keywords and the content of results, this tool will provide a number of papers or articles for the user to review. The tool only provides articles which were in the results of the search, but were not otherwise included by the original retrieval function.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5), providing a scholarly and sophisticated feel.
- Background color: Light Grey (#ECEFF1), a desaturated tint of the primary, to offer a clean and unobtrusive backdrop.
- Accent color: Cyan (#00BCD4), an analogous color to indigo, is used for interactive elements and highlights, drawing the user’s eye to key actions and information.
- Body text: 'Inter', a sans-serif font that ensures readability and a modern aesthetic.
- Headline Font: 'Space Grotesk', a sans-serif that complements 'Inter' and provides a tech-forward feel.
- Simple, professional icons for actions like saving, exporting, and searching, designed for clarity.
- A clean and intuitive layout that prioritizes search functionality and clear presentation of paper metadata.