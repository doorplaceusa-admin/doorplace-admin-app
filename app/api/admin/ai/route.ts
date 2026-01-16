import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readTable } from "@/lib/ai/dbReader";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * ADMIN AI — READ ONLY
 * Safe, structured, database-aware intelligence layer
 */

export async function POST(req: Request) {
  try {
    const { question, tables } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    /* ============================
       1. LOAD REQUESTED DATA
    ============================ */

    const allowedTables = Array.isArray(tables)
      ? tables
      : [];

    const dataContext: Record<string, any> = {};

    for (const table of allowedTables) {
      const { data } = await readTable(table, {
        limit: 200,
      });
      dataContext[table] = data;
    }

    /* ============================
       2. ASK OPENAI
    ============================ */

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are TradePilot's Admin AI.
You have read-only access to structured database snapshots.
You analyze business performance, SEO coverage, conversions, and operational data.
You NEVER invent data and only reason from provided context.
          `,
        },
        {
          role: "user",
          content: `
QUESTION:
${question}

DATABASE SNAPSHOT (JSON):
${JSON.stringify(dataContext, null, 2)}
          `,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (err: any) {
    console.error("ADMIN AI ERROR:", err);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
