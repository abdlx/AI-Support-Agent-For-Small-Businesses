"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatWidgetProps {
    sessionId?: string;
    onSessionCreated?: (sessionId: string) => void;
    className?: string;
}

export function ChatWidget({
    sessionId: initialSessionId,
    onSessionCreated,
    className,
}: ChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(initialSessionId);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Add placeholder for assistant response
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [
            ...prev,
            { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    sessionId,
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.sessionId && !sessionId) {
                                setSessionId(data.sessionId);
                                onSessionCreated?.(data.sessionId);
                            }

                            if (data.content) {
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: msg.content + data.content }
                                            : msg
                                    )
                                );
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: "Sorry, something went wrong. Please try again." }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-[600px] max-h-[80vh] w-full max-w-xl rounded-2xl border bg-card shadow-2xl overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="relative">
                    <Avatar className="h-10 w-10 bg-primary">
                        <span className="text-primary-foreground font-semibold text-sm">AI</span>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Support Agent</h3>
                    <p className="text-xs text-muted-foreground">Powered by AI • Always online</p>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
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
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <p className="font-medium">How can I help you today?</p>
                            <p className="text-sm mt-1">Ask me anything about our services</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {message.role === "assistant" && (
                                <Avatar className="h-8 w-8 bg-primary shrink-0">
                                    <span className="text-primary-foreground font-semibold text-xs">AI</span>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                    message.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted text-foreground rounded-bl-md"
                                )}
                            >
                                {message.content || (
                                    <span className="inline-flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
                                        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                                    </span>
                                )}
                            </div>
                            {message.role === "user" && (
                                <Avatar className="h-8 w-8 bg-secondary shrink-0">
                                    <span className="text-secondary-foreground font-semibold text-xs">You</span>
                                </Avatar>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 bg-background"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="shrink-0"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    );
}
