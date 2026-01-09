import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding, streamChatCompletion } from "@/lib/openrouter";
import { searchSimilar } from "@/lib/vector-store";

const SYSTEM_PROMPT = `You are a helpful AI support agent. Your role is to answer questions based on the knowledge base provided to you as context.

Guidelines:
- Only answer questions based on the provided context
- If the context doesn't contain relevant information, politely say you don't have that information
- Be concise but helpful
- If asked about something outside your knowledge base, suggest the user contact human support
- Always maintain a professional and friendly tone`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, sessionId } = body;

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Get or create chat session
        let session;
        if (sessionId) {
            session = await prisma.chatSession.findUnique({
                where: { id: sessionId },
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                        take: 10, // Last 10 messages for context
                    },
                },
            });
        }

        if (!session) {
            session = await prisma.chatSession.create({
                data: {
                    title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
                },
                include: { messages: true },
            });
        }

        // Store user message
        await prisma.message.create({
            data: {
                chatSessionId: session.id,
                role: "user",
                content: message,
            },
        });

        // Generate embedding for the user's message
        const queryEmbedding = await generateEmbedding(message);

        // Search for relevant context
        const relevantChunks = await searchSimilar(queryEmbedding, 3);

        // Build context from relevant chunks
        const context = relevantChunks.length > 0
            ? relevantChunks.map((chunk) => chunk.content).join("\n\n---\n\n")
            : "No relevant information found in the knowledge base.";

        // Build conversation history
        const conversationHistory = session.messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

        // Create messages array for the LLM
        const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "system",
                content: `Here is relevant context from the knowledge base:\n\n${context}`,
            },
            ...conversationHistory,
            { role: "user", content: message },
        ];

        // Stream the response
        const stream = await streamChatCompletion(messages);

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        let fullResponse = "";

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content, sessionId: session.id })}\n\n`)
                            );
                        }
                    }

                    // Store assistant response
                    await prisma.message.create({
                        data: {
                            chatSessionId: session.id,
                            role: "assistant",
                            content: fullResponse,
                        },
                    });

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to process chat message" },
            { status: 500 }
        );
    }
}

// Get chat history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");

        if (sessionId) {
            const session = await prisma.chatSession.findUnique({
                where: { id: sessionId },
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            });

            return NextResponse.json({ session });
        }

        // Return all sessions
        const sessions = await prisma.chatSession.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Get chat error:", error);
        return NextResponse.json(
            { error: "Failed to get chat history" },
            { status: 500 }
        );
    }
}
