import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Code, Bot, Sparkles, ArrowRight, Globe, Layers, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");

  const features = [
    {
      icon: Code,
      title: "Smart Code Editor",
      description: "Monaco-powered editor with syntax highlighting, auto-complete, and intelligent suggestions.",
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Built-in AI that helps you write, debug, and understand code with natural language.",
    },
    {
      icon: Globe,
      title: "Live Preview",
      description: "See your changes instantly with hot reload and responsive design testing.",
    },
    {
      icon: Terminal,
      title: "Integrated Terminal",
      description: "Run commands, install packages, and manage your project without leaving the IDE.",
    },
  ];

  const handleCreateProject = () => {
    navigate("/ide");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">CodeForge</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Docs
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Button>
            <Button onClick={handleCreateProject} className="bg-primary hover:bg-primary/90 glow-primary">
              Get Started
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Development</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build Apps with
            <span className="text-gradient"> AI-Powered</span>
            <br />Code Intelligence
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create stunning web applications in minutes. CodeForge combines a powerful code editor
            with AI assistance to supercharge your development workflow.
          </p>

          {/* Project Creation */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full sm:w-80 px-6 py-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleCreateProject}
              size="lg"
              className="w-full sm:w-auto px-8 py-4 h-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-primary-foreground font-semibold"
            >
              Create Project
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Preview */}
        <motion.div
          className="mt-32 relative"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-border overflow-hidden shadow-2xl bg-card">
            <div className="flex items-center gap-2 px-4 py-3 bg-sidebar border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">CodeForge IDE</span>
            </div>
            <div className="h-96 bg-editor flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <p className="text-muted-foreground">Click "Create Project" to start building</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 CodeForge. Built with ❤️ for developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
