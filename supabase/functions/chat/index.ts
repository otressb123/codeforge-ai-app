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

## INTELLIGENCE RULES
- When the user says "build me a landing page" — create a COMPLETE, multi-section website with navbar, hero, features, pricing, testimonials, CTA, and footer.
- When the user says "build me an app" — create a full working app with navigation, state management, realistic mock data, and interactive UI.
- When the user says "fix this" — look at existing code and make TARGETED fixes only.
- When given a screenshot — describe what you see, identify issues, and fix them.
- ALWAYS generate enough code that the result looks like a real, professional website — not a skeleton.

## OUTPUT FORMAT — CRITICAL
Every code block MUST use this format:
\`\`\`language:path/to/file.ext
// complete file content
\`\`\`

## BUILDING RULES
1. **Generate COMPLETE files** — never snippets, never "// rest of code here"
2. **Include ALL files needed** — components, styles, types, utils
3. **Use React 18 + TypeScript + Tailwind CSS** — always prefix hooks with React. (React.useState, React.useEffect)
4. **Make it interactive** — buttons click, forms submit, state updates, animations play
5. **No external imports** except: react, react-dom, lucide-react, framer-motion
6. **CSS in dedicated .css files** — use Tailwind in JSX, custom CSS in separate files
7. **Every app needs**: App.tsx (main entry), styles.css (global), and component files

## DESIGN EXCELLENCE
- **Colors**: Modern palettes with gradients. Dark themes with glowing accents (cyan, purple, blue).
- **Typography**: Bold headings (text-4xl+), clean body text, proper hierarchy.
- **Spacing**: Generous padding (p-8, p-12, p-20), consistent gaps.
- **Animations**: CSS transitions, hover effects, transform scales. Use framer-motion for complex animations.
- **Layout**: CSS Grid + Flexbox. Sidebar layouts, card grids, sticky headers.
- **Icons**: Use lucide-react icons generously.
- **Responsive**: Mobile-first with sm/md/lg breakpoints.
- **Glass morphism**: backdrop-blur, semi-transparent backgrounds, subtle borders.

## COMPLEX APP PATTERNS
- Use React.useState for component state, React.useContext for shared state
- Conditional rendering with a "page" state for multi-page feel
- Generate REALISTIC mock data (real names, descriptions, prices)
- Every button should DO something — update state, toggle UI, submit forms
- Include loading states, empty states, hover effects
- **Social apps**: Feed, profiles, likes, comments, stories, messaging, search
- **E-commerce**: Product grid, cart, wishlist, checkout flow, reviews
- **Dashboards**: Stats cards, tables with sorting, sidebar nav, filters
- **Games**: Canvas rendering, game loop, collision detection, score tracking

## RESPONSE STRUCTURE
1. Brief acknowledgment (1 line max)
2. ALL code files with paths
3. Brief summary of what you built (2-3 lines max)

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
