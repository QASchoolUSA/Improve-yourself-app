import { differenceInCalendarDays } from "date-fns";
import type { Goal, Task } from "./types";
import { todayISO } from "./utils";

export function goalProgress(goal: Goal): number {
  if (goal.milestones.length === 0 && goal.tasks.length === 0) return 0;
  let total = 0;
  let done = 0;
  if (goal.milestones.length > 0) {
    total += goal.milestones.length;
    done += goal.milestones.filter((m) => m.done).length;
  }
  if (goal.tasks.length > 0) {
    const oneTime = goal.tasks.filter((t) => t.cadence === "once");
    total += oneTime.length;
    done += oneTime.filter((t) => t.completedDates.length > 0).length;
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function daysUntilDeadline(goal: Goal): number | null {
  if (!goal.deadline) return null;
  return differenceInCalendarDays(new Date(goal.deadline), new Date());
}

export function isTaskDueToday(task: Task, date = new Date()): boolean {
  if (task.cadence === "once") {
    if (!task.dueDate) return true;
    return task.dueDate.slice(0, 10) === todayISO(date);
  }
  if (task.cadence === "daily") return true;
  if (task.cadence === "weekly") {
    if (!task.daysOfWeek || task.daysOfWeek.length === 0) return false;
    return task.daysOfWeek.includes(date.getDay());
  }
  return false;
}

export function isTaskDoneToday(task: Task, date = new Date()): boolean {
  return task.completedDates.includes(todayISO(date));
}

export function taskStreak(task: Task): number {
  if (task.completedDates.length === 0) return 0;
  const sorted = [...task.completedDates].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = todayISO(d);
    if (sorted.includes(iso)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function todayTasks(goals: Goal[]): { task: Task; goal: Goal }[] {
  const out: { task: Task; goal: Goal }[] = [];
  const today = new Date();
  for (const g of goals) {
    if (g.status !== "active") continue;
    for (const t of g.tasks) {
      if (isTaskDueToday(t, today)) out.push({ task: t, goal: g });
    }
  }
  return out;
}
