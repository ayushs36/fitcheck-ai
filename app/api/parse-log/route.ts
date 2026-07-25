import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkAIRateLimit, getLiveAIStatus } from "@/lib/aiProtection";

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

    const liveAIStatus = getLiveAIStatus(request);

    if (!liveAIStatus.allowed) {
      return NextResponse.json({
        ...parseLogTextFallback(text),
        protectedMode: true,
      });
    }

    const rateLimit = checkAIRateLimit(request);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        ...parseLogTextFallback(text),
        protectedMode: true,
        rateLimited: true,
        resetAt: rateLimit.resetAt,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

function parseLogTextFallback(text: string) {
  const lowerText = text.toLowerCase();
  const weightMatch = lowerText.match(
    /(?:weight|weighed|bw|bodyweight)?\s*(\d{2,3}(?:\.\d+)?)\s*(?:lb|lbs|pounds)\b/
  );
  const caloriesMatch = lowerText.match(
    /(\d{3,5})\s*(?:cal|cals|calories|kcal)\b/
  );
  const proteinMatch = lowerText.match(
    /(\d{2,3})\s*(?:g|grams)?\s*(?:protein|prot)\b/
  );
  const stepsMatch = lowerText.match(
    /(\d+(?:\.\d+)?)\s*(k)?\s*(?:steps|step)\b/
  );
  const workoutMatch = lowerText.match(
    /\b(push|pull|legs|leg|upper|lower|full body|chest|back|shoulders|arms|rest)\b/
  );

  return {
    weight: weightMatch ? Number(weightMatch[1]) : null,
    calories: caloriesMatch ? Number(caloriesMatch[1]) : null,
    protein: proteinMatch ? Number(proteinMatch[1]) : null,
    steps: stepsMatch
      ? Math.round(Number(stepsMatch[1]) * (stepsMatch[2] ? 1000 : 1))
      : null,
    workout: workoutMatch ? formatWorkoutLabel(workoutMatch[1]) : null,
  };
}

function formatWorkoutLabel(workout: string) {
  if (workout === "leg") return "Legs";
  if (workout === "full body") return "Full Body";

  return workout.charAt(0).toUpperCase() + workout.slice(1);
}
