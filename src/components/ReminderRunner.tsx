"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  fireLocalNotification,
  isQuietHour,
  markDailyFired,
  shouldFireDaily,
} from "@/lib/reminders";
import { aiDailyMessage } from "@/lib/ai/client";
import { goalProgress, todayTasks, isTaskDoneToday } from "@/lib/progress";
import { todayISO } from "@/lib/utils";

export function ReminderRunner() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const tick = async () => {
      const state = useStore.getState();
      const { profile, goals, settings } = state;
      if (!profile.onboarded) return;
      if (!settings.notificationsEnabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      if (!shouldFireDaily()) return;
      if (isQuietHour(new Date(), profile.quietHours)) return;

      const [hh, mm] = profile.reminderTime.split(":").map(Number);
      const now = new Date();
      const ready = now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm);
      if (!ready) return;

      const active = goals.filter((g) => g.status === "active");
      const tasks = todayTasks(active);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yISO = todayISO(yesterday);
      let yDone = 0;
      let yTotal = 0;
      for (const g of active) {
        for (const t of g.tasks) {
          if (t.cadence === "daily") {
            yTotal++;
            if (t.completedDates.includes(yISO)) yDone++;
          } else if (
            t.cadence === "weekly" &&
            t.daysOfWeek?.includes(yesterday.getDay())
          ) {
            yTotal++;
            if (t.completedDates.includes(yISO)) yDone++;
          }
        }
      }

      try {
        const res = await aiDailyMessage(profile, {
          date: todayISO(now),
          activeGoals: active.map((g) => ({ title: g.title, progress: goalProgress(g) })),
          todayTasks: tasks.map(({ task, goal }) => ({
            title: task.title,
            goalTitle: goal.title,
            doneToday: isTaskDoneToday(task),
          })),
          yesterdayCompleted: yDone,
          yesterdayTotal: yTotal,
        });
        useStore.getState().setDailyMessage(todayISO(now), res.today);
        await fireLocalNotification("Coach", res.push, "/today");
        markDailyFired();
      } catch {
        const fallback =
          tasks.length > 0
            ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} on deck today. Start with one.`
            : "New day. What's the smallest move you can make right now?";
        await fireLocalNotification("Coach", fallback, "/today");
        markDailyFired();
      }
    };

    void tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
