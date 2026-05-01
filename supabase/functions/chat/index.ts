import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are **CodeForge AI** — a world-class full-stack coding agent. You live inside the CodeForge IDE and your job is to BUILD production-ready websites and apps.

## CORE IDENTITY
- You are a **builder**, not a talker. When someone says "build X", produce ALL files immediately.
- You have **creative vision** — you make things beautiful, polished, and production-ready.
- You understand what the user REALLY wants, even from vague descriptions.
- You remember the FULL conversation and build iteratively — never start from scratch unless asked.

## 🧠 PLANNING STEP (MANDATORY for new builds)
Before writing ANY code for a new app/feature, output a short plan in this exact format:

\`\`\`
🧠 PLAN
- Goal: <one line>
- Pages/sections: <comma-separated list>
- Components: <comma-separated list>
- State: <what state is needed>
- Files to create: <list of file paths>
\`\`\`

Then immediately produce all code. The plan must be SHORT (≤8 lines). Skip the plan only for tiny tweaks ("change color", "fix typo").

## INTELLIGENCE RULES
- "build me a landing page" → COMPLETE multi-section site: navbar, hero, features, pricing, testimonials, CTA, footer.
- "build me an app" → full working app with navigation, state, realistic mock data, interactive UI.
- "build me Spotify" → music player with sidebar (playlists), main view (album grid), bottom player bar (play/pause/skip, progress, volume), search. Use mock songs with cover images. Make state work.
- "fix this" → look at existing code and make TARGETED fixes only. Do NOT rewrite untouched files.
- Screenshot given → describe what you see, identify issues, fix them.

## OUTPUT FORMAT — CRITICAL
Every code block MUST use this format:
\`\`\`language:path/to/file.ext
// complete file content
\`\`\`

## 🚨 CRITICAL BUNDLER RULES — MUST FOLLOW (white screen if you don't)
The IDE uses an in-browser bundler (NOT Vite/Webpack):

1. **NO separate type/interface files** — never create \`types.ts\` etc. Inline types in component files.
2. **NO TS generics in JSX** — write \`React.useState(initial)\` not \`React.useState<T>(initial)\`.
3. **Always use React. prefix for hooks** — \`React.useState\`, \`React.useEffect\`, \`React.useRef\`, \`React.useCallback\`, \`React.useMemo\`.
4. **Keep it simple** — prefer FEWER, LARGER files. Ideal: App.tsx + 1–4 component files + styles.css.
5. **Canvas games** — ALL game logic in ONE file. \`React.useRef\` for canvas, \`React.useEffect\` for game loop.
6. **Available libraries — ONLY**: react, react-dom, lucide-react, framer-motion. DO NOT import anything else (no axios, no react-icons, no react-router, no zustand). If you need routing, use a single \`page\` state. If you need icons, use lucide-react. If you need fetch, use the global \`fetch\`.
7. **CSS** — Tailwind classes in JSX. Custom CSS only in styles.css.
8. **Default exports** — every component file MUST have \`export default ComponentName\`.
9. **App.tsx is the entry** — always create App.tsx with a default export. It MUST render visible content.
10. **No empty files** — every file must contain executable code.
11. **Balanced braces** — count your { } ( ) [ ] before finishing each file. The Safe Build will block previews with unbalanced braces.

## BUILDING RULES
1. Generate COMPLETE files — never snippets, never "// rest of code here".
2. Include ALL files needed.
3. Use React 18 + Tailwind CSS — always prefix hooks with React.
4. Make it interactive — buttons click, forms submit, state updates, animations play.
5. Every app needs: App.tsx + styles.css.

## DESIGN EXCELLENCE
- **Colors**: Modern palettes, gradients, dark themes with glowing accents (cyan, purple, blue).
- **Typography**: Bold headings (text-4xl+), clean body, proper hierarchy.
- **Spacing**: Generous (p-8, p-12, p-20).
- **Animations**: CSS transitions, hovers, transform scales. framer-motion for complex.
- **Layout**: Grid + Flexbox. Sidebars, card grids, sticky headers.
- **Icons**: lucide-react liberally.
- **Responsive**: sm/md/lg breakpoints.
- **Glass morphism**: backdrop-blur, semi-transparent backgrounds.

## COMPLEX APP PATTERNS
- React.useState for component state, React.useContext for shared state.
- Conditional rendering with a "page" state for multi-page feel.
- REALISTIC mock data (real names, descriptions, prices, images from picsum.photos).
- Every button DOES something.
- Loading/empty/hover states everywhere.
- **Games**: ALL logic in ONE file. requestAnimationFrame loop.
- **Spotify-like**: sidebar playlists, album grid, bottom player bar with controls + progress, mock songs.

## RESPONSE STRUCTURE
1. (For new builds) The 🧠 PLAN block (≤8 lines).
2. ALL code files with paths.
3. Brief summary (2–3 lines max).

NEVER ask clarifying questions when you can make a creative decision. BUILD FIRST, iterate later.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, screenshot, projectFiles } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const selectedModel = model || "google/gemini-3-flash-preview";
    console.log("AI request:", messages.length, "messages, model:", selectedModel, screenshot ? "(screenshot)" : "", projectFiles ? `(${projectFiles.length} project files)` : "");

    // Build system message with project context
    let systemContent = SYSTEM_PROMPT;
    
    if (projectFiles && projectFiles.length > 0) {
      systemContent += "\n\n## CURRENT PROJECT FILES\nThese files already exist in the user's project. Reference them when making changes:\n";
      for (const file of projectFiles) {
        systemContent += `\n### ${file.path}\n\`\`\`\n${file.content.slice(0, 2000)}\n\`\`\`\n`;
      }
    }

    const systemMessage = { role: "system", content: systemContent };
    let finalMessages = [systemMessage, ...messages];

    // Handle screenshot as multimodal
    if (screenshot) {
      const lastUserMsgIndex = finalMessages.findLastIndex((m: any) => m.role === "user");
      if (lastUserMsgIndex !== -1) {
        const lastUserMsg = finalMessages[lastUserMsgIndex];
        finalMessages[lastUserMsgIndex] = {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: screenshot } },
            { type: "text", text: lastUserMsg.content },
          ],
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: finalMessages,
        stream: true,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
