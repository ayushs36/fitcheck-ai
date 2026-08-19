import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  checkAIRateLimit,
  createProtectedFitnessAnswer,
  FitCheckAIContext,
  getLiveAIStatus,
} from "@/lib/aiProtection";

type FitCheckReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

const FITCHECK_AGENT_MODEL =
  process.env.FITCHECK_AGENT_MODEL?.trim() || "gpt-5.6-terra";

const FITCHECK_AGENT_REASONING_EFFORT = getReasoningEffort(
  process.env.FITCHECK_AGENT_REASONING_EFFORT
);

function getReasoningEffort(value: string | undefined): FitCheckReasoningEffort {
  const allowedEfforts: FitCheckReasoningEffort[] = [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
  ];

  if (value && allowedEfforts.includes(value as FitCheckReasoningEffort)) {
    return value as FitCheckReasoningEffort;
  }

  return "medium";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = String(body.question ?? "");
    const context = (body.context ?? {}) as FitCheckAIContext;

    if (!question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const liveAIStatus = getLiveAIStatus(request);

    if (!liveAIStatus.allowed) {
      return NextResponse.json({
        answer: createProtectedFitnessAnswer(
          question,
          context,
          liveAIStatus.reason
        ),
        protectedMode: true,
      });
    }

    const rateLimit = checkAIRateLimit(request);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        answer: createProtectedFitnessAnswer(
          question,
          context,
          "The live AI limit was reached, so FitCheck returned a protected coaching response instead."
        ),
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
      model: FITCHECK_AGENT_MODEL,
      ...(FITCHECK_AGENT_MODEL.startsWith("gpt-5")
        ? {
            reasoning: {
              effort: FITCHECK_AGENT_REASONING_EFFORT,
            },
            text: {
              verbosity: "medium" as const,
            },
          }
        : {}),
      input: `
You are FitCheck AI, an LLM-powered fitness coaching assistant inside a fitness analytics app.

You are NOT allowed to give a generic answer.
You must answer the user's exact question.
You must use the user's actual fitness context below.
Mention at least 3 specific metrics from the context when possible.
If context.dataAccess.exactDailyLogs exists, you can inspect individual saved daily logs by date. Use those exact rows when the user asks about a specific day, logged calories, logged protein, logged steps, weigh-ins, workouts, exercises, or missing fields.
If the user asks about a date or metric that is not present in exactDailyLogs, say it was not logged or not included in the available app context. Do not say you cannot see the app data when exactDailyLogs is present.
Treat null, missing, or zero-valued log fields as unknown/not logged unless the context explicitly says otherwise.
If context.previousConversation exists, treat the user question as a follow-up to that previous question and answer. Use the previous exchange for continuity, but still prioritize the latest fitness context.
Do not repeat the same response every time.
If the user asks different questions, give different answers.
If the context has missing or zero values, say that clearly.

Rules:
- Do not diagnose medical conditions.
- Do not recommend crash dieting or extreme deficits.
- Match the selected goal in the context. Cutting should focus on sustainable fat loss, bulking should focus on controlled muscle gain and training progression, and maintaining should focus on weight stability, consistency, and performance.
- Use goalMemory when present. If the current goal has been active for multiple weeks, treat this as an ongoing phase and judge whether the current plan needs refinement rather than acting like the goal just started.
- Prioritize strength retention, protein, sleep, consistency, steps, recovery, and sustainable calorie changes.
- For data lookup questions, answer with the relevant exact log rows first, then add coaching interpretation only if useful.
- Do not use markdown bold markers or visible asterisks in the answer.
- Be direct, practical, and specific.
- Keep the answer under 220 words unless the user asks for a list or table.

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
