"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Target, Calendar, ChevronRight } from "lucide-react";
import type { Goal } from "@/lib/types";
import { daysUntilDeadline, goalProgress } from "@/lib/progress";

export function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  const days = daysUntilDeadline(goal);

  return (
    <Link href={`/goal/${goal.id}`} className="block">
      <motion.div
        layout
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="group relative overflow-hidden rounded-3xl border border-border bg-bg-surface p-5 shadow-card cursor-pointer"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-soft blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-fg-dim">
              <Target className="h-3.5 w-3.5" />
              <span>{goal.category}</span>
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold leading-tight">{goal.title}</h3>
            {goal.why && (
              <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{goal.why}</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-fg-dim transition-transform group-hover:translate-x-0.5" />
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-fg-muted">{progress}% complete</span>
            {days !== null && (
              <span className="inline-flex items-center gap-1 text-fg-dim">
                <Calendar className="h-3.5 w-3.5" />
                {days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-elevated">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="h-full rounded-full bg-accent-gradient"
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
