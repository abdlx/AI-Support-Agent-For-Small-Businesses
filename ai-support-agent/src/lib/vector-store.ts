import * as lancedb from "@lancedb/lancedb";
import path from "path";

// LanceDB connection singleton
let db: lancedb.Connection | null = null;

const DB_PATH = path.join(process.cwd(), ".lancedb");
const TABLE_NAME = "document_embeddings";

interface EmbeddingRecord {
    id: string;
    documentId: string;
    chunkId: string;
    content: string;
    vector: number[];
}

/**
 * Get or create the LanceDB connection
 */
export async function getVectorDb(): Promise<lancedb.Connection> {
    if (!db) {
        db = await lancedb.connect(DB_PATH);
    }
    return db;
}

/**
 * Get or create the embeddings table
 */
export async function getEmbeddingsTable(): Promise<lancedb.Table> {
    const database = await getVectorDb();
    const tableNames = await database.tableNames();

    if (tableNames.includes(TABLE_NAME)) {
        return database.openTable(TABLE_NAME);
    }

    // Create table with a sample record to infer schema
    // LanceDB infers the schema from the first record
    const sampleRecord = {
        id: "__init__",
        documentId: "__init__",
        chunkId: "__init__",
        content: "__init__",
        vector: new Array(1536).fill(0), // OpenAI embedding dimension
    } as Record<string, unknown>;

    const table = await database.createTable(TABLE_NAME, [sampleRecord]);

    // Delete the init record
    await table.delete('id = "__init__"');

    return table;
}

/**
 * Add embeddings to the vector store
 */
export async function addEmbeddings(
    records: EmbeddingRecord[]
): Promise<void> {
    if (records.length === 0) return;

    const table = await getEmbeddingsTable();
    await table.add(records as unknown as Record<string, unknown>[]);
}

/**
 * Search for similar documents
 */
export async function searchSimilar(
    queryVector: number[],
    limit: number = 5
): Promise<EmbeddingRecord[]> {
    const database = await getVectorDb();
    const tableNames = await database.tableNames();

    // Return empty array if table doesn't exist yet
    if (!tableNames.includes(TABLE_NAME)) {
        return [];
    }

    const table = await database.openTable(TABLE_NAME);

    // Check if table has any records
    const count = await table.countRows();
    if (count === 0) {
        return [];
    }

    const results = await table
        .vectorSearch(queryVector)
        .limit(limit)
        .toArray();

    return results as unknown as EmbeddingRecord[];
}

/**
 * Delete embeddings for a document
 */
export async function deleteDocumentEmbeddings(documentId: string): Promise<void> {
    const database = await getVectorDb();
    const tableNames = await database.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
        return;
    }

    const table = await database.openTable(TABLE_NAME);
    await table.delete(`documentId = "${documentId}"`);
}

/**
 * Get total count of embeddings
 */
export async function getEmbeddingCount(): Promise<number> {
    const database = await getVectorDb();
    const tableNames = await database.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
        return 0;
    }

    const table = await database.openTable(TABLE_NAME);
    return table.countRows();
}
