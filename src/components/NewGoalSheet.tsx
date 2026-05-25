"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { Sheet } from "./Sheet";
import { Button } from "./Button";
import { Field, Input, Textarea } from "./Field";
import { aiDecomposeGoal } from "@/lib/ai/client";
import { haptic } from "@/lib/haptics";
import { uid } from "@/lib/utils";

const CATEGORIES = [
  "Health",
  "Learning",
  "Career",
  "Focus",
  "Relationships",
  "Money",
  "Creativity",
];

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function NewGoalSheet({ open, onOpenChange }: Props) {
  const profile = useStore((s) => s.profile);
  const addGoal = useStore((s) => s.addGoal);
  const setGoalPlan = useStore((s) => s.setGoalPlan);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setWhy("");
    setCategory(CATEGORIES[0]);
    setDeadline("");
    setErr(null);
    setBusy(false);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    const id = addGoal({ title, why, category, deadline: deadline || undefined });
    try {
      const goal = useStore.getState().goals.find((g) => g.id === id)!;
      const plan = await aiDecomposeGoal(profile, goal);
      const milestones = plan.milestones.map((m) => ({
        id: uid("m_"),
        title: m.title,
        weekOffset: m.weekOffset,
        done: false,
      }));
      setGoalPlan(id, milestones, plan.tasks);
      haptic("success");
      onOpenChange(false);
      reset();
      router.push(`/goal/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Coach is offline. Goal saved without a plan.");
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
      title="Set a goal"
      description="Be specific. Your coach will turn this into a weekly plan."
    >
      <div className="space-y-4">
        <Field label="What are you going for?">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Run a sub-50 minute 10K"
          />
        </Field>

        <Field
          label="Why does this matter to you?"
          hint="Honest reasons make better plans."
        >
          <Textarea
            rows={3}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="I want to feel strong and clear-headed."
          />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer " +
                  (category === c
                    ? "border-transparent bg-accent-gradient text-white"
                    : "border-border bg-bg-elevated text-fg-muted")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Deadline (optional)">
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>

        {err && (
          <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={handleCreate}
          disabled={!title.trim() || busy}
        >
          <Sparkles className="h-4 w-4" />
          {busy ? "Building your plan…" : "Build my plan"}
        </Button>
      </div>
    </Sheet>
  );
}
