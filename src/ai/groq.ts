import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'your-groq-api-key-here') {
            throw new Error('GROQ_API_KEY is not configured. Please add your Groq API key to the .env file.');
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

export async function groqSummarize(abstract: string): Promise<{ summary: string }> {
    const client = getGroqClient();

    const chatCompletion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a world-class scientific research analyst. Produce a high-quality, publication-ready summary of a research paper abstract.

CRITICAL RULES:
- ALWAYS include specific quantitative data from the abstract: exact percentages, accuracy scores, F1 scores, p-values, sample sizes, speedup factors, error rates, or any numerical results
- NEVER use vague phrases like "improved accuracy" or "significant improvement" — state the EXACT numbers (e.g., "achieved 94.3% accuracy, representing a 12.5% improvement over the baseline")
- If the abstract mentions multiple metrics or benchmarks, include ALL of them
- Open with the research problem or objective
- State the methodology/approach concisely
- Present key findings WITH their exact numbers
- Mention implications or contributions to the field
- Write 3-5 flowing sentences in formal academic language
- Do NOT use bullet points, headings, or markdown formatting
- Do NOT start with "This paper..." or "The authors..." — vary your opening

Return ONLY the summary paragraph, nothing else.`,
            },
            {
                role: 'user',
                content: `Summarize the following research paper abstract into a concise, insightful paragraph:\n\n"""${abstract}"""`,
            },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 0.9,
    });

    const summary = chatCompletion.choices[0]?.message?.content || 'Could not generate summary.';
    return { summary };
}

export async function groqExtractAttributes(
    papers: { title: string; abstract: string }[],
    attributes: string[]
): Promise<{ results: { paperIndex: number; attributes: Record<string, string> }[] }> {
    const client = getGroqClient();

    const papersText = papers
        .map((p, i) => `---\nPaper Index: ${i}\nTitle: ${p.title}\nAbstract: ${p.abstract}\n---`)
        .join('\n');

    const chatCompletion = await client.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a senior research analyst specializing in systematic literature reviews. Extract specific attributes from research papers with high precision and academic rigor. You will receive either full paper text or an abstract — analyze ALL available text thoroughly.

CRITICAL RULES — YOU MUST FOLLOW THESE:
- Read the ENTIRE provided text carefully, not just the first few sentences
- ALWAYS extract exact numbers, percentages, scores, and metrics when they appear anywhere in the text
- For "Accuracy": Report exact values with benchmark names (e.g., "94.3% accuracy on CIFAR-10"). If exact numbers aren't stated, describe comparative performance in detail
- For "Results" / "Key Findings": Include ALL numerical results — percentages, F1 scores, BLEU scores, AUC, precision, recall, speedup factors, p-values, confidence intervals
- For "Methods Used": Name specific algorithms, models, architectures, and frameworks with details (e.g., "Transformer encoder with multi-head attention" not just "deep learning")
- For "Dataset Used": Include dataset names, sizes, and domains when available
- For "Output": Describe the exact deliverable — model, system, framework, or artifact produced
- For "Abstract Summary": Write a rich 3-4 sentence synthesis covering objective, method, key results, and contribution
- For "Limitations": Include both explicitly stated AND reasonably inferred limitations
- For "Research Gap": Identify what was missing in prior work that motivated this study
- For "Future Work": Quote or paraphrase the authors' stated next steps, or infer logical extensions
- NEVER respond with just "Not specified" or "Not quantified" — always provide a substantive answer. If exact numbers aren't available, make reasonable inferences from context (e.g., "Claims state-of-the-art performance on [benchmark], though specific values are not reported in the available text")
- Provide 2-3 detailed sentences per attribute

You MUST respond with valid JSON only, no additional text or explanation.`,
            },
            {
                role: 'user',
                content: `Carefully analyze the following research papers and extract these attributes for each: ${attributes.join(', ')}

Papers to analyze:
${papersText}

Respond with ONLY a JSON object in this exact format:
{"results": [{"paperIndex": 0, "attributes": {"${attributes[0]}": "detailed extracted value", ...}}, ...]}

Important: Use the exact attribute names provided (${attributes.join(', ')}) as keys in the attributes object.`,
            },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 4096,
        top_p: 0.9,
        response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content || '{"results": []}';
    try {
        const parsed = JSON.parse(content);
        return parsed;
    } catch {
        console.error('Failed to parse Groq response:', content);
        return { results: [] };
    }
}

