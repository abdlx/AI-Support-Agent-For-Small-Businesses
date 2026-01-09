import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/openrouter";
import { addEmbeddings, deleteDocumentEmbeddings } from "@/lib/vector-store";

// Simple text chunking function
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start = end - overlap;

        // Prevent infinite loop for very small texts
        if (start >= text.length - overlap) break;
    }

    return chunks.filter((chunk) => chunk.trim().length > 0);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        // Create the document in the database
        const document = await prisma.document.create({
            data: {
                title,
                content,
            },
        });

        // Chunk the content
        const textChunks = chunkText(content);

        // Create chunks in database and generate embeddings
        const embeddingRecords: {
            id: string;
            documentId: string;
            chunkId: string;
            content: string;
            vector: number[];
        }[] = [];

        for (let i = 0; i < textChunks.length; i++) {
            const chunkContent = textChunks[i];

            // Create chunk in database
            const chunk = await prisma.documentChunk.create({
                data: {
                    documentId: document.id,
                    content: chunkContent,
                    chunkIndex: i,
                },
            });

            // Generate embedding
            const embedding = await generateEmbedding(chunkContent);

            embeddingRecords.push({
                id: `${document.id}-${chunk.id}`,
                documentId: document.id,
                chunkId: chunk.id,
                content: chunkContent,
                vector: embedding,
            });
        }

        // Store embeddings in vector database
        if (embeddingRecords.length > 0) {
            await addEmbeddings(embeddingRecords);
        }

        return NextResponse.json({
            success: true,
            document: {
                id: document.id,
                title: document.title,
                chunksCreated: textChunks.length,
            },
        });
    } catch (error) {
        console.error("Ingest error:", error);
        return NextResponse.json(
            { error: "Failed to ingest document" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const documents = await prisma.document.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { chunks: true },
                },
            },
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("Get documents error:", error);
        return NextResponse.json(
            { error: "Failed to get documents" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Document ID is required" },
                { status: 400 }
            );
        }

        // Delete from vector store first
        await deleteDocumentEmbeddings(id);

        // Delete from database (cascades to chunks)
        await prisma.document.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete document error:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
