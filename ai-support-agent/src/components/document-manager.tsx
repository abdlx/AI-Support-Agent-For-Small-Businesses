"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    _count: {
        chunks: number;
    };
}

export function DocumentManager() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: "", content: "" });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const fetchDocuments = async () => {
        try {
            const response = await fetch("/api/ingest");
            const data = await response.json();
            setDocuments(data.documents || []);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const addDocument = async () => {
        if (!newDoc.title.trim() || !newDoc.content.trim()) return;

        setIsAddingDoc(true);
        try {
            const response = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDoc),
            });

            if (!response.ok) throw new Error("Failed to add document");

            setNewDoc({ title: "", content: "" });
            setIsDialogOpen(false);
            fetchDocuments();
        } catch (error) {
            console.error("Failed to add document:", error);
        } finally {
            setIsAddingDoc(false);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            const response = await fetch(`/api/ingest?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete document");

            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadedFiles(acceptedFiles);

        // Auto-populate from first file
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target?.result as string;
                setNewDoc({
                    title: file.name.replace(/\.(txt|md|csv)$/i, ""),
                    content: content,
                });
            };

            reader.readAsText(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'text/markdown': ['.md'],
            'text/csv': ['.csv'],
        },
        multiple: false,
    });

    const uploadFiles = async () => {
        if (uploadedFiles.length === 0) return;

        setIsAddingDoc(true);
        try {
            for (const file of uploadedFiles) {
                const content = await file.text();
                const response = await fetch("/api/ingest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: file.name.replace(/\.(txt|md|csv)$/i, ""),
                        content,
                    }),
                });

                if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
            }

            setUploadedFiles([]);
            setNewDoc({ title: "", content: "" });
            setIsDialogOpen(false);
            fetchDocuments();
        } catch (error) {
            console.error("Failed to upload files:", error);
        } finally {
            setIsAddingDoc(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
                    <p className="text-muted-foreground">
                        Manage FAQs and documents that power your AI support agent
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Document</DialogTitle>
                            <DialogDescription>
                                Add a new document to your knowledge base. Upload a file or enter content manually.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload File</TabsTrigger>
                                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="space-y-4">
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                            ? "border-primary bg-primary/5"
                                            : "border-muted-foreground/25 hover:border-primary/50"
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="flex flex-col items-center gap-2">
                                        <svg
                                            className="w-12 h-12 text-muted-foreground"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        {isDragActive ? (
                                            <p className="text-sm font-medium">Drop the file here...</p>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium">
                                                    Drag & drop a file here, or click to select
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Supports .txt, .md, and .csv files
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Selected File</label>
                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                            <svg
                                                className="w-5 h-5 text-primary"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            <span className="text-sm flex-1">{uploadedFiles[0].name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setUploadedFiles([])}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label htmlFor="upload-title" className="text-sm font-medium">
                                                Title (optional - auto-filled from filename)
                                            </label>
                                            <Input
                                                id="upload-title"
                                                placeholder="Document title"
                                                value={newDoc.title}
                                                onChange={(e) =>
                                                    setNewDoc((prev) => ({ ...prev, title: e.target.value }))
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={uploadFiles}
                                        disabled={isAddingDoc || uploadedFiles.length === 0}
                                    >
                                        {isAddingDoc ? "Processing..." : "Upload & Index"}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-sm font-medium">
                                        Title
                                    </label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Password Reset FAQ"
                                        value={newDoc.title}
                                        onChange={(e) =>
                                            setNewDoc((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="content" className="text-sm font-medium">
                                        Content
                                    </label>
                                    <Textarea
                                        id="content"
                                        placeholder="Enter the document content. This can be FAQs, product information, help articles, etc."
                                        rows={10}
                                        value={newDoc.content}
                                        onChange={(e) =>
                                            setNewDoc((prev) => ({ ...prev, content: e.target.value }))
                                        }
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={addDocument}
                                        disabled={isAddingDoc || !newDoc.title.trim() || !newDoc.content.trim()}
                                    >
                                        {isAddingDoc ? "Processing..." : "Add Document"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-5 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">No documents yet</h3>
                        <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                            Add your first document to start training your AI support agent
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            Add Your First Document
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                                        onClick={() => deleteDocument(doc.id)}
                                    >
                                        <svg
                                            className="w-4 h-4 text-destructive"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </Button>
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {doc._count.chunks} chunks
                                    </Badge>
                                    <span className="text-xs">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {doc.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
