"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/Field";
import { haptic } from "@/lib/haptics";

const VALUE_OPTIONS = [
  "Health",
  "Focus",
  "Learning",
  "Discipline",
  "Kindness",
  "Creativity",
  "Family",
  "Career",
  "Wealth",
  "Adventure",
];

export default function Onboarding() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [identity, setIdentity] = useState(profile.identity);
  const [values, setValues] = useState<string[]>(profile.values);
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyMinutes);
  const [reminderTime, setReminderTime] = useState(profile.reminderTime);

  function next() {
    haptic("light");
    setStep((s) => s + 1);
  }

  function finish() {
    setProfile({ name, identity, values, dailyMinutes, reminderTime });
    completeOnboarding();
    haptic("success");
    router.replace("/today");
  }

  const steps = [
    {
      title: "Become who you want to be.",
      eyebrow: "Welcome",
      body: (
        <p className="text-fg-muted">
          This is your coach. You tell it who you want to become. It builds the plan, reminds you, and helps you ship — every day.
        </p>
      ),
      cta: "Start",
      onCta: next,
      can: true,
    },
    {
      title: "What should I call you?",
      eyebrow: "Step 1 of 4",
      body: (
        <Field label="Your name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nikita"
          />
        </Field>
      ),
      cta: "Continue",
      onCta: next,
      can: name.trim().length > 0,
    },
    {
      title: "Who do you want to become?",
      eyebrow: "Step 2 of 4",
      body: (
        <Field
          label="Your future self, in one sentence"
          hint="The more specific, the better the coaching."
        >
          <Textarea
            autoFocus
            rows={4}
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="A calm, focused engineer who runs 3x a week and reads every night."
          />
        </Field>
      ),
      cta: "Continue",
      onCta: next,
      can: identity.trim().length > 4,
    },
    {
      title: "What do you care about?",
      eyebrow: "Step 3 of 4",
      body: (
        <div className="flex flex-wrap gap-2">
          {VALUE_OPTIONS.map((v) => {
            const active = values.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  haptic("light");
                  setValues((cur) =>
                    cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
                  );
                }}
                className={
                  "rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer " +
                  (active
                    ? "border-transparent bg-accent-gradient text-white"
                    : "border-border bg-bg-surface text-fg-muted hover:text-fg")
                }
              >
                {v}
              </button>
            );
          })}
        </div>
      ),
      cta: "Continue",
      onCta: next,
      can: values.length > 0,
    },
    {
      title: "How much time can you give it daily?",
      eyebrow: "Step 4 of 4",
      body: (
        <div className="space-y-5">
          <Field label="Daily time budget" hint="Be realistic. You can change it later.">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={180}
                step={5}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-bg-elevated accent-accent"
              />
              <span className="w-20 text-right font-display text-2xl font-semibold">
                {dailyMinutes}m
              </span>
            </div>
          </Field>
          <Field label="Morning reminder time">
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </Field>
        </div>
      ),
      cta: "Build my plan",
      onCta: finish,
      can: dailyMinutes >= 5,
    },
  ];

  const s = steps[step];

  return (
    <div className="min-h-screen-safe px-6 pt-safe">
      <div className="pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-3 py-1 text-xs uppercase tracking-wider text-fg-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {s.eyebrow}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="mt-6"
          >
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              {s.title}
            </h1>
            <div className="mt-8">{s.body}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-6 pb-safe">
        <Button
          size="lg"
          className="w-full"
          onClick={s.onCta}
          disabled={!s.can}
        >
          {s.cta}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
