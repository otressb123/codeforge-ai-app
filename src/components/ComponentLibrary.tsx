import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, Navigation, Image, Type, CreditCard, MessageSquare, 
  Star, Users, Mail, ChevronDown, ChevronRight, Copy, Check,
  Layers, Grid3X3, FileText, ShoppingCart, BarChart3, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: string;
  files: { path: string; content: string }[];
}

interface ComponentCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  components: ComponentTemplate[];
}

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: "navigation",
    name: "Navigation",
    icon: Navigation,
    components: [
      {
        id: "navbar-modern",
        name: "Modern Navbar",
        description: "Responsive navbar with logo, links, and CTA button",
        icon: Menu,
        preview: "navbar",
        files: [{
          path: "/src/components/Navbar.tsx",
          content: `import React from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500" />
            <span className="text-xl font-bold text-white">Brand</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'Pricing', 'About'].map(link => (
              <a key={link} href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">{link}</a>
            ))}
            <button className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
              Get Started
            </button>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {['Home', 'Features', 'Pricing', 'About'].map(link => (
              <a key={link} href="#" className="block text-gray-300 hover:text-white py-2 text-sm">{link}</a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;`
        }]
      },
      {
        id: "sidebar-nav",
        name: "Sidebar Navigation",
        description: "Collapsible sidebar with icons and labels",
        icon: Layout,
        preview: "sidebar",
        files: [{
          path: "/src/components/Sidebar.tsx",
          content: `import React from 'react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const items = [
    { icon: '🏠', label: 'Dashboard' },
    { icon: '📊', label: 'Analytics' },
    { icon: '👥', label: 'Users' },
    { icon: '⚙️', label: 'Settings' },
    { icon: '📁', label: 'Projects' },
  ];

  return (
    <aside className={\`\${collapsed ? 'w-16' : 'w-64'} h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col\`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!collapsed && <span className="text-white font-bold">Menu</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white p-1 rounded">
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item, i) => (
          <button key={i} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;`
        }]
      }
    ]
  },
  {
    id: "hero",
    name: "Hero Sections",
    icon: Layers,
    components: [
      {
        id: "hero-gradient",
        name: "Gradient Hero",
        description: "Bold hero section with gradient text and CTA",
        icon: Type,
        preview: "hero",
        files: [{
          path: "/src/components/Hero.tsx",
          content: `import React from 'react';

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="relative text-center px-4 max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8">
          ✨ Launching Something Amazing
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          <span className="text-white">Build the </span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Future Today
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create stunning web experiences with our powerful platform. Ship faster, build better, scale effortlessly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all text-lg">
            Start Building →
          </button>
          <button className="px-8 py-3.5 border border-gray-600 text-gray-300 rounded-full font-semibold hover:bg-white/5 transition-all text-lg">
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;`
        }]
      },
      {
        id: "hero-split",
        name: "Split Hero",
        description: "Two-column hero with image placeholder",
        icon: Grid3X3,
        preview: "hero-split",
        files: [{
          path: "/src/components/HeroSplit.tsx",
          content: `import React from 'react';

const HeroSplit = () => {
  return (
    <section className="min-h-[80vh] flex items-center bg-gray-950 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-cyan-400 font-semibold text-sm tracking-wider uppercase">Welcome</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mt-4 mb-6 leading-tight">
            Your Next <span className="text-cyan-400">Big Idea</span> Starts Here
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Everything you need to build modern web applications. Beautiful components, powerful tools.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors">
              Get Started
            </button>
            <button className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-medium">
              Learn More →
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <span className="text-6xl">🚀</span>
          </div>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
        </div>
      </div>
    </section>
  );
};

export default HeroSplit;`
        }]
      }
    ]
  },
  {
    id: "features",
    name: "Feature Sections",
    icon: Grid3X3,
    components: [
      {
        id: "features-grid",
        name: "Feature Grid",
        description: "3-column feature cards with icons",
        icon: Grid3X3,
        preview: "features",
        files: [{
          path: "/src/components/Features.tsx",
          content: `import React from 'react';

const features = [
  { icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed with instant loading and smooth transitions.' },
  { icon: '🎨', title: 'Beautiful Design', description: 'Stunning UI components that look great on any device.' },
  { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security built into every layer.' },
  { icon: '📱', title: 'Fully Responsive', description: 'Looks perfect on mobile, tablet, and desktop.' },
  { icon: '🧩', title: 'Modular', description: 'Mix and match components to build exactly what you need.' },
  { icon: '🚀', title: 'Ship Faster', description: 'Pre-built sections mean you launch in hours, not weeks.' },
];

const Features = () => {
  return (
    <section className="py-20 px-4 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Powerful features to help you build, launch, and scale your projects.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all group cursor-pointer">
              <span className="text-3xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;`
        }]
      }
    ]
  },
  {
    id: "pricing",
    name: "Pricing",
    icon: CreditCard,
    components: [
      {
        id: "pricing-cards",
        name: "Pricing Cards",
        description: "3-tier pricing with popular badge",
        icon: CreditCard,
        preview: "pricing",
        files: [{
          path: "/src/components/Pricing.tsx",
          content: `import React from 'react';

const plans = [
  { name: 'Starter', price: '0', period: 'Free forever', features: ['5 Projects', 'Basic Analytics', 'Community Support', '1 GB Storage'], popular: false },
  { name: 'Pro', price: '29', period: '/month', features: ['Unlimited Projects', 'Advanced Analytics', 'Priority Support', '100 GB Storage', 'Custom Domain', 'API Access'], popular: true },
  { name: 'Enterprise', price: '99', period: '/month', features: ['Everything in Pro', 'Dedicated Support', 'SLA Guarantee', 'Unlimited Storage', 'SSO', 'Custom Integrations'], popular: false },
];

const Pricing = () => {
  return (
    <section className="py-20 px-4 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-lg">Choose the plan that fits your needs.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={\`relative p-8 rounded-2xl border transition-all \${plan.popular ? 'bg-gradient-to-b from-cyan-500/10 to-transparent border-cyan-500/30 scale-105' : 'bg-white/5 border-white/10 hover:border-white/20'}\`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">\${plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                    <span className="text-cyan-400">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button className={\`w-full py-3 rounded-lg font-semibold transition-all \${plan.popular ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white/10 text-white hover:bg-white/20'}\`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;`
        }]
      }
    ]
  },
  {
    id: "testimonials",
    name: "Testimonials",
    icon: Star,
    components: [
      {
        id: "testimonials-cards",
        name: "Testimonial Cards",
        description: "User testimonials with avatars and ratings",
        icon: Users,
        preview: "testimonials",
        files: [{
          path: "/src/components/Testimonials.tsx",
          content: `import React from 'react';

const testimonials = [
  { name: 'Sarah Chen', role: 'CEO at TechFlow', avatar: '👩‍💼', quote: 'This platform transformed how we build products. We shipped 3x faster.', rating: 5 },
  { name: 'Marcus Johnson', role: 'Lead Developer', avatar: '👨‍💻', quote: 'The component library saved us hundreds of hours. Absolutely incredible.', rating: 5 },
  { name: 'Emily Rivera', role: 'Designer', avatar: '👩‍🎨', quote: 'Beautiful, responsive, and easy to customize. Everything I need in one place.', rating: 5 },
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Loved by Developers</h2>
          <p className="text-gray-400 text-lg">See what our users are saying.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;`
        }]
      }
    ]
  },
  {
    id: "footer",
    name: "Footers",
    icon: FileText,
    components: [
      {
        id: "footer-modern",
        name: "Modern Footer",
        description: "Multi-column footer with links and newsletter",
        icon: Mail,
        preview: "footer",
        files: [{
          path: "/src/components/Footer.tsx",
          content: `import React from 'react';

const Footer = () => {
  const columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
    { title: 'Support', links: ['Help Center', 'Community', 'Contact', 'Status'] },
  ];

  return (
    <footer className="bg-gray-950 border-t border-white/10 pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500" />
              <span className="text-xl font-bold text-white">Brand</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">Building the future of web development, one component at a time.</p>
            <div className="flex gap-4">
              {['𝕏', 'in', 'GH'].map((s, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold">{s}</a>
              ))}
            </div>
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
          © 2024 Brand. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;`
        }]
      }
    ]
  },
  {
    id: "forms",
    name: "Forms",
    icon: FileText,
    components: [
      {
        id: "contact-form",
        name: "Contact Form",
        description: "Clean contact form with validation",
        icon: Mail,
        preview: "form",
        files: [{
          path: "/src/components/ContactForm.tsx",
          content: `import React from 'react';

const ContactForm = () => {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="py-20 px-4 bg-gray-950">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Get in Touch</h2>
          <p className="text-gray-400">We'd love to hear from you.</p>
        </div>
        {submitted ? (
          <div className="text-center p-8 rounded-xl bg-green-500/10 border border-green-500/30">
            <span className="text-4xl mb-4 block">✅</span>
            <p className="text-green-400 font-semibold">Message sent successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First name" required className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none transition-colors" />
              <input type="text" placeholder="Last name" required className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none transition-colors" />
            </div>
            <input type="email" placeholder="Email address" required className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none transition-colors" />
            <textarea placeholder="Your message..." rows={4} required className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none" />
            <button type="submit" className="w-full py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors">
              Send Message
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ContactForm;`
        }]
      }
    ]
  },
  {
    id: "cta",
    name: "Call to Action",
    icon: MessageSquare,
    components: [
      {
        id: "cta-banner",
        name: "CTA Banner",
        description: "Full-width call to action with gradient",
        icon: MessageSquare,
        preview: "cta",
        files: [{
          path: "/src/components/CTABanner.tsx",
          content: `import React from 'react';

const CTABanner = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCAyIDQgNC0yIDQtNCA0LTQtMi00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join thousands of developers who are already building the future.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3.5 bg-white text-blue-600 rounded-full font-bold hover:shadow-xl transition-all">
              Start Free Trial
            </button>
            <button className="px-8 py-3.5 border-2 border-white/50 text-white rounded-full font-bold hover:bg-white/10 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;`
        }]
      }
    ]
  }
];

interface ComponentLibraryProps {
  onInsertComponent: (files: { path: string; content: string; language: string }[]) => void;
}

const ComponentLibrary = ({ onInsertComponent }: ComponentLibraryProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("hero");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleInsert = (component: ComponentTemplate) => {
    const files = component.files.map(f => ({
      path: f.path,
      content: f.content,
      language: f.path.endsWith('.tsx') ? 'tsx' : f.path.endsWith('.css') ? 'css' : 'text',
    }));
    onInsertComponent(files);
    setCopiedId(component.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(`Added ${component.name} to your project!`, {
      description: files.map(f => f.path).join(', ')
    });
  };

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Components</h2>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Click to add pre-built sections to your project</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {COMPONENT_CATEGORIES.map(category => (
          <div key={category.id}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              {expandedCategory === category.id ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <category.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">{category.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{category.components.length}</span>
            </button>

            <AnimatePresence>
              {expandedCategory === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 pr-1 space-y-1 py-1">
                    {category.components.map(component => (
                      <motion.button
                        key={component.id}
                        onClick={() => handleInsert(component)}
                        className="w-full p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition-all text-left group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <component.icon className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium">{component.name}</span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedId === component.id ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                          {component.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentLibrary;
