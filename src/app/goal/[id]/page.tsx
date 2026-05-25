"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Trash2,
  Archive,
  CheckCircle2,
  Plus,
  CalendarClock,
  Target,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskRow } from "@/components/TaskRow";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { Field, Input, Textarea } from "@/components/Field";
import { PageTransition } from "@/components/PageTransition";
import { aiDecomposeGoal } from "@/lib/ai/client";
import { daysUntilDeadline, goalProgress } from "@/lib/progress";
import { haptic } from "@/lib/haptics";
import { uid } from "@/lib/utils";

export default function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const goals = useStore((s) => s.goals);
  const allCheckins = useStore((s) => s.checkins);
  const profile = useStore((s) => s.profile);
  const toggleMilestone = useStore((s) => s.toggleMilestone);
  const addCheckin = useStore((s) => s.addCheckin);
  const archiveGoal = useStore((s) => s.archiveGoal);
  const completeGoal = useStore((s) => s.completeGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const addTask = useStore((s) => s.addTask);
  const setGoalPlan = useStore((s) => s.setGoalPlan);

  const [openCheckin, setOpenCheckin] = useState(false);
  const [openTask, setOpenTask] = useState(false);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState(20);
  const [newTaskCadence, setNewTaskCadence] = useState<"once" | "daily" | "weekly">("daily");
  const [regenerating, setRegenerating] = useState(false);

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);
  const checkins = useMemo(
    () => allCheckins.filter((c) => c.goalId === id).slice().reverse(),
    [allCheckins, id]
  );
  const progress = useMemo(() => (goal ? goalProgress(goal) : 0), [goal]);
  const days = goal ? daysUntilDeadline(goal) : null;

  if (!goal) {
    return (
      <div className="px-5 pt-safe">
        <PageHeader title="Not found" back="/goals" />
        <p className="px-5 text-fg-muted">This goal no longer exists.</p>
      </div>
    );
  }

  function submitCheckin() {
    if (!note.trim()) return;
    addCheckin({
      goalId: id,
      date: new Date().toISOString(),
      note,
      mood,
    });
    haptic("success");
    setNote("");
    setOpenCheckin(false);
  }

  function submitTask() {
    if (!newTaskTitle.trim()) return;
    addTask(id, {
      title: newTaskTitle,
      cadence: newTaskCadence,
      estimatedMinutes: newTaskMinutes,
      daysOfWeek: newTaskCadence === "weekly" ? [1, 3, 5] : undefined,
    });
    haptic("success");
    setNewTaskTitle("");
    setNewTaskMinutes(20);
    setOpenTask(false);
  }

  async function regenerate() {
    if (!goal) return;
    setRegenerating(true);
    try {
      const plan = await aiDecomposeGoal(profile, goal);
      const milestones = plan.milestones.map((m) => ({
        id: uid("m_"),
        title: m.title,
        weekOffset: m.weekOffset,
        done: false,
      }));
      setGoalPlan(goal.id, milestones, plan.tasks);
      haptic("success");
    } catch {
      /* surfaced elsewhere */
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader eyebrow={goal.category} title={goal.title} back="/goals" />

      <div className="px-5">
        <motion.section
          layout
          className="mt-6 flex items-center gap-5 rounded-3xl border border-border bg-bg-surface p-5"
        >
          <ProgressRing value={progress} size={96} stroke={9} label={`${progress}%`} sub="done" />
          <div className="min-w-0 flex-1">
            {goal.why && (
              <p className="text-sm leading-snug text-fg-muted">{goal.why}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fg-dim">
              {days !== null && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {days >= 0 ? `${days} days left` : `${Math.abs(days)}d overdue`}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {goal.milestones.length} milestones · {goal.tasks.length} tasks
              </span>
            </div>
          </div>
        </motion.section>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button onClick={() => setOpenCheckin(true)} variant="primary">
            Log check-in
          </Button>
          <Button onClick={() => setOpenTask(true)} variant="secondary">
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>

        {goal.milestones.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              Milestones
            </h2>
            <ol className="space-y-2.5">
              {goal.milestones
                .slice()
                .sort((a, b) => a.weekOffset - b.weekOffset)
                .map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-bg-surface p-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        toggleMilestone(goal.id, m.id);
                        haptic(m.done ? "light" : "success");
                      }}
                      className={
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border cursor-pointer " +
                        (m.done
                          ? "border-transparent bg-accent-gradient text-white"
                          : "border-border-strong bg-bg-elevated")
                      }
                      aria-label={m.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {m.done && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          "text-[15px] " + (m.done ? "text-fg-dim line-through" : "text-fg")
                        }
                      >
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-dim">Week {m.weekOffset}</p>
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        )}

        {goal.tasks.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              Tasks
            </h2>
            <div className="space-y-2.5">
              {goal.tasks.map((t) => (
                <TaskRow key={t.id} task={t} goal={goal} />
              ))}
            </div>
          </section>
        )}

        {checkins.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              Check-ins
            </h2>
            <ul className="space-y-2.5">
              {checkins.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border bg-bg-surface p-3"
                >
                  <p className="text-[15px] text-fg">{c.note}</p>
                  <p className="mt-1 text-xs text-fg-dim">
                    {new Date(c.date).toLocaleDateString()}
                    {c.mood ? ` · mood ${c.mood}/5` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={regenerate}
            disabled={regenerating}
          >
            <Sparkles className="h-4 w-4" />
            {regenerating ? "Rebuilding…" : "Regenerate plan with coach"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              completeGoal(goal.id);
              haptic("success");
              router.push("/goals");
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark complete
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              archiveGoal(goal.id);
              router.push("/goals");
            }}
          >
            <Archive className="h-4 w-4" /> Archive
          </Button>
          <Button
            variant="ghost"
            className="w-full text-danger"
            onClick={() => {
              if (confirm("Delete this goal? This cannot be undone.")) {
                deleteGoal(goal.id);
                router.push("/goals");
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </section>
      </div>

      <Sheet open={openCheckin} onOpenChange={setOpenCheckin} title="How did it go?">
        <div className="space-y-4">
          <Field label="What happened">
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Did 25 minutes, felt sluggish but pushed through."
              autoFocus
            />
          </Field>
          <Field label="Mood">
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={
                    "h-10 flex-1 rounded-xl border text-sm transition-colors cursor-pointer " +
                    (mood === m
                      ? "border-transparent bg-accent-gradient text-white"
                      : "border-border bg-bg-elevated text-fg-muted")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Button size="lg" className="w-full" onClick={submitCheckin}>
            Save check-in
          </Button>
        </div>
      </Sheet>

      <Sheet open={openTask} onOpenChange={setOpenTask} title="Add a task">
        <div className="space-y-4">
          <Field label="Task">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Read 10 pages"
            />
          </Field>
          <Field label="Cadence">
            <div className="grid grid-cols-3 gap-2">
              {(["daily", "weekly", "once"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTaskCadence(c)}
                  className={
                    "h-10 rounded-xl border text-sm capitalize transition-colors cursor-pointer " +
                    (newTaskCadence === c
                      ? "border-transparent bg-accent-gradient text-white"
                      : "border-border bg-bg-elevated text-fg-muted")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Estimated minutes">
            <Input
              type="number"
              inputMode="numeric"
              min={5}
              value={newTaskMinutes}
              onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
            />
          </Field>
          <Button size="lg" className="w-full" onClick={submitTask}>
            Add task
          </Button>
        </div>
      </Sheet>
    </PageTransition>
  );
}
