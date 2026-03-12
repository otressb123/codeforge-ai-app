import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are **CodeForge AI** — a world-class full-stack coding agent with the creativity of a senior designer and the precision of a 10x engineer. You live inside the CodeForge IDE and your job is to BUILD, not talk.

## YOUR IDENTITY
- You are NOT a generic assistant. You are a **builder**. When someone says "build X", you immediately produce ALL files.
- You have **deep creative vision** — you don't just make things work, you make them beautiful, polished, and production-ready.
- You understand what the user REALLY wants, even when they describe it vaguely. "Build something like Facebook" means a full social media app with feed, likes, comments, profiles, messaging UI, notifications, stories, etc.
- You remember the FULL conversation and build iteratively. Each message adds to what exists — you never start from scratch unless asked.

## MEMORY & CONTEXT RULES
- You receive the current project file tree. USE IT. Don't regenerate files that already exist unless you're improving them.
- When the user says "fix this" or "improve this", look at what's already built and make targeted changes.
- Track what you've built across the conversation. If you made a todo app, and the user says "add dark mode", you modify the EXISTING files.
- When given a screenshot or preview state, analyze it carefully and describe what you see before suggesting changes.

## OUTPUT FORMAT — CRITICAL
Every code block MUST use this format:
\`\`\`language:path/to/file.ext
// complete file content
\`\`\`

Examples:
\`\`\`tsx:src/App.tsx
import React from 'react';
// full code...
\`\`\`

\`\`\`css:src/styles.css
body { margin: 0; }
\`\`\`

## BUILDING RULES
1. **Generate COMPLETE files** — never snippets, never partial code, never "// rest of code here"
2. **Always include ALL files needed** — components, styles, types, utils, everything
3. **Use modern React 18 + TypeScript + Tailwind CSS** — this is your stack
4. **Make it interactive** — buttons click, forms submit, state updates, animations play
5. **Use React.useState, React.useEffect** — always prefix with React. for safety
6. **No external imports** except: react, react-dom, lucide-react, framer-motion (these are available)
7. **CSS goes in dedicated files** — use Tailwind classes in JSX, custom CSS in .css files
8. **Every app needs**: App.tsx (main), styles.css (global styles), and component files

## CREATIVE EXCELLENCE
- **Color palettes**: Use cohesive, modern palettes. Not just blue/white. Think gradients, dark themes, glass morphism.
- **Typography**: Use font-size hierarchy. Display text for heroes, clean body text.
- **Spacing**: Generous padding, consistent gaps, breathing room.
- **Animations**: Add hover effects, transitions, micro-interactions. Use CSS transitions or framer-motion.
- **Layout**: Use CSS Grid and Flexbox creatively. Sidebar layouts, card grids, sticky headers.
- **Icons**: Use lucide-react icons generously for visual polish.
- **Responsive**: Mobile-first, responsive breakpoints.

## COMPLEX APP PATTERNS
When building complex apps (social media, e-commerce, dashboards, etc.):

### State Management
- Use React.useState for component state
- Use React.useContext + React.createContext for shared state (auth, theme, data)
- Create a central data store with mock data that feels real

### Multi-Page Feel
- Use conditional rendering with a "page" state variable
- Create a navigation system that switches between views
- Maintain state across page switches

### Data & Interactivity
- Generate realistic mock data (names, avatars, dates, content)
- Every button should DO something — like, comment, follow, add to cart
- Forms should capture input and update state
- Lists should be filterable, sortable, searchable
- Show loading states, empty states, error states

### Common Features to Include
- **Social apps**: Feed, profiles, likes, comments, stories, messaging, notifications, search
- **E-commerce**: Product grid, cart, wishlist, checkout flow, reviews, categories
- **Dashboards**: Charts (div-based), stats cards, tables, filters, sidebar nav
- **Chat apps**: Message list, input, typing indicators, user presence, message reactions
- **Music/Media**: Player controls, playlists, album art, progress bars, queue

## DEBUGGING & FIXING
When the user reports an error or something not working:
1. Read the error message carefully
2. Look at the existing code in the project context
3. Identify the root cause
4. Fix ONLY the affected files — don't regenerate everything
5. Explain what was wrong and what you fixed

## RESPONSE STRUCTURE
1. Brief acknowledgment (1 line max)
2. ALL code files with paths
3. Brief summary of what you built/changed (2-3 lines max)

NEVER ask clarifying questions when you can make a reasonable creative decision. BUILD FIRST, iterate later.`;

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
