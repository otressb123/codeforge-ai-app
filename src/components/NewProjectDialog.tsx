import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCode, Globe, Palette, Zap, LayoutDashboard, Gamepad2, ShoppingCart, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { FileNode } from "./FileExplorer";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  files: FileNode[];
}

const templates: Template[] = [
  {
    id: "react",
    name: "React + TypeScript",
    description: "Modern React app with TypeScript and Vite",
    icon: <Zap className="w-6 h-6 text-primary" />,
    files: [
      {
        name: "src",
        type: "folder",
        children: [
          {
            name: "App.tsx",
            type: "file",
            content: `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-gray-400">Start building something amazing!</p>
      </div>
    </div>
  );
}

export default App;`,
          },
          {
            name: "main.tsx",
            type: "file",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          },
          {
            name: "index.css",
            type: "file",
            content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
          },
        ],
      },
      {
        name: "public",
        type: "folder",
        children: [
          {
            name: "index.html",
            type: "file",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        content: `{
  "name": "my-react-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
      },
    ],
  },
  {
    id: "html",
    name: "HTML/CSS/JS",
    description: "Simple vanilla web project",
    icon: <Globe className="w-6 h-6 text-accent" />,
    files: [
      {
        name: "index.html",
        type: "file",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
    <nav>
      <a href="#">Home</a>
      <a href="#">About</a>
      <a href="#">Contact</a>
    </nav>
  </header>
  <main>
    <p>Start building your website here!</p>
    <button id="clickMe">Click Me</button>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: "styles.css",
        type: "file",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: white;
}

header {
  padding: 2rem;
  text-align: center;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

nav a {
  color: #00d9ff;
  text-decoration: none;
  margin: 0 1rem;
}

nav a:hover {
  text-decoration: underline;
}

main {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

button {
  background: linear-gradient(135deg, #00d9ff, #8b5cf6);
  border: none;
  padding: 1rem 2rem;
  color: white;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}

button:hover {
  opacity: 0.9;
}`,
      },
      {
        name: "script.js",
        type: "file",
        content: `document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('clickMe');
  
  button.addEventListener('click', () => {
    alert('Hello from JavaScript!');
  });
});`,
      },
    ],
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Beautiful landing page template",
    icon: <Palette className="w-6 h-6 text-warning" />,
    files: [
      {
        name: "index.html",
        type: "file",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landing Page</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="navbar">
    <div class="logo">Brand</div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#contact">Contact</a>
      <button class="btn-primary">Get Started</button>
    </div>
  </nav>
  
  <section class="hero">
    <h1>Build Something Amazing</h1>
    <p>Create beautiful websites and applications with our powerful platform</p>
    <div class="hero-buttons">
      <button class="btn-primary">Start Free Trial</button>
      <button class="btn-secondary">Learn More</button>
    </div>
  </section>
  
  <section id="features" class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h3>⚡ Fast</h3>
        <p>Lightning fast performance</p>
      </div>
      <div class="feature-card">
        <h3>🔒 Secure</h3>
        <p>Enterprise-grade security</p>
      </div>
      <div class="feature-card">
        <h3>📱 Responsive</h3>
        <p>Works on all devices</p>
      </div>
    </div>
  </section>
</body>
</html>`,
      },
      {
        name: "styles.css",
        type: "file",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0a0a0a;
  color: white;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 5%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
  position: fixed;
  width: 100%;
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #00d9ff, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: #888;
  text-decoration: none;
}

.nav-links a:hover {
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #00d9ff, #8b5cf6);
  border: none;
  padding: 0.75rem 1.5rem;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #333;
  padding: 0.75rem 1.5rem;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.hero h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  font-size: 1.25rem;
  color: #888;
  margin-bottom: 2rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.features {
  padding: 5rem 5%;
  text-align: center;
}

.features h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: #111;
  border: 1px solid #222;
  padding: 2rem;
  border-radius: 12px;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #888;
}`,
      },
    ],
  },
  {
    id: "dashboard",
    name: "Dashboard App",
    description: "Admin dashboard with charts and tables",
    icon: <LayoutDashboard className="w-6 h-6 text-primary" />,
    files: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "App.tsx", type: "file", content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div style={{minHeight:'100vh',background:'#0f172a',color:'white',fontFamily:'system-ui'}}>\n      <nav style={{padding:'1rem 2rem',borderBottom:'1px solid #1e293b',display:'flex',justifyContent:'space-between',alignItems:'center'}}>\n        <h1 style={{fontSize:'1.25rem',fontWeight:'bold'}}>📊 Dashboard</h1>\n        <span style={{color:'#94a3b8',fontSize:'0.875rem'}}>Welcome back</span>\n      </nav>\n      <main style={{padding:'2rem',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'1.5rem'}}>\n        <div style={{background:'#1e293b',borderRadius:'12px',padding:'1.5rem'}}>\n          <p style={{color:'#94a3b8',fontSize:'0.875rem'}}>Total Users</p>\n          <h2 style={{fontSize:'2rem',fontWeight:'bold',margin:'0.5rem 0'}}>12,482</h2>\n          <span style={{color:'#22c55e',fontSize:'0.875rem'}}>↑ 12.5%</span>\n        </div>\n        <div style={{background:'#1e293b',borderRadius:'12px',padding:'1.5rem'}}>\n          <p style={{color:'#94a3b8',fontSize:'0.875rem'}}>Revenue</p>\n          <h2 style={{fontSize:'2rem',fontWeight:'bold',margin:'0.5rem 0'}}>$48,250</h2>\n          <span style={{color:'#22c55e',fontSize:'0.875rem'}}>↑ 8.3%</span>\n        </div>\n        <div style={{background:'#1e293b',borderRadius:'12px',padding:'1.5rem'}}>\n          <p style={{color:'#94a3b8',fontSize:'0.875rem'}}>Active Projects</p>\n          <h2 style={{fontSize:'2rem',fontWeight:'bold',margin:'0.5rem 0'}}>34</h2>\n          <span style={{color:'#ef4444',fontSize:'0.875rem'}}>↓ 2.1%</span>\n        </div>\n      </main>\n    </div>\n  );\n}\n\nexport default App;` },
          { name: "main.tsx", type: "file", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);` },
        ],
      },
      { name: "package.json", type: "file", content: `{\n  "name": "dashboard-app",\n  "version": "1.0.0",\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" }\n}` },
    ],
  },
  {
    id: "game",
    name: "Canvas Game",
    description: "Simple browser game with HTML5 Canvas",
    icon: <Gamepad2 className="w-6 h-6 text-accent" />,
    files: [
      {
        name: "index.html",
        type: "file",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Canvas Game</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <div class="game-container">\n    <h1>🎮 Space Shooter</h1>\n    <canvas id="gameCanvas" width="600" height="400"></canvas>\n    <p>Use ← → arrows to move, Space to shoot</p>\n  </div>\n  <script src="game.js"></script>\n</body>\n</html>`,
      },
      {
        name: "styles.css",
        type: "file",
        content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { background: #0a0a0a; color: white; font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; }\n.game-container { text-align: center; }\nh1 { margin-bottom: 1rem; font-size: 2rem; }\ncanvas { border: 2px solid #333; border-radius: 8px; background: #111; display: block; margin: 0 auto; }\np { margin-top: 1rem; color: #666; font-size: 0.875rem; }`,
      },
      {
        name: "game.js",
        type: "file",
        content: `const canvas = document.getElementById('gameCanvas');\nconst ctx = canvas.getContext('2d');\n\nlet player = { x: 270, y: 360, w: 40, h: 20, speed: 5 };\nlet bullets = [];\nlet enemies = [];\nlet score = 0;\nlet keys = {};\n\ndocument.addEventListener('keydown', e => keys[e.key] = true);\ndocument.addEventListener('keyup', e => keys[e.key] = false);\n\nfunction spawnEnemy() {\n  enemies.push({ x: Math.random() * 560, y: -20, w: 30, h: 30, speed: 1 + Math.random() * 2 });\n}\n\nsetInterval(spawnEnemy, 1000);\n\nfunction update() {\n  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;\n  if (keys['ArrowRight'] && player.x < 560) player.x += player.speed;\n  if (keys[' '] && bullets.length < 5) {\n    bullets.push({ x: player.x + 17, y: player.y, speed: 7 });\n    keys[' '] = false;\n  }\n  bullets = bullets.filter(b => { b.y -= b.speed; return b.y > 0; });\n  enemies = enemies.filter(e => {\n    e.y += e.speed;\n    let hit = bullets.findIndex(b => b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h);\n    if (hit >= 0) { bullets.splice(hit, 1); score += 10; return false; }\n    return e.y < 420;\n  });\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, 600, 400);\n  ctx.fillStyle = '#00d9ff';\n  ctx.fillRect(player.x, player.y, player.w, player.h);\n  ctx.fillStyle = '#ff6b6b';\n  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));\n  ctx.fillStyle = '#8b5cf6';\n  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));\n  ctx.fillStyle = 'white';\n  ctx.font = '14px system-ui';\n  ctx.fillText('Score: ' + score, 10, 20);\n}\n\nfunction loop() { update(); draw(); requestAnimationFrame(loop); }\nloop();`,
      },
    ],
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Product showcase with cart UI",
    icon: <ShoppingCart className="w-6 h-6 text-success" />,
    files: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "App.tsx", type: "file", content: `import React, { useState } from 'react';\n\nconst products = [\n  { id: 1, name: 'Wireless Headphones', price: 79.99, emoji: '🎧' },\n  { id: 2, name: 'Smart Watch', price: 199.99, emoji: '⌚' },\n  { id: 3, name: 'Laptop Stand', price: 49.99, emoji: '💻' },\n  { id: 4, name: 'USB-C Hub', price: 39.99, emoji: '🔌' },\n];\n\nfunction App() {\n  const [cart, setCart] = useState<number[]>([]);\n  const addToCart = (id: number) => setCart(prev => [...prev, id]);\n  const total = cart.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price || 0), 0);\n\n  return (\n    <div style={{minHeight:'100vh',background:'#0f172a',color:'white',fontFamily:'system-ui'}}>\n      <nav style={{padding:'1rem 2rem',borderBottom:'1px solid #1e293b',display:'flex',justifyContent:'space-between'}}>\n        <h1 style={{fontSize:'1.25rem'}}>🛍️ TechShop</h1>\n        <span>🛒 {cart.length} items · \${total.toFixed(2)}</span>\n      </nav>\n      <main style={{padding:'2rem',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1.5rem',maxWidth:'900px',margin:'0 auto'}}>\n        {products.map(p => (\n          <div key={p.id} style={{background:'#1e293b',borderRadius:'12px',padding:'1.5rem',textAlign:'center'}}>\n            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>{p.emoji}</div>\n            <h3 style={{marginBottom:'0.5rem'}}>{p.name}</h3>\n            <p style={{color:'#22c55e',fontSize:'1.25rem',fontWeight:'bold',marginBottom:'1rem'}}>\${p.price}</p>\n            <button onClick={() => addToCart(p.id)} style={{background:'linear-gradient(135deg,#00d9ff,#8b5cf6)',border:'none',color:'white',padding:'0.5rem 1.5rem',borderRadius:'8px',cursor:'pointer',fontWeight:'500'}}>Add to Cart</button>\n          </div>\n        ))}\n      </main>\n    </div>\n  );\n}\n\nexport default App;` },
          { name: "main.tsx", type: "file", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);` },
        ],
      },
      { name: "package.json", type: "file", content: `{\n  "name": "ecommerce-app",\n  "version": "1.0.0",\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" }\n}` },
    ],
  },
  {
    id: "ai-app",
    name: "AI Chat App",
    description: "AI-powered chatbot interface",
    icon: <Bot className="w-6 h-6 text-primary" />,
    files: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "App.tsx", type: "file", content: `import React, { useState } from 'react';\n\nfunction App() {\n  const [messages, setMessages] = useState([{role:'assistant',content:'Hello! How can I help you today?'}]);\n  const [input, setInput] = useState('');\n\n  const send = () => {\n    if (!input.trim()) return;\n    setMessages(prev => [...prev, {role:'user',content:input}, {role:'assistant',content:'Thanks for your message! This is a demo response. Connect me to an AI backend to make me smart! 🧠'}]);\n    setInput('');\n  };\n\n  return (\n    <div style={{minHeight:'100vh',background:'#0f172a',color:'white',fontFamily:'system-ui',display:'flex',flexDirection:'column'}}>\n      <nav style={{padding:'1rem 2rem',borderBottom:'1px solid #1e293b'}}>\n        <h1 style={{fontSize:'1.25rem'}}>🤖 AI Assistant</h1>\n      </nav>\n      <div style={{flex:1,padding:'1rem 2rem',overflowY:'auto',display:'flex',flexDirection:'column',gap:'0.75rem'}}>\n        {messages.map((m,i) => (\n          <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',background:m.role==='user'?'#3b82f6':'#1e293b',padding:'0.75rem 1rem',borderRadius:'12px',maxWidth:'70%'}}>\n            {m.content}\n          </div>\n        ))}\n      </div>\n      <div style={{padding:'1rem 2rem',borderTop:'1px solid #1e293b',display:'flex',gap:'0.5rem'}}>\n        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message..." style={{flex:1,background:'#1e293b',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',color:'white',outline:'none'}} />\n        <button onClick={send} style={{background:'linear-gradient(135deg,#00d9ff,#8b5cf6)',border:'none',color:'white',padding:'0.75rem 1.5rem',borderRadius:'8px',cursor:'pointer'}}>Send</button>\n      </div>\n    </div>\n  );\n}\n\nexport default App;` },
          { name: "main.tsx", type: "file", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);` },
        ],
      },
      { name: "package.json", type: "file", content: `{\n  "name": "ai-chat-app",\n  "version": "1.0.0",\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" }\n}` },
    ],
  },
  {
    id: "empty",
    name: "Empty Project",
    description: "Start from scratch",
    icon: <FileCode className="w-6 h-6 text-muted-foreground" />,
    files: [
      {
        name: "index.html",
        type: "file",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
      },
    ],
  },
];

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string, files: FileNode[]) => void;
}

const NewProjectDialog = ({ open, onOpenChange, onCreateProject }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState("my-new-project");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("react");

  const handleCreate = () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (template) {
      onCreateProject(projectName, template.files);
      onOpenChange(false);
      setProjectName("my-new-project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Project</DialogTitle>
          <DialogDescription>Choose a template and name for your project</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:border-muted-foreground"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {template.icon}
                    <span className="font-medium text-sm">{template.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;