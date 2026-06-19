import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body.text ?? "");

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Log text is required." },
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
Extract fitness log data from the user's sentence.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.

JSON shape:
{
  "weight": number | null,
  "calories": number | null,
  "protein": number | null,
  "steps": number | null,
  "workout": string | null
}

Rules:
- Weight should be in pounds.
- Calories should be a number.
- Protein should be grams.
- Steps should be a full number. Example: "13k steps" = 13000.
- Workout should be a short label like "Push Day", "Pull Day", "Legs", "Rest", or null.
- If a value is missing, use null.

User text:
${text}
      `,
    });

    const rawOutput = response.output_text.trim();

    let parsed;

    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return NextResponse.json(
        {
          error: "AI did not return valid JSON.",
          rawOutput,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Parse log API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown parse log error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}