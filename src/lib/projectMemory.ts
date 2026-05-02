// Project Memory engine - persistent across sessions
// Remembers: purpose, stack, design choices, features

export interface ProjectMemory {
  purpose: string;          // What is this project? (e.g. "Spotify clone")
  stack: string[];          // Tech in use (e.g. ["React", "Tailwind", "framer-motion"])
  design: string;           // Design direction (e.g. "Dark glassmorphism, cyan accents")
  features: string[];       // Features requested/built
  notes: string;            // Free-form notes
  updatedAt: number;
}

const KEY = "codeforge:project-memory:v1";

export const emptyMemory = (): ProjectMemory => ({
  purpose: "",
  stack: ["React", "Tailwind CSS", "lucide-react"],
  design: "",
  features: [],
  notes: "",
  updatedAt: Date.now(),
});

export const loadProjectMemory = (): ProjectMemory => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw);
    return { ...emptyMemory(), ...parsed };
  } catch {
    return emptyMemory();
  }
};

export const saveProjectMemory = (mem: ProjectMemory) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...mem, updatedAt: Date.now() }));
  } catch {}
};

export const clearProjectMemory = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

// Format memory for AI consumption
export const memoryToPrompt = (mem: ProjectMemory): string => {
  const parts: string[] = [];
  if (mem.purpose) parts.push(`Purpose: ${mem.purpose}`);
  if (mem.stack.length) parts.push(`Stack: ${mem.stack.join(", ")}`);
  if (mem.design) parts.push(`Design direction: ${mem.design}`);
  if (mem.features.length) parts.push(`Features: ${mem.features.join(", ")}`);
  if (mem.notes) parts.push(`Notes: ${mem.notes}`);
  return parts.length ? `## PROJECT MEMORY\n${parts.join("\n")}\n` : "";
};
