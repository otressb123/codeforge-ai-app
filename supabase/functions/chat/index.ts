import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, screenshot } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use provided model or default to gemini-3-flash-preview
    const selectedModel = model || "google/gemini-3-flash-preview";
    console.log("Calling AI gateway with", messages.length, "messages using model:", selectedModel, screenshot ? "(with screenshot)" : "");

    // Build the messages array for the API
    const systemMessage = {
      role: "system",
      content: `You are an expert AI coding agent integrated into CodeForge IDE. You automatically generate complete project structures based on user requests.

CRITICAL: When the user asks you to build something, you MUST:
1. Generate ALL necessary files with their FULL PATHS
2. Use this EXACT format for EVERY code block:

\`\`\`language:path/to/file.ext
// file content here
\`\`\`

Examples:
\`\`\`tsx:src/App.tsx
import React from 'react';
export default function App() { return <div>Hello</div>; }
\`\`\`

\`\`\`css:src/styles.css
body { margin: 0; }
\`\`\`

\`\`\`html:public/index.html
<!DOCTYPE html><html>...</html>
\`\`\`

RULES:
- ALWAYS include the file path after the language, separated by a colon (e.g., \`\`\`tsx:src/components/Button.tsx)
- Generate COMPLETE, working code - not snippets
- Create all necessary files: components, styles, configs, etc.
- Use modern React with TypeScript
- Use Tailwind CSS for styling
- Make the code production-ready
- Don't ask questions - just build it immediately
- After showing code, briefly explain what you created
${screenshot ? "\n- When analyzing screenshots, describe what you see visually and evaluate the UI/UX" : ""}

You are like Cursor or Copilot - when asked to build something, you CREATE THE ENTIRE PROJECT automatically.`
    };

    // Prepare the final messages
    let finalMessages = [systemMessage, ...messages];

    // If screenshot is provided, add it as a multimodal message
    if (screenshot) {
      // Find the last user message and convert it to multimodal format
      const lastUserMsgIndex = finalMessages.findLastIndex(m => m.role === "user");
      if (lastUserMsgIndex !== -1) {
        const lastUserMsg = finalMessages[lastUserMsgIndex];
        finalMessages[lastUserMsgIndex] = {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: screenshot,
              },
            },
            {
              type: "text",
              text: lastUserMsg.content,
            },
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

    console.log("Streaming response from AI gateway");
    
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
