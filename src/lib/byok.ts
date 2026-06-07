// Bring-Your-Own-Key: external AI providers configured by the user.
// Keys live in localStorage only — never sent to our backend, never committed.

export type BYOKProvider = {
  id: string;            // unique id (uuid-ish)
  name: string;          // display name e.g. "My OpenAI"
  baseUrl: string;       // OpenAI-compatible /v1 endpoint
  apiKey: string;        // user's secret
  model: string;         // model id, e.g. "gpt-4o-mini"
};

const LS_KEY = "codeforge-byok-providers";

export function loadBYOK(): BYOKProvider[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBYOK(list: BYOKProvider[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function addBYOK(p: Omit<BYOKProvider, "id">): BYOKProvider {
  const provider: BYOKProvider = { ...p, id: crypto.randomUUID() };
  const list = loadBYOK();
  list.push(provider);
  saveBYOK(list);
  return provider;
}

export function removeBYOK(id: string): void {
  saveBYOK(loadBYOK().filter((p) => p.id !== id));
}

// Presets to make setup easier
export const BYOK_PRESETS: Array<{ name: string; baseUrl: string; modelHint: string }> = [
  { name: "OpenAI",       baseUrl: "https://api.openai.com/v1",                       modelHint: "gpt-4o-mini" },
  { name: "OpenRouter",   baseUrl: "https://openrouter.ai/api/v1",                    modelHint: "openai/gpt-4o-mini" },
  { name: "Groq",         baseUrl: "https://api.groq.com/openai/v1",                  modelHint: "llama-3.3-70b-versatile" },
  { name: "Together AI",  baseUrl: "https://api.together.xyz/v1",                     modelHint: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { name: "DeepSeek",     baseUrl: "https://api.deepseek.com/v1",                     modelHint: "deepseek-chat" },
  { name: "Mistral",      baseUrl: "https://api.mistral.ai/v1",                       modelHint: "mistral-small-latest" },
  { name: "Anthropic",    baseUrl: "https://api.anthropic.com/v1",                    modelHint: "claude-3-5-sonnet-latest" },
  { name: "Custom",       baseUrl: "",                                                 modelHint: "" },
];
