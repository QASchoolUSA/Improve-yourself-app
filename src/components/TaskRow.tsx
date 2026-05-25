"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Check, Clock } from "lucide-react";
import type { Task, Goal } from "@/lib/types";
import { isTaskDoneToday } from "@/lib/progress";
import { haptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  goal?: Goal;
  showGoal?: boolean;
};

export function TaskRow({ task, goal, showGoal }: Props) {
  const toggle = useStore((s) => s.toggleTask);
  const done = isTaskDoneToday(task);

  const x = useMotionValue(0);
  const bg = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239,68,68,0.15)", "rgba(24,24,27,0)", "rgba(34,197,94,0.18)"]
  );

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 80) {
      toggle(task.id);
      haptic("success");
    }
    x.set(0);
  }

  function handleToggle() {
    toggle(task.id);
    haptic(done ? "light" : "success");
  }

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{ backgroundColor: bg }}
      className="relative rounded-2xl border border-border bg-bg-surface"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: -40, right: 120 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={onDragEnd}
        className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer",
            done
              ? "border-transparent bg-accent-gradient text-white"
              : "border-border-strong bg-bg-elevated text-transparent hover:text-fg-dim"
          )}
          aria-label={done ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[15px] font-medium leading-tight transition-colors",
              done ? "text-fg-dim line-through" : "text-fg"
            )}
          >
            {task.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-fg-dim">
            {showGoal && goal && <span className="truncate">{goal.title}</span>}
            {showGoal && goal && <span>·</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {task.estimatedMinutes}m
            </span>
            <span>·</span>
            <span className="capitalize">{task.cadence}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
