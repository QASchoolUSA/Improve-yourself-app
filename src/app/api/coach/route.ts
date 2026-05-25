import { NextResponse } from "next/server";
import { getProvider, safeParseJson } from "@/lib/ai/provider";
import {
  decomposeGoalPrompt,
  dailyMessagePrompt,
  weeklyReviewPrompt,
  chatSystemPrompt,
} from "@/lib/ai/prompts";
import type { Profile, Goal, Checkin } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecomposeBody = {
  op: "decompose";
  profile: Profile;
  goal: Goal;
};

type DailyBody = {
  op: "daily";
  profile: Profile;
  ctx: {
    date: string;
    activeGoals: { title: string; progress: number }[];
    todayTasks: { title: string; goalTitle: string; doneToday: boolean }[];
    yesterdayCompleted: number;
    yesterdayTotal: number;
  };
};

type ReviewBody = {
  op: "review";
  profile: Profile;
  ctx: {
    weekStart: string;
    weekEnd: string;
    goals: { title: string; progress: number; tasksCompleted: number; tasksPlanned: number }[];
    checkins: Pick<Checkin, "date" | "note" | "mood">[];
  };
};

type ChatBody = {
  op: "chat";
  profile: Profile;
  goals: Goal[];
  history: { role: "user" | "model"; text: string }[];
  message: string;
};

type Body = DecomposeBody | DailyBody | ReviewBody | ChatBody;

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const apiKey = process.env.GEMINI_API_KEY;
  const provider = getProvider(apiKey, process.env.GEMINI_MODEL);

  if (provider.name === "none") {
    return NextResponse.json(
      {
        error:
          "AI is not configured. Add GEMINI_API_KEY to your environment to enable the coach.",
      },
      { status: 503 }
    );
  }

  try {
    if (body.op === "decompose") {
      const text = await provider.generate({
        prompt: decomposeGoalPrompt(body.profile, body.goal),
        json: true,
      });
      const parsed = safeParseJson<{
        milestones: { title: string; weekOffset: number }[];
        tasks: {
          title: string;
          cadence: "once" | "daily" | "weekly";
          daysOfWeek?: number[];
          estimatedMinutes: number;
          dueDate?: string;
        }[];
      }>(text);
      if (!parsed) {
        return NextResponse.json({ error: "Could not parse AI plan", raw: text }, { status: 502 });
      }
      return NextResponse.json(parsed);
    }

    if (body.op === "daily") {
      const text = await provider.generate({
        prompt: dailyMessagePrompt(body.profile, body.ctx),
        json: true,
      });
      const parsed = safeParseJson<{ push: string; today: string }>(text);
      if (!parsed) {
        return NextResponse.json({ error: "Bad AI output", raw: text }, { status: 502 });
      }
      return NextResponse.json(parsed);
    }

    if (body.op === "review") {
      const text = await provider.generate({
        prompt: weeklyReviewPrompt(body.profile, body.ctx),
        json: true,
      });
      const parsed = safeParseJson<{
        summary: string;
        wins: string[];
        frictions: string[];
        adjustments: string[];
      }>(text);
      if (!parsed) {
        return NextResponse.json({ error: "Bad AI output", raw: text }, { status: 502 });
      }
      return NextResponse.json(parsed);
    }

    if (body.op === "chat") {
      const text = await provider.generate({
        prompt: body.message,
        system: chatSystemPrompt(body.profile, body.goals),
        history: body.history,
      });
      return NextResponse.json({ reply: text.trim() });
    }

    return NextResponse.json({ error: "Unknown op" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
