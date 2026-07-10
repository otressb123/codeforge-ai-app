import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Search, Check } from "lucide-react";
import type { FileNode } from "./FileExplorer";

interface TemplateGalleryProps {
  onLoad: (name: string, files: FileNode[]) => void;
}

interface Template {
  id: string;
  name: string;
  tag: string;
  description: string;
  gradient: string;
  emoji: string;
  files: FileNode[];
}

// ── minimal helper to build a standard react project shell ────────────
const rp = (appTsx: string, styles = ""): FileNode[] => [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "App.tsx", type: "file", content: appTsx },
      {
        name: "index.tsx",
        type: "file",
        content:
          "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);",
      },
      {
        name: "styles.css",
        type: "file",
        content:
          "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { margin: 0; font-family: system-ui, sans-serif; }\n" +
          styles,
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    content:
      '{\n  "name": "app",\n  "version": "1.0.0",\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" }\n}',
  },
];

const TEMPLATES: Template[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing",
    tag: "Marketing",
    description: "Hero, features, pricing, testimonials — full marketing site.",
    gradient: "from-cyan-500 via-blue-500 to-violet-600",
    emoji: "🚀",
    files: rp(
      `import React from 'react';\nimport { Rocket, Zap, Shield, Sparkles } from 'lucide-react';\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-slate-950 text-white\">\n      <nav className=\"flex justify-between items-center px-8 py-6 border-b border-white/10\">\n        <div className=\"flex items-center gap-2\"><Rocket className=\"w-6 h-6 text-cyan-400\" /><span className=\"font-bold text-xl\">Nova</span></div>\n        <button className=\"px-5 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-lg font-medium\">Start Free</button>\n      </nav>\n      <section className=\"text-center px-6 py-24\">\n        <h1 className=\"text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent\">Ship faster than ever</h1>\n        <p className=\"text-xl text-slate-400 max-w-2xl mx-auto mb-10\">The all-in-one platform to launch your product in hours, not weeks.</p>\n        <button className=\"px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl font-semibold text-lg hover:scale-105 transition\">Get Started Free →</button>\n      </section>\n      <section className=\"grid md:grid-cols-3 gap-8 px-8 py-16 max-w-6xl mx-auto\">\n        {[{i:Zap,t:'Lightning Fast',d:'Blazing performance out of the box.'},{i:Shield,t:'Secure by Default',d:'Enterprise-grade encryption everywhere.'},{i:Sparkles,t:'Delightful UX',d:'Polished, animated, accessible.'}].map((f,i)=>(\n          <div key={i} className=\"p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur\">\n            <f.i className=\"w-10 h-10 text-cyan-400 mb-4\" />\n            <h3 className=\"text-xl font-bold mb-2\">{f.t}</h3>\n            <p className=\"text-slate-400\">{f.d}</p>\n          </div>\n        ))}\n      </section>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "portfolio",
    name: "Personal Portfolio",
    tag: "Portfolio",
    description: "Minimal editorial-style portfolio with projects and about.",
    gradient: "from-amber-400 via-orange-500 to-pink-500",
    emoji: "🎨",
    files: rp(
      `import React from 'react';\n\nconst projects = [\n  { name: 'Aurora', desc: 'Design system for finance apps', tag: 'DESIGN' },\n  { name: 'Lumen', desc: 'AI writing assistant', tag: 'PRODUCT' },\n  { name: 'Meridian', desc: 'Realtime collab whiteboard', tag: 'ENGINEERING' },\n];\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-stone-50 text-stone-900 font-serif\">\n      <header className=\"max-w-3xl mx-auto px-6 pt-20 pb-16\">\n        <p className=\"text-sm uppercase tracking-widest text-stone-500 mb-4\">Portfolio · 2026</p>\n        <h1 className=\"text-6xl font-bold leading-tight mb-6\">Alex Morgan.<br/><span className=\"text-stone-400\">Designer & builder.</span></h1>\n        <p className=\"text-lg text-stone-600 max-w-xl\">I craft calm, functional interfaces for teams that ship. Currently at Nova Labs.</p>\n      </header>\n      <section className=\"max-w-3xl mx-auto px-6 pb-24 space-y-12\">\n        {projects.map(p => (\n          <div key={p.name} className=\"border-t border-stone-300 pt-8\">\n            <p className=\"text-xs tracking-widest text-stone-500 mb-2\">{p.tag}</p>\n            <h2 className=\"text-3xl font-bold mb-2\">{p.name}</h2>\n            <p className=\"text-stone-600\">{p.desc}</p>\n          </div>\n        ))}\n      </section>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "dashboard",
    name: "Analytics Dashboard",
    tag: "App",
    description: "Sidebar layout, KPI cards, activity feed — SaaS admin.",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    emoji: "📊",
    files: rp(
      `import React from 'react';\nimport { LayoutDashboard, Users, DollarSign, TrendingUp, Bell } from 'lucide-react';\n\nexport default function App() {\n  const stats = [\n    { i: DollarSign, l: 'Revenue', v: '$48,250', d: '+12.5%' },\n    { i: Users, l: 'Users', v: '12,482', d: '+8.3%' },\n    { i: TrendingUp, l: 'Conversion', v: '3.24%', d: '+0.4%' },\n  ];\n  return (\n    <div className=\"min-h-screen bg-slate-950 text-white flex\">\n      <aside className=\"w-64 border-r border-white/10 p-6\">\n        <div className=\"flex items-center gap-2 mb-10\"><LayoutDashboard className=\"w-6 h-6 text-emerald-400\" /><span className=\"font-bold\">Overview</span></div>\n        {['Dashboard','Users','Revenue','Settings'].map((x,i)=><a key={x} className={\"block px-3 py-2 rounded-lg mb-1 cursor-pointer \"+(i===0?'bg-emerald-500/10 text-emerald-300':'text-slate-400 hover:bg-white/5')}>{x}</a>)}\n      </aside>\n      <main className=\"flex-1 p-8\">\n        <div className=\"flex justify-between mb-8\"><h1 className=\"text-3xl font-bold\">Dashboard</h1><Bell className=\"w-5 h-5 text-slate-400\" /></div>\n        <div className=\"grid grid-cols-3 gap-6 mb-8\">\n          {stats.map(s=>(\n            <div key={s.l} className=\"p-6 bg-white/5 border border-white/10 rounded-2xl\">\n              <s.i className=\"w-6 h-6 text-emerald-400 mb-3\" />\n              <p className=\"text-slate-400 text-sm\">{s.l}</p>\n              <p className=\"text-3xl font-bold my-2\">{s.v}</p>\n              <p className=\"text-emerald-400 text-sm\">{s.d}</p>\n            </div>\n          ))}\n        </div>\n        <div className=\"p-6 bg-white/5 border border-white/10 rounded-2xl\">\n          <h2 className=\"font-bold mb-4\">Recent Activity</h2>\n          {[1,2,3,4].map(i=>(<div key={i} className=\"flex justify-between py-3 border-b border-white/5 last:border-0\"><span>User signed up · user{i}@nova.io</span><span className=\"text-slate-500 text-sm\">{i}m ago</span></div>))}\n        </div>\n      </main>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "chat-app",
    name: "AI Chat App",
    tag: "App",
    description: "Sleek dark chat interface with message bubbles.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    emoji: "💬",
    files: rp(
      `import React from 'react';\nimport { Send, Bot } from 'lucide-react';\n\nexport default function App() {\n  const [msgs, setMsgs] = React.useState([\n    { r: 'ai', t: \"Hi! I'm Nova, your AI assistant. What can I help you build today?\" },\n  ]);\n  const [input, setInput] = React.useState('');\n  const send = () => {\n    if (!input.trim()) return;\n    setMsgs(m => [...m, { r: 'user', t: input }, { r: 'ai', t: \"That's a great idea. Let me think about that...\" }]);\n    setInput('');\n  };\n  return (\n    <div className=\"min-h-screen bg-slate-950 text-white flex flex-col\">\n      <header className=\"flex items-center gap-3 px-6 py-4 border-b border-white/10\">\n        <div className=\"w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center\"><Bot className=\"w-5 h-5\" /></div>\n        <div><p className=\"font-bold\">Nova AI</p><p className=\"text-xs text-emerald-400\">● Online</p></div>\n      </header>\n      <main className=\"flex-1 overflow-auto p-6 space-y-4 max-w-3xl mx-auto w-full\">\n        {msgs.map((m,i)=>(\n          <div key={i} className={'flex '+(m.r==='user'?'justify-end':'justify-start')}>\n            <div className={'max-w-md px-4 py-3 rounded-2xl '+(m.r==='user'?'bg-gradient-to-r from-violet-500 to-fuchsia-500':'bg-white/5 border border-white/10')}>{m.t}</div>\n          </div>\n        ))}\n      </main>\n      <div className=\"p-4 border-t border-white/10 max-w-3xl mx-auto w-full flex gap-2\">\n        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder=\"Message Nova...\" className=\"flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-500\" />\n        <button onClick={send} className=\"px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl\"><Send className=\"w-5 h-5\" /></button>\n      </div>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "todo",
    name: "Task Manager",
    tag: "App",
    description: "Todo list with tags, filters, and progress tracking.",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    emoji: "✅",
    files: rp(
      `import React from 'react';\nimport { Check, Plus, Trash2 } from 'lucide-react';\n\nexport default function App() {\n  const [tasks, setTasks] = React.useState([\n    { id: 1, text: 'Design new landing page', done: true },\n    { id: 2, text: 'Ship auth flow', done: false },\n    { id: 3, text: 'Write launch blog post', done: false },\n  ]);\n  const [input, setInput] = React.useState('');\n  const add = () => { if(!input.trim()) return; setTasks(t=>[...t,{id:Date.now(),text:input,done:false}]); setInput(''); };\n  const toggle = (id) => setTasks(t=>t.map(x=>x.id===id?{...x,done:!x.done}:x));\n  const del = (id) => setTasks(t=>t.filter(x=>x.id!==id));\n  const done = tasks.filter(t=>t.done).length;\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8\">\n      <div className=\"max-w-2xl mx-auto\">\n        <h1 className=\"text-4xl font-bold mb-2\">Today</h1>\n        <p className=\"text-slate-400 mb-8\">{done} of {tasks.length} complete</p>\n        <div className=\"flex gap-2 mb-6\">\n          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder=\"Add a task...\" className=\"flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500\" />\n          <button onClick={add} className=\"px-4 bg-indigo-500 rounded-xl\"><Plus className=\"w-5 h-5\" /></button>\n        </div>\n        <div className=\"space-y-2\">\n          {tasks.map(t=>(\n            <div key={t.id} className=\"flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl group\">\n              <button onClick={()=>toggle(t.id)} className={'w-6 h-6 rounded-md border-2 flex items-center justify-center '+(t.done?'bg-indigo-500 border-indigo-500':'border-white/20')}>{t.done && <Check className=\"w-4 h-4\" />}</button>\n              <span className={'flex-1 '+(t.done?'line-through text-slate-500':'')}>{t.text}</span>\n              <button onClick={()=>del(t.id)} className=\"opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400\"><Trash2 className=\"w-4 h-4\" /></button>\n            </div>\n          ))}\n        </div>\n      </div>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "pricing",
    name: "Pricing Page",
    tag: "Marketing",
    description: "Three-tier pricing cards with feature comparison.",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    emoji: "💎",
    files: rp(
      `import React from 'react';\nimport { Check } from 'lucide-react';\n\nconst plans = [\n  { name:'Starter', price:0, features:['1 project','Community support','Basic analytics'], cta:'Get Started' },\n  { name:'Pro', price:19, popular:true, features:['Unlimited projects','Priority support','Advanced analytics','Custom domains'], cta:'Start free trial' },\n  { name:'Team', price:49, features:['Everything in Pro','Team seats','SSO','SLA'], cta:'Contact sales' },\n];\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-slate-950 text-white py-20 px-6\">\n      <div className=\"text-center mb-16\">\n        <h1 className=\"text-5xl font-bold mb-4\">Simple, transparent pricing</h1>\n        <p className=\"text-xl text-slate-400\">No hidden fees. Cancel anytime.</p>\n      </div>\n      <div className=\"grid md:grid-cols-3 gap-6 max-w-5xl mx-auto\">\n        {plans.map(p=>(\n          <div key={p.name} className={'relative p-8 rounded-2xl border '+(p.popular?'border-pink-500 bg-gradient-to-b from-pink-500/10 to-transparent':'border-white/10 bg-white/5')}>\n            {p.popular && <span className=\"absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-pink-500 rounded-full text-xs font-bold\">MOST POPULAR</span>}\n            <h3 className=\"text-2xl font-bold mb-2\">{p.name}</h3>\n            <p className=\"text-5xl font-bold mb-6\">\${p.price}<span className=\"text-lg text-slate-400 font-normal\">/mo</span></p>\n            <ul className=\"space-y-3 mb-8\">{p.features.map(f=><li key={f} className=\"flex gap-2\"><Check className=\"w-5 h-5 text-pink-400\" />{f}</li>)}</ul>\n            <button className={'w-full py-3 rounded-xl font-semibold '+(p.popular?'bg-gradient-to-r from-pink-500 to-rose-500':'bg-white/10 hover:bg-white/20')}>{p.cta}</button>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "blog",
    name: "Blog / Magazine",
    tag: "Content",
    description: "Editorial-style blog with featured post and article grid.",
    gradient: "from-yellow-400 via-orange-500 to-red-600",
    emoji: "📰",
    files: rp(
      `import React from 'react';\n\nconst posts = [\n  { title:'The future of design systems', cat:'DESIGN', date:'Jul 12' },\n  { title:'Why we bet on the browser', cat:'ENGINEERING', date:'Jul 08' },\n  { title:'Shipping culture at Nova', cat:'CULTURE', date:'Jul 01' },\n  { title:'From zero to 10k users', cat:'GROWTH', date:'Jun 24' },\n];\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-white text-stone-900\">\n      <header className=\"border-b border-stone-200 py-6 px-8\">\n        <div className=\"max-w-6xl mx-auto flex justify-between items-center\">\n          <h1 className=\"text-2xl font-bold tracking-tight\">Nova Journal</h1>\n          <nav className=\"flex gap-6 text-sm\">{['Design','Engineering','Culture','Growth'].map(x=><a key={x} className=\"hover:underline cursor-pointer\">{x}</a>)}</nav>\n        </div>\n      </header>\n      <section className=\"max-w-6xl mx-auto px-8 py-12\">\n        <div className=\"aspect-[2/1] bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl mb-6\" />\n        <p className=\"text-xs tracking-widest text-orange-600 mb-2\">FEATURED · JUL 15</p>\n        <h2 className=\"text-4xl font-bold mb-4\">How we rebuilt our editor in 6 weeks</h2>\n        <p className=\"text-lg text-stone-600 max-w-2xl\">A deep dive into rewriting a production code editor while keeping shipping velocity — and what we learned about tech debt.</p>\n      </section>\n      <section className=\"max-w-6xl mx-auto px-8 pb-20 grid md:grid-cols-2 gap-10\">\n        {posts.map(p=>(\n          <article key={p.title} className=\"group cursor-pointer\">\n            <div className=\"aspect-video bg-stone-100 rounded-xl mb-4 group-hover:bg-stone-200 transition\" />\n            <p className=\"text-xs tracking-widest text-stone-500 mb-2\">{p.cat} · {p.date}</p>\n            <h3 className=\"text-2xl font-bold group-hover:text-orange-600 transition\">{p.title}</h3>\n          </article>\n        ))}\n      </section>\n    </div>\n  );\n}\n`
    ),
  },
  {
    id: "3d-hero",
    name: "3D Hero Scene",
    tag: "Experimental",
    description: "Animated 3D torus knot hero with react-three-fiber.",
    gradient: "from-cyan-400 via-sky-500 to-indigo-600",
    emoji: "🌐",
    files: rp(
      `import React from 'react';\nimport { Canvas, useFrame } from '@react-three/fiber';\nimport { OrbitControls } from '@react-three/drei';\n\nfunction Knot() {\n  const ref = React.useRef();\n  useFrame((s, d) => { if(ref.current){ ref.current.rotation.x += d * 0.3; ref.current.rotation.y += d * 0.2; }});\n  return (\n    <mesh ref={ref}>\n      <torusKnotGeometry args={[1, 0.35, 200, 32]} />\n      <meshStandardMaterial color=\"#22d3ee\" roughness={0.2} metalness={0.8} />\n    </mesh>\n  );\n}\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-slate-950 text-white relative overflow-hidden\">\n      <div className=\"absolute inset-0\">\n        <Canvas camera={{ position: [0, 0, 4] }}>\n          <ambientLight intensity={0.4} />\n          <pointLight position={[10,10,10]} intensity={1.5} color=\"#a78bfa\" />\n          <pointLight position={[-10,-10,-10]} intensity={1} color=\"#22d3ee\" />\n          <Knot />\n          <OrbitControls enableZoom={false} autoRotate />\n        </Canvas>\n      </div>\n      <div className=\"relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pointer-events-none\">\n        <p className=\"text-sm tracking-widest text-cyan-400 mb-4\">WELCOME TO THE FUTURE</p>\n        <h1 className=\"text-7xl font-bold bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent mb-6\">Dimension</h1>\n        <p className=\"text-xl text-slate-300 max-w-xl\">A new kind of creative tool. Built for the browser. Powered by the web.</p>\n      </div>\n    </div>\n  );\n}\n`
    ),
  },
];

const TemplateGallery = ({ onLoad }: TemplateGalleryProps) => {
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);

  const filtered = TEMPLATES.filter(
    (t) =>
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tag.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleLoad = (t: Template) => {
    onLoad(t.name, t.files);
    setLoaded(t.id);
    setTimeout(() => setLoaded(null), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Template Gallery</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {TEMPLATES.length} templates
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-secondary/40 border border-border rounded-md outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.map((t, i) => (
          <motion.button
            key={t.id}
            onClick={() => handleLoad(t)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left group rounded-xl border border-border overflow-hidden bg-card hover:border-primary/50 transition-colors"
          >
            <div
              className={`h-24 bg-gradient-to-br ${t.gradient} flex items-center justify-center relative`}
            >
              <span className="text-4xl drop-shadow-lg">{t.emoji}</span>
              {loaded === t.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Check className="w-5 h-5" /> Loaded!
                  </div>
                </motion.div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                  {t.tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.description}
              </p>
            </div>
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No templates match "{query}"
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
