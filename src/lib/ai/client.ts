import type { Profile, Goal, Checkin } from "../types";

async function call<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Coach API error: ${res.status}`);
  }
  return (await res.json()) as T;
}

export type DecomposeResult = {
  milestones: { title: string; weekOffset: number }[];
  tasks: {
    title: string;
    cadence: "once" | "daily" | "weekly";
    daysOfWeek?: number[];
    estimatedMinutes: number;
    dueDate?: string;
  }[];
};

export async function aiDecomposeGoal(profile: Profile, goal: Goal) {
  return call<DecomposeResult>({ op: "decompose", profile, goal });
}

export async function aiDailyMessage(
  profile: Profile,
  ctx: {
    date: string;
    activeGoals: { title: string; progress: number }[];
    todayTasks: { title: string; goalTitle: string; doneToday: boolean }[];
    yesterdayCompleted: number;
    yesterdayTotal: number;
  }
) {
  return call<{ push: string; today: string }>({ op: "daily", profile, ctx });
}

export async function aiWeeklyReview(
  profile: Profile,
  ctx: {
    weekStart: string;
    weekEnd: string;
    goals: { title: string; progress: number; tasksCompleted: number; tasksPlanned: number }[];
    checkins: Pick<Checkin, "date" | "note" | "mood">[];
  }
) {
  return call<{
    summary: string;
    wins: string[];
    frictions: string[];
    adjustments: string[];
  }>({ op: "review", profile, ctx });
}

export async function aiChat(
  profile: Profile,
  goals: Goal[],
  history: { role: "user" | "model"; text: string }[],
  message: string
) {
  return call<{ reply: string }>({ op: "chat", profile, goals, history, message });
}
