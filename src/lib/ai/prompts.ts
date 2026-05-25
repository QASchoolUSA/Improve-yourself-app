import type { Profile, Goal, Task, Checkin } from "../types";

const VOICE = `You are an honest, supportive personal coach. You write like a trusted mentor:
- Concrete. No fluff, no platitudes, no clichés.
- Direct but warm. Never preachy or condescending.
- Short sentences. Plain words. Never use emojis.
- You speak about what the user can do today, not abstract ideals.`;

function profileBlock(p: Profile): string {
  return `USER PROFILE
Name: ${p.name || "(unknown)"}
Identity they want to grow into: ${p.identity || "(not set)"}
Values that matter to them: ${p.values.join(", ") || "(none listed)"}
Realistic daily time budget: ${p.dailyMinutes} minutes
Timezone: ${p.timezone}`;
}

export function decomposeGoalPrompt(p: Profile, goal: Goal): string {
  return `${VOICE}

${profileBlock(p)}

The user just created this goal:
Title: ${goal.title}
Why it matters to them: ${goal.why}
Category: ${goal.category}
Deadline: ${goal.deadline ?? "(none — open-ended)"}

Design a realistic plan. Output ONLY valid JSON, no prose, no markdown fences. Schema:
{
  "milestones": [
    { "title": "string (concrete, observable)", "weekOffset": number (weeks from now, 1-12) }
  ],
  "tasks": [
    {
      "title": "string (a specific action the user can do)",
      "cadence": "daily" | "weekly" | "once",
      "daysOfWeek": [0-6] (only if weekly; 0=Sun),
      "estimatedMinutes": number,
      "dueDate": "YYYY-MM-DD" (only if once)
    }
  ]
}

Rules:
- 3 to 6 milestones, ordered by weekOffset.
- 2 to 5 tasks. Mix cadences. Each task must fit inside the daily time budget.
- Task titles must be specific actions ("Run 3 km easy pace"), never vague ("Get fit").
- If goal is open-ended, spread milestones over ~8 weeks.
- Never include any field not in the schema.`;
}

export function dailyMessagePrompt(
  p: Profile,
  ctx: {
    date: string;
    activeGoals: { title: string; progress: number }[];
    todayTasks: { title: string; goalTitle: string; doneToday: boolean }[];
    yesterdayCompleted: number;
    yesterdayTotal: number;
  }
): string {
  return `${VOICE}

${profileBlock(p)}

Today is ${ctx.date}.
Active goals (with % progress):
${ctx.activeGoals.map((g) => `- ${g.title}: ${g.progress}%`).join("\n") || "(none yet)"}

Today's tasks (${ctx.todayTasks.filter((t) => !t.doneToday).length} pending):
${ctx.todayTasks.map((t) => `- [${t.doneToday ? "x" : " "}] ${t.title} (${t.goalTitle})`).join("\n") || "(no tasks scheduled)"}

Yesterday: completed ${ctx.yesterdayCompleted} of ${ctx.yesterdayTotal} planned tasks.

Write the user's morning message. Output ONLY valid JSON, no markdown:
{
  "push": "string, 1 sentence, max 90 characters, motivating and specific",
  "today": "string, 2-3 sentences, references one concrete task from today, ends with the most important action"
}`;
}

export function weeklyReviewPrompt(
  p: Profile,
  ctx: {
    weekStart: string;
    weekEnd: string;
    goals: { title: string; progress: number; tasksCompleted: number; tasksPlanned: number }[];
    checkins: Pick<Checkin, "date" | "note" | "mood">[];
  }
): string {
  return `${VOICE}

${profileBlock(p)}

Week ${ctx.weekStart} → ${ctx.weekEnd}. Goal-by-goal stats:
${ctx.goals
  .map(
    (g) =>
      `- ${g.title}: ${g.progress}% progress, ${g.tasksCompleted}/${g.tasksPlanned} tasks completed`
  )
  .join("\n") || "(no goals)"}

Check-ins this week:
${ctx.checkins.map((c) => `- ${c.date}${c.mood ? ` (mood ${c.mood}/5)` : ""}: ${c.note}`).join("\n") || "(none)"}

Write this week's review. Output ONLY valid JSON, no markdown:
{
  "summary": "string, 3-4 sentences. Honest assessment. Name what worked, what didn't.",
  "wins": ["string", ...] (1-3 wins, specific),
  "frictions": ["string", ...] (1-3 frictions, specific),
  "adjustments": ["string", ...] (1-3 concrete adjustments to try next week)
}`;
}

export function chatSystemPrompt(p: Profile, goals: Goal[]): string {
  return `${VOICE}

${profileBlock(p)}

Active goals the user is working on:
${goals
  .filter((g) => g.status === "active")
  .map((g) => `- ${g.title} (why: ${g.why})`)
  .join("\n") || "(none yet)"}

The user will message you. Reply as their coach. Keep replies to 1-3 sentences unless they ask for depth. Ask one sharp question when useful. Never use emojis. Never list unless asked.`;
}
