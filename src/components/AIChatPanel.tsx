import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Send, Sparkles, Bot, User, Loader2, Trash2, Copy, Check, ChevronDown, Eye, EyeOff, CheckCircle2, Camera, FileText, Brain, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { FileNode } from "@/components/FileExplorer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface AIChatPanelProps {
  onCodeGenerated?: (code: string, filename: string) => void;
  onFilesGenerated?: (files: GeneratedFile[]) => void;
  previewHtml?: string | null;
  onCaptureScreenshot?: () => Promise<{ base64: string; width: number; height: number } | null>;
  projectFiles?: FileNode[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MEMORY_KEY = "codeforge-ai-memory";
const MAX_MEMORY_MESSAGES = 50;

const AI_MODELS = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", description: "Fast & creative" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Good multimodal" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Most powerful" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Fast & capable" },
  { id: "openai/gpt-5", name: "GPT-5", description: "Best reasoning" },
];

// Flatten file tree to get file paths and contents for AI context
const flattenFileTree = (nodes: FileNode[], basePath = ""): ProjectFile[] => {
  const result: ProjectFile[] = [];
  for (const node of nodes) {
    const path = basePath ? `${basePath}/${node.name}` : node.name;
    if (node.type === "file" && node.content) {
      result.push({ path: `/${path}`, content: node.content });
    }
    if (node.children) {
      result.push(...flattenFileTree(node.children, path));
    }
  }
  return result;
};

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: `🧠 **CodeForge AI** — I remember everything we build together.

I'm not just a chatbot — I'm your **AI coding partner** with full project awareness. I can see your files, your preview, and I remember our entire conversation.

**What I can do:**
• 🏗️ Build **complete apps** from a description — social media, e-commerce, dashboards, games
• 🎨 Design with **creative vision** — gradients, animations, glass morphism, dark themes
• 🔧 **Fix bugs** by analyzing your code and preview screenshots
• 🔄 **Iterate** on what exists — I never start from scratch unless you ask
• 📸 **See your preview** — I analyze what's rendered and suggest improvements

**Try me:**
• "Build a Spotify-like music player"
• "Create an Instagram clone with stories"
• "Make a dashboard with charts and stats"
• "Fix the button — it's not working"

What shall we build? 🚀`,
};

const AIChatPanel = ({ onCodeGenerated, onFilesGenerated, previewHtml, onCaptureScreenshot, projectFiles }: AIChatPanelProps) => {
  // Load messages from memory
  const loadMessages = (): Message[] => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [WELCOME_MESSAGE];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [screenshotEnabled, setScreenshotEnabled] = useState(true);
  const [contextEnabled, setContextEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage for memory persistence
  useEffect(() => {
    try {
      const toSave = messages.slice(-MAX_MEMORY_MESSAGES);
      localStorage.setItem(MEMORY_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getPreviewSummary = () => {
    if (!previewHtml) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, "text/html");
    const bodyText = doc.body?.textContent?.trim().slice(0, 500) || "";
    const elements = {
      headings: doc.querySelectorAll("h1, h2, h3").length,
      buttons: doc.querySelectorAll('button, .btn, [role="button"]').length,
      inputs: doc.querySelectorAll("input, textarea, select").length,
      images: doc.querySelectorAll("img").length,
      links: doc.querySelectorAll("a").length,
    };
    return `[PREVIEW STATE] Text: "${bodyText.slice(0, 300)}" | Structure: ${elements.headings} headings, ${elements.buttons} buttons, ${elements.inputs} inputs, ${elements.images} images, ${elements.links} links | HTML size: ${previewHtml.length} chars`;
  };

  // Get project files for AI context
  const getProjectContext = useCallback((): ProjectFile[] => {
    if (!contextEnabled || !projectFiles) return [];
    return flattenFileTree(projectFiles).filter(
      (f) => f.path.match(/\.(tsx?|jsx?|css|html|json)$/) && f.content.length < 5000
    );
  }, [contextEnabled, projectFiles]);

  const streamChat = async (allMessages: Message[], screenshot?: string | null) => {
    let messagesToSend = [...allMessages];

    // Add preview context
    if (previewEnabled && previewHtml) {
      const previewContext = getPreviewSummary();
      if (previewContext) {
        messagesToSend = [
          { role: "user" as const, content: `[SYSTEM CONTEXT: ${previewContext}]` },
          ...messagesToSend,
        ];
      }
    }

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messagesToSend,
        model: selectedModel.id,
        screenshot: screenshot || undefined,
        projectFiles: getProjectContext(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add more credits.");
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!response.body) throw new Error("No response body");

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
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantContent };
              return updated;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const extractCodeBlocks = (content: string): GeneratedFile[] => {
    const files: GeneratedFile[] = [];
    const regex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lang = match[1] || "text";
      const explicitPath = match[2]?.trim();
      const code = match[3]?.trim() || "";
      if (!code) continue;
      let filePath = "";
      if (explicitPath) {
        filePath = explicitPath.startsWith("/") ? explicitPath : `/${explicitPath}`;
      } else {
        const filenameMatch = code.match(/^\/\/\s*(\S+\.\w+)|^#\s*(\S+\.\w+)|^<!--\s*(\S+\.\w+)/);
        if (filenameMatch) {
          const filename = filenameMatch[1] || filenameMatch[2] || filenameMatch[3];
          filePath = `/src/${filename}`;
        } else {
          const extMap: Record<string, string> = { typescript: ".tsx", tsx: ".tsx", javascript: ".js", jsx: ".jsx", html: ".html", css: ".css", json: ".json" };
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
      if (response) {
        const generatedFiles = extractCodeBlocks(response);
        if (generatedFiles.length > 0) {
          if (onFilesGenerated) {
            onFilesGenerated(generatedFiles);
            toast.success(`🚀 Created ${generatedFiles.length} file${generatedFiles.length > 1 ? "s" : ""} automatically!`, {
              description: generatedFiles.map((f) => f.path).join(", "),
            });
          } else if (onCodeGenerated) {
            const { content, path } = generatedFiles[0];
            const filename = path.split("/").pop() || "generated.tsx";
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

  const handleAutoFix = async (errorMessage: string) => {
    if (isLoading) return;
    const fixMessage: Message = {
      role: "user",
      content: `🚨 **Error detected in preview:**\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease analyze and fix this error. Look at the existing project files and generate corrected versions of the affected files only.`,
    };
    const newMessages = [...messages, fixMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const response = await streamChat(newMessages.filter((m) => m.content));
      if (response) {
        const generatedFiles = extractCodeBlocks(response);
        if (generatedFiles.length > 0 && onFilesGenerated) {
          onFilesGenerated(generatedFiles);
          toast.success(`🔧 Auto-fixed ${generatedFiles.length} file(s)!`);
        }
      }
    } catch (error) {
      console.error("Auto-fix error:", error);
      toast.error("Failed to auto-fix");
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfComplete = async () => {
    if (isLoading) return;
    if (!previewEnabled) setPreviewEnabled(true);

    let screenshotBase64: string | null = null;
    if (screenshotEnabled && onCaptureScreenshot) {
      toast.info("📸 Capturing preview screenshot...");
      const result = await onCaptureScreenshot();
      if (result) {
        screenshotBase64 = result.base64;
        toast.success("Screenshot captured!");
      }
    }

    const checkMessage: Message = {
      role: "user",
      content: screenshotBase64
        ? "I've attached a screenshot of the current preview. Analyze it visually:\n1. What has been built (describe what you see)\n2. Does it look correct and polished?\n3. Any visual issues or improvements?\n4. Is the task complete?\n5. Suggest creative enhancements"
        : "Analyze the current preview and check:\n1. What has been built so far\n2. Is it correct and functional?\n3. Any issues or improvements?\n4. Is the task complete?\n5. Suggest creative enhancements",
    };

    const newMessages = [...messages, checkMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const response = await streamChat(newMessages.filter((m) => m.content), screenshotBase64);
      if (response) {
        const generatedFiles = extractCodeBlocks(response);
        if (generatedFiles.length > 0 && onFilesGenerated) {
          onFilesGenerated(generatedFiles);
          toast.success(`🚀 Applied ${generatedFiles.length} improvement(s)!`);
        }
      }
    } catch (error) {
      console.error("Check error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze preview");
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem(MEMORY_KEY);
    toast.success("Memory cleared!");
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const messageCount = messages.filter((m) => m.role === "user").length;

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?(?::([^\n]+))?\n?([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || "";
          const filePath = match[2] || "";
          const code = match[3] || "";
          return (
            <div key={i} className="my-2 rounded-lg overflow-hidden bg-background border border-border">
              <div className="flex items-center justify-between px-3 py-1 bg-secondary/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  {lang || "code"}
                  {filePath && <span className="text-primary font-medium">→ {filePath}</span>}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(code, i)}>
                  {copiedIndex === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <pre className="p-3 overflow-x-auto text-sm font-mono max-h-64">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      // Simple markdown-like formatting
      return (
        <span key={i} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
          __html: part
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-secondary/80 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
            .replace(/^• /gm, '‣ ')
        }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="w-4 h-4 text-primary" />
            {messageCount > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" title="Memory active" />
            )}
          </div>
          <h2 className="text-sm font-semibold">CodeForge AI</h2>
          {messageCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                    <Brain className="w-3 h-3" />
                    {messageCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{messageCount} messages in memory</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                {selectedModel.name}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              {AI_MODELS.map((model) => (
                <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model)} className={selectedModel.id === model.id ? "bg-accent" : ""}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setContextEnabled(!contextEnabled);
                    toast.success(contextEnabled ? "Project context disabled" : "Project context enabled — AI sees all files!");
                  }}
                  className={`h-7 w-7 ${contextEnabled ? "text-green-400 bg-green-400/20" : ""}`}
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{contextEnabled ? "AI sees project files" : "Enable project context"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setPreviewEnabled(!previewEnabled);
              toast.success(previewEnabled ? "Preview sharing disabled" : "Preview sharing enabled!");
            }}
            className={`h-7 w-7 ${previewEnabled ? "text-primary bg-primary/20" : ""}`}
          >
            {previewEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-7 w-7 hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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
              <div className={`max-w-[85%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-primary animate-pulse" />
                <span>Building{contextEnabled ? " (with project context)" : ""}...</span>
              </div>
              <div className="flex gap-1 mt-1">
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
      <div className="p-3 border-t border-border space-y-2">
        {/* Context indicators */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
          {contextEnabled && projectFiles && (
            <span className="flex items-center gap-1 bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded">
              <Brain className="w-3 h-3" /> Files loaded
            </span>
          )}
          {previewEnabled && previewHtml && (
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              <Eye className="w-3 h-3" /> Preview shared
            </span>
          )}
          {messageCount > 3 && (
            <span className="flex items-center gap-1 bg-purple-400/10 text-purple-400 px-1.5 py-0.5 rounded">
              <Sparkles className="w-3 h-3" /> Deep context
            </span>
          )}
        </div>

        {previewHtml && (
          <div className="space-y-2">
            {onCaptureScreenshot && (
              <TooltipProvider>
                <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`p-1 rounded ${!screenshotEnabled ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Text-based analysis</p></TooltipContent>
                    </Tooltip>
                    <Switch id="screenshot-mode" checked={screenshotEnabled} onCheckedChange={(checked) => { setScreenshotEnabled(checked); toast.success(checked ? "Screenshot mode" : "Text mode"); }} className="data-[state=checked]:bg-primary" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`p-1 rounded ${screenshotEnabled ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Screenshot analysis (visual)</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-xs text-muted-foreground">{screenshotEnabled ? "Visual" : "Text"}</span>
                </div>
              </TooltipProvider>
            )}
            <Button onClick={checkIfComplete} disabled={isLoading} variant="outline" size="sm" className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10 hover:border-primary/50">
              {screenshotEnabled && onCaptureScreenshot ? <Camera className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {screenshotEnabled && onCaptureScreenshot ? "Check with Screenshot" : "Check if Complete"}
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe what to build... (Shift+Enter for new line)"
            disabled={isLoading}
            rows={2}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground disabled:opacity-50 resize-none"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary self-end">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
