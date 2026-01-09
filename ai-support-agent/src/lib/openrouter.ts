import OpenAI from "openai";

// Lazy initialization to avoid errors at build time
let _openrouter: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
    if (!_openrouter) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error(
                "OPENROUTER_API_KEY is not set. Please add it to your .env file."
            );
        }
        _openrouter = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey,
            defaultHeaders: {
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "AI Support Agent",
            },
        });
    }
    return _openrouter;
}

// Default model - can be overridden via env
export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// Embedding model
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * Generate embeddings for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const client = getOpenRouterClient();
    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
    });

    return response.data[0].embedding;
}

/**
 * Generate a chat completion with optional context
 */
export async function generateChatCompletion(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
) {
    const client = getOpenRouterClient();
    const response = await client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
    });

    return response.choices[0].message.content;
}

/**
 * Stream a chat completion (for real-time responses)
 */
export async function streamChatCompletion(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
) {
    const client = getOpenRouterClient();
    const response = await client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
    });

    return response;
}
