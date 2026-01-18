import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCode, Globe, Palette, Zap } from "lucide-react";
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
    id: "empty",
    name: "Empty Project",
    description: "Start from scratch",
    icon: <FileCode className="w-6 h-6 text-muted-foreground" />,
    files: [
      {
        name: "index.html",
        type: "file",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Project</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
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