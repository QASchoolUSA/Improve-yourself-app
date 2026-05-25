"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, RefreshCw, Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskRow } from "@/components/TaskRow";
import { Button } from "@/components/Button";
import { PageTransition } from "@/components/PageTransition";
import { todayTasks, isTaskDoneToday } from "@/lib/progress";
import { aiDailyMessage } from "@/lib/ai/client";
import { todayISO } from "@/lib/utils";
import { goalProgress } from "@/lib/progress";
import Link from "next/link";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

export default function Today() {
  const profile = useStore((s) => s.profile);
  const goals = useStore((s) => s.goals);
  const dailyMessageCache = useStore((s) => s.dailyMessageCache);
  const setDailyMessage = useStore((s) => s.setDailyMessage);

  const todayKey = todayISO();
  const dailyMessage = dailyMessageCache[todayKey];

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const tasks = useMemo(() => todayTasks(activeGoals), [activeGoals]);
  const totalToday = tasks.length;
  const doneToday = tasks.filter(({ task }) => isTaskDoneToday(task)).length;
  const pct = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100);

  async function fetchDaily(force = false) {
    if (loading) return;
    if (!force && dailyMessage) return;
    if (activeGoals.length === 0) return;
    setLoading(true);
    setErr(null);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yISO = todayISO(yesterday);
      let yDone = 0;
      let yTotal = 0;
      for (const g of activeGoals) {
        for (const t of g.tasks) {
          if (t.cadence === "daily") {
            yTotal++;
            if (t.completedDates.includes(yISO)) yDone++;
          }
        }
      }
      const res = await aiDailyMessage(profile, {
        date: todayKey,
        activeGoals: activeGoals.map((g) => ({
          title: g.title,
          progress: goalProgress(g),
        })),
        todayTasks: tasks.map(({ task, goal }) => ({
          title: task.title,
          goalTitle: goal.title,
          doneToday: isTaskDoneToday(task),
        })),
        yesterdayCompleted: yDone,
        yesterdayTotal: yTotal,
      });
      setDailyMessage(todayKey, res.today);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not reach coach");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDaily(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoals.length]);

  return (
    <PageTransition>
      <PageHeader
        eyebrow={greeting()}
        title={profile.name ? profile.name : "Today"}
        right={
          <button
            type="button"
            onClick={() => fetchDaily(true)}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-surface text-fg-muted disabled:opacity-50 cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
          </button>
        }
      />

      <div className="px-5">
        <motion.section
          layout
          className="mt-6 overflow-hidden rounded-3xl border border-border bg-bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-4">
            <ProgressRing
              value={pct}
              size={88}
              stroke={9}
              label={`${doneToday}/${totalToday || 0}`}
              sub="today"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">
                <Sparkles className="h-3.5 w-3.5" /> Daily coach
              </div>
              <p className="mt-2 text-[15px] leading-snug text-fg">
                {dailyMessage ??
                  (err
                    ? "Your coach is offline. Open Settings to wire up Gemini."
                    : activeGoals.length === 0
                    ? "No goals yet. Tell me who you want to become and I'll build the plan."
                    : "Pulling today's plan from your coach…")}
              </p>
            </div>
          </div>
        </motion.section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              Today's tasks
            </h2>
            {totalToday > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-dim">
                <Flame className="h-3.5 w-3.5" /> {doneToday} done
              </span>
            )}
          </div>

          {totalToday === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-bg-surface/60 p-6 text-center">
              <p className="text-sm text-fg-muted">
                {activeGoals.length === 0
                  ? "Set your first goal to get tasks today."
                  : "Nothing scheduled today. Add a daily habit to a goal."}
              </p>
              <Link href="/goals" className="mt-4 inline-block">
                <Button size="sm" variant="secondary">
                  {activeGoals.length === 0 ? "Set a goal" : "Open goals"}
                </Button>
              </Link>
            </div>
          ) : (
            <motion.div layout className="space-y-2.5">
              {tasks.map(({ task, goal }) => (
                <TaskRow key={task.id} task={task} goal={goal} showGoal />
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
