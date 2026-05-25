"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Archive } from "lucide-react";
import { useStore } from "@/lib/store";
import { GoalCard } from "@/components/GoalCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { PageTransition } from "@/components/PageTransition";
import { NewGoalSheet } from "@/components/NewGoalSheet";

export default function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = goals.filter((g) => g.status === "active");
  const done = goals.filter((g) => g.status === "completed");
  const archived = goals.filter((g) => g.status === "archived");

  return (
    <PageTransition>
      <PageHeader
        eyebrow="What you're building"
        title="Goals"
        right={
          <Button size="sm" onClick={() => setOpen(true)} className="px-4">
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      <div className="px-5 pt-6">
        {active.length === 0 && done.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-bg-surface/60 p-8 text-center">
            <p className="font-display text-lg text-fg">No goals yet.</p>
            <p className="mt-2 text-sm text-fg-muted">
              Tell your coach what you want to change. It'll build the plan.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-5">
              <Plus className="h-4 w-4" /> Set your first goal
            </Button>
          </div>
        )}

        <motion.div layout className="space-y-3.5">
          <AnimatePresence>
            {active.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <GoalCard goal={g} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {done.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              Completed
            </h2>
            <div className="space-y-3">
              {done.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          </section>
        )}

        {archived.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-dim cursor-pointer"
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </button>
            {showArchived && (
              <div className="mt-3 space-y-3 opacity-70">
                {archived.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <NewGoalSheet open={open} onOpenChange={setOpen} />
    </PageTransition>
  );
}
