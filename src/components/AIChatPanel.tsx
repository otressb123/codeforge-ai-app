import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2, Trash2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface AIChatPanelProps {
  onCodeGenerated?: (code: string, filename: string) => void;
  onFilesGenerated?: (files: GeneratedFile[]) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const AIChatPanel = ({ onCodeGenerated, onFilesGenerated }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI coding agent - just like Cursor!\n\nTell me what to build and I'll **automatically generate all the files** for your project.\n\nExamples:\n• \"Build me a landing page for a SaaS product\"\n• \"Create a todo app with local storage\"\n• \"Make a portfolio website\"\n\nWhat would you like me to build?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (allMessages: Message[]) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add more credits.");
      }
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev.slice(0, -1), { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          // Incomplete JSON, put back and wait
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  // Extract code blocks with file paths from AI response (Cursor-style format)
  const extractCodeBlocks = (content: string): GeneratedFile[] => {
    const files: GeneratedFile[] = [];
    // Match ```language:path/to/file.ext or ```language format
    const regex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const lang = match[1] || "text";
      const explicitPath = match[2]?.trim();
      const code = match[3]?.trim() || "";
      
      if (!code) continue;
      
      let filePath = "";
      
      if (explicitPath) {
        // Use the explicit path from the code block header
        filePath = explicitPath.startsWith("/") ? explicitPath : `/${explicitPath}`;
      } else {
        // Try to detect filename from first line comment
        const filenameMatch = code.match(/^\/\/\s*(\S+\.\w+)|^#\s*(\S+\.\w+)|^<!--\s*(\S+\.\w+)/);
        if (filenameMatch) {
          const filename = filenameMatch[1] || filenameMatch[2] || filenameMatch[3];
          filePath = `/src/${filename}`;
        } else {
          // Generate filename based on language
          const extMap: Record<string, string> = {
            typescript: ".tsx",
            tsx: ".tsx",
            javascript: ".js",
            jsx: ".jsx",
            html: ".html",
            css: ".css",
            json: ".json",
            python: ".py",
          };
          const ext = extMap[lang] || ".txt";
          filePath = `/src/generated-${Date.now()}${ext}`;
        }
      }
      
      files.push({ path: filePath, content: code, language: lang });
    }
    
    return files;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await streamChat(newMessages.filter((m) => m.content));
      
      // Extract and auto-create all files
      if (response) {
        const generatedFiles = extractCodeBlocks(response);
        
        if (generatedFiles.length > 0) {
          // Use the new bulk file creation callback if available
          if (onFilesGenerated) {
            onFilesGenerated(generatedFiles);
            toast.success(`🚀 Created ${generatedFiles.length} file${generatedFiles.length > 1 ? 's' : ''} automatically!`, {
              description: generatedFiles.map(f => f.path).join(', ')
            });
          } else if (onCodeGenerated) {
            // Fallback to single file creation
            const { content, path } = generatedFiles[0];
            const filename = path.split('/').pop() || 'generated.tsx';
            onCodeGenerated(content, filename);
            toast.success(`Code added to ${filename}`);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to build?",
      },
    ]);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const formatMessage = (content: string) => {
    // Simple code block detection and formatting
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || "";
          const code = match[2] || "";
          return (
            <div key={i} className="my-2 rounded-lg overflow-hidden bg-background border border-border">
              <div className="flex items-center justify-between px-3 py-1 bg-secondary/50 text-xs text-muted-foreground">
                <span>{lang || "code"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(code, i)}
                >
                  {copiedIndex === i ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 overflow-x-auto text-sm font-mono">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">AI Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          className="h-7 w-7 hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {message.role === "assistant" ? formatMessage(message.content) : message.content}
                </div>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask me anything about code..."
            disabled={isLoading}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
