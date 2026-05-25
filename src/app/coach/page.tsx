"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, Sparkles, ClipboardList } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { PageTransition } from "@/components/PageTransition";
import { aiChat, aiWeeklyReview } from "@/lib/ai/client";
import { todayISO, uid } from "@/lib/utils";
import { goalProgress } from "@/lib/progress";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { cn } from "@/lib/utils";

type Review = {
  summary: string;
  wins: string[];
  frictions: string[];
  adjustments: string[];
};

export default function CoachPage() {
  const profile = useStore((s) => s.profile);
  const goals = useStore((s) => s.goals);
  const checkins = useStore((s) => s.checkins);
  const allMessages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const messages = useMemo(
    () => allMessages.filter((m) => m.kind === "chat"),
    [allMessages]
  );

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const history = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role === "coach" ? ("model" as const) : ("user" as const),
        text: m.text,
      })),
    [messages]
  );

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    addMessage({ kind: "chat", role: "user", text, date: new Date().toISOString() });
    setInput("");
    try {
      const res = await aiChat(profile, goals, history, text);
      addMessage({
        kind: "chat",
        role: "coach",
        text: res.reply,
        date: new Date().toISOString(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Coach is offline.");
    } finally {
      setBusy(false);
    }
  }

  async function runReview() {
    if (reviewBusy) return;
    setReviewBusy(true);
    setErr(null);
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    const we = endOfWeek(now, { weekStartsOn: 1 });
    const wsISO = format(ws, "yyyy-MM-dd");
    const weISO = format(we, "yyyy-MM-dd");

    const goalStats = goals
      .filter((g) => g.status !== "archived")
      .map((g) => {
        let planned = 0;
        let completed = 0;
        for (const t of g.tasks) {
          if (t.cadence === "daily") {
            planned += 7;
            completed += t.completedDates.filter((d) => d >= wsISO && d <= weISO).length;
          } else if (t.cadence === "weekly" && t.daysOfWeek) {
            planned += t.daysOfWeek.length;
            completed += t.completedDates.filter((d) => d >= wsISO && d <= weISO).length;
          } else if (t.cadence === "once") {
            planned += 1;
            if (t.completedDates.some((d) => d >= wsISO && d <= weISO)) completed += 1;
          }
        }
        return {
          title: g.title,
          progress: goalProgress(g),
          tasksCompleted: completed,
          tasksPlanned: planned,
        };
      });

    const weekCheckins = checkins
      .filter((c) => c.date.slice(0, 10) >= wsISO && c.date.slice(0, 10) <= weISO)
      .map((c) => ({ date: c.date.slice(0, 10), note: c.note, mood: c.mood }));

    try {
      const r = await aiWeeklyReview(profile, {
        weekStart: wsISO,
        weekEnd: weISO,
        goals: goalStats,
        checkins: weekCheckins,
      });
      setReview(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Coach is offline.");
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Your coach"
        title="Talk it out"
        right={
          <button
            type="button"
            onClick={runReview}
            disabled={reviewBusy}
            className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-bg-surface px-3 text-xs text-fg-muted disabled:opacity-50 cursor-pointer"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {reviewBusy ? "Reviewing…" : "Weekly review"}
          </button>
        }
      />

      <div className="px-5 pt-5">
        {review && (
          <motion.section
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 overflow-hidden rounded-3xl border border-accent/30 bg-accent-soft p-5"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5" /> This week
            </div>
            <p className="text-[15px] leading-snug text-fg">{review.summary}</p>
            {review.wins.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-success">
                  Wins
                </p>
                <ul className="mt-1 space-y-1 text-sm text-fg-muted">
                  {review.wins.map((w, i) => (
                    <li key={i}>· {w}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.frictions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                  Frictions
                </p>
                <ul className="mt-1 space-y-1 text-sm text-fg-muted">
                  {review.frictions.map((f, i) => (
                    <li key={i}>· {f}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.adjustments.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Try next week
                </p>
                <ul className="mt-1 space-y-1 text-sm text-fg-muted">
                  {review.adjustments.map((a, i) => (
                    <li key={i}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        {messages.length === 0 && !review && (
          <div className="rounded-3xl border border-dashed border-border bg-bg-surface/60 p-6 text-center">
            <p className="font-display text-lg text-fg">Ask your coach anything.</p>
            <p className="mt-2 text-sm text-fg-muted">
              Stuck? Need a kick? Want to rethink a goal? Start a conversation.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug",
                  m.role === "user"
                    ? "ml-auto bg-accent-gradient text-white"
                    : "mr-auto border border-border bg-bg-surface text-fg"
                )}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="mr-auto inline-flex max-w-[80%] items-center gap-1.5 rounded-2xl border border-border bg-bg-surface px-3 py-2 text-fg-dim">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-dim" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-dim [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-dim [animation-delay:240ms]" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {err && (
          <p className="mt-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            {err}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-24 mx-auto max-w-md px-5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-bg-surface/95 p-1.5 shadow-card backdrop-blur-xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Tell your coach…"
            className="flex-1 bg-transparent px-3 py-2 text-[15px] text-fg placeholder:text-fg-dim focus:outline-none"
          />
          <Button
            size="sm"
            onClick={() => void send()}
            disabled={!input.trim() || busy}
            className="px-3"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
