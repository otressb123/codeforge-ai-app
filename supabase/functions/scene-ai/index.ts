import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a 3D scene generator. Given a user's natural-language description,
return ONLY a JSON object (no prose, no code fences) describing a low-poly 3D scene.

Schema:
{
  "name": string,
  "objects": [
    {
      "kind": "box"|"sphere"|"cylinder"|"cone"|"tree"|"human"|"car"|"road"|"water",
      "x": number, "y": number, "z": number,
      "sx"?: number, "sy"?: number, "sz"?: number,
      "color"?: string  // hex like "#22d3ee"
    }
  ]
}

Rules:
- Coordinates in meters. y is up. Ground plane at y=0.
- Keep between 10 and 120 objects.
- Buildings: kind "box", sy=height, position y = sy/2.
- Trees/humans/cars: y = 0 (their base sits on ground).
- Roads: flat wide boxes, sy=0.05, y=0.02.
- Water: flat blue box, sy=0.1, color "#3b82f6".
- Cars: small box, sx≈1.6 sy≈0.6 sz≈3, colorful.
- Compose meaningful layouts (grids for cities, clusters for forests, ring for stadium, etc).
- No comments in JSON. No markdown. Just the object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("scene-ai gateway:", r.status, t);
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    let scene;
    try {
      scene = JSON.parse(text);
    } catch {
      // strip fences fallback
      const m = text.match(/\{[\s\S]*\}/);
      scene = m ? JSON.parse(m[0]) : { name: "empty", objects: [] };
    }
    return new Response(JSON.stringify({ scene }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scene-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
