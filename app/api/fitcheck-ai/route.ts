import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = String(body.question ?? "");
    const context = body.context ?? {};

    if (!question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
You are FitCheck AI, a practical fitness coaching assistant.

Use the user's fitness data to answer clearly and specifically.

Rules:
- Do not diagnose medical conditions.
- Do not recommend extreme dieting.
- Prioritize protein, sleep, consistency, steps, and strength retention.
- If data is limited, say so.
- Keep the answer under 180 words.

User question:
${question}

User fitness context:
${JSON.stringify(context, null, 2)}
      `,
    });

    return NextResponse.json({
      answer: response.output_text || "No AI response was generated.",
    });
  } catch (error) {
    console.error("FitCheck AI API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown API error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}