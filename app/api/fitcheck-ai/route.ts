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
      temperature: 0.7,
      input: `
You are FitCheck AI, an LLM-powered fitness coaching assistant inside a fitness analytics app.

You are NOT allowed to give a generic answer.
You must answer the user's exact question.
You must use the user's actual fitness context below.
Mention at least 3 specific metrics from the context when possible.
Do not repeat the same response every time.
If the user asks different questions, give different answers.
If the context has missing or zero values, say that clearly.

Rules:
- Do not diagnose medical conditions.
- Do not recommend crash dieting or extreme deficits.
- Prioritize strength retention, protein, sleep, consistency, steps, recovery, and sustainable fat loss.
- Be direct, practical, and specific.
- Keep the answer under 180 words.

User question:
${question}

User fitness context:
${JSON.stringify(context, null, 2)}

Answer:
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