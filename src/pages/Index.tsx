import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Code, Bot, Sparkles, ArrowRight, Globe, Layers, Terminal, Wifi, WifiOff, Gamepad2, LayoutDashboard, Rocket, ChevronRight, Star, Users, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(p => (p + 1) % 4), 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Code, title: "Smart Editor", description: "Monaco-powered with IntelliSense, multi-cursor, and 30+ language support. Works fully offline.", color: "from-cyan-400 to-blue-500" },
    { icon: Bot, title: "AI Builder", description: "Describe what you want in plain English. The AI understands context and builds full pages instantly.", color: "from-violet-400 to-purple-600" },
    { icon: Globe, title: "Live Preview", description: "Instant hot-reload with responsive testing. See changes as you type across mobile, tablet, and desktop.", color: "from-emerald-400 to-green-600" },
    { icon: Gamepad2, title: "Build Anything", description: "Websites, web apps, dashboards, games — start from templates or let AI generate from scratch.", color: "from-amber-400 to-orange-600" },
  ];

  const stats = [
    { label: "Templates", value: "8+", icon: LayoutDashboard },
    { label: "AI Models", value: "5+", icon: Bot },
    { label: "Languages", value: "30+", icon: Code },
    { label: "Export Options", value: "GitHub & GitLab", icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] animate-gradient" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] animate-gradient" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-success/5 rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">CodeForge</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">AI IDE</span>
          </motion.div>

          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              {isOnline ? (
                <><Wifi className="w-3.5 h-3.5 text-success" /><span className="text-xs text-success">Online</span></>
              ) : (
                <><WifiOff className="w-3.5 h-3.5 text-warning" /><span className="text-xs text-warning">Offline</span></>
              )}
            </div>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">Docs</Button>
            <Button onClick={() => navigate("/ide")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-primary-foreground font-medium text-sm">
              Launch IDE
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-16 pb-24">
        <motion.div className="text-center max-w-5xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered • Online & Offline • Build Anything</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            The IDE That
            <br />
            <span className="text-gradient">Builds For You</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Create websites, web apps, dashboards, and games with an AI that truly understands what you want.
            Works online with AI or offline with full editing power.
          </p>

          {/* Project Creation */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Name your project..."
                className="w-full px-5 py-3.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
              />
            </div>
            <Button
              onClick={() => navigate("/ide")}
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 h-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-primary-foreground font-semibold rounded-xl"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Building
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground/60">No account needed • Free to use • Export to GitHub & GitLab</p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl glass border border-border/30">
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div className="mt-24" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to <span className="text-gradient">Ship Fast</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  activeFeature === index
                    ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-border/30 bg-card/30 hover:border-primary/20"
                }`}
                onClick={() => setActiveFeature(index)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                {activeFeature === index && (
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" layoutId="featureHighlight" />
                )}
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* IDE Preview */}
        <motion.div className="mt-24 relative" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-border/30 overflow-hidden shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-3 bg-sidebar/80 border-b border-border/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-mono">CodeForge AI IDE</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-success/10">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-success">AI Ready</span>
              </div>
            </div>
            <div className="h-80 bg-editor/50 flex">
              {/* Fake sidebar */}
              <div className="w-48 border-r border-border/20 p-3 hidden md:block">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Explorer</div>
                {["📁 src", "  📁 components", "    📄 Button.tsx", "    📄 Header.tsx", "  📄 App.tsx", "  📄 main.tsx", "📄 package.json"].map((f, i) => (
                  <div key={i} className={`text-xs py-0.5 font-mono ${i === 4 ? "text-primary" : "text-muted-foreground/70"}`}>{f}</div>
                ))}
              </div>
              {/* Fake editor */}
              <div className="flex-1 p-4 font-mono text-xs leading-relaxed">
                <div><span className="text-syntax-keyword">import</span> <span className="text-foreground">React</span> <span className="text-syntax-keyword">from</span> <span className="text-syntax-string">'react'</span>;</div>
                <div className="mt-1"><span className="text-syntax-keyword">import</span> {"{"} <span className="text-foreground">Header</span> {"}"} <span className="text-syntax-keyword">from</span> <span className="text-syntax-string">'./components/Header'</span>;</div>
                <div className="mt-3"><span className="text-syntax-keyword">function</span> <span className="text-syntax-function">App</span>() {"{"}</div>
                <div className="ml-4"><span className="text-syntax-keyword">return</span> (</div>
                <div className="ml-8 text-muted-foreground/50">{"<"}div className=<span className="text-syntax-string">"min-h-screen"</span>{">"}</div>
                <div className="ml-12"><span className="text-primary/50 animate-pulse">▊</span> <span className="text-muted-foreground/30 italic">AI is writing...</span></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="mt-24 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Jump into the IDE and start creating. No setup, no friction.</p>
          <Button onClick={() => navigate("/ide")} size="lg" className="px-10 py-4 h-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-primary-foreground font-semibold text-lg rounded-xl">
            Open CodeForge IDE
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 CodeForge AI IDE — Build websites, apps & games with AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
