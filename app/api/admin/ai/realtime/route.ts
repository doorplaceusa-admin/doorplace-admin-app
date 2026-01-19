import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { tone } = await req.json();

  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      instructions: `
You are TradePilot's Admin AI.

Tone mode: ${tone}

neutral = balanced
direct = blunt
technical = system-level precision
sales = persuasive and growth-focused

Never hallucinate data.
Ask clarifying questions when needed.
      `,
    }),
  });

  const data = await r.json();
  return NextResponse.json(data);
}
