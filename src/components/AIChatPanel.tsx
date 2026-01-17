import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  onCodeGenerated?: (code: string, filename: string) => void;
}

const AIChatPanel = ({ onCodeGenerated }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI coding assistant. I can help you:\n\n• Generate code for new features\n• Explain existing code\n• Debug issues\n• Suggest improvements\n\nWhat would you like to build today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, this would call an AI API)
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: generateMockResponse(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes("button")) {
      return `Here's a beautiful button component:\n\n\`\`\`tsx\nimport { motion } from "framer-motion";\n\nconst GradientButton = ({ children, onClick }) => (\n  <motion.button\n    className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-medium"\n    whileHover={{ scale: 1.05 }}\n    whileTap={{ scale: 0.95 }}\n    onClick={onClick}\n  >\n    {children}\n  </motion.button>\n);\n\`\`\`\n\nWould you like me to add this to your project?`;
    }
    
    if (lowerPrompt.includes("navbar") || lowerPrompt.includes("navigation")) {
      return `I'll create a modern navigation component for you:\n\n\`\`\`tsx\nconst Navbar = () => (\n  <nav className="fixed top-0 w-full glass px-6 py-4">\n    <div className="flex items-center justify-between">\n      <Logo />\n      <NavLinks />\n      <AuthButtons />\n    </div>\n  </nav>\n);\n\`\`\`\n\nShall I implement the full navbar with all subcomponents?`;
    }
    
    return `I understand you want to work on: "${prompt}"\n\nI can help you with that! Here are some suggestions:\n\n1. **Component Structure** - I'll create modular, reusable components\n2. **Styling** - Using Tailwind CSS with your design system\n3. **Animations** - Smooth transitions with Framer Motion\n\nWould you like me to generate the code for this?`;
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to build?",
      },
    ]);
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
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {message.content}
                </pre>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
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
            placeholder="Describe what you want to build..."
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
