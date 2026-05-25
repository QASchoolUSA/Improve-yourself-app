"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Download,
  Upload,
  RotateCcw,
  User,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Field, Input, Textarea } from "@/components/Field";
import { PageTransition } from "@/components/PageTransition";
import { ensureNotificationPermission } from "@/lib/reminders";
import { haptic } from "@/lib/haptics";

export default function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetAll = useStore((s) => s.resetAll);
  const importAll = useStore((s) => s.importAll);
  const router = useRouter();

  const [permStatus, setPermStatus] = useState<NotificationPermission | "default">(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  async function toggleNotifications() {
    if (!settings.notificationsEnabled) {
      const p = await ensureNotificationPermission();
      setPermStatus(p);
      if (p === "granted") {
        setSettings({ notificationsEnabled: true });
        haptic("success");
      }
    } else {
      setSettings({ notificationsEnabled: false });
    }
  }

  function exportData() {
    const data = JSON.stringify(useStore.getState(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `coach-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      importAll(data);
      haptic("success");
    } catch {
      alert("Couldn't parse that file.");
    }
  }

  return (
    <PageTransition>
      <PageHeader eyebrow="App" title="Settings" />

      <div className="space-y-6 px-5 pt-6">
        <Section title="You" icon={<User className="h-3.5 w-3.5" />}>
          <Field label="Name">
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
          </Field>
          <Field label="Who you want to become">
            <Textarea
              rows={3}
              value={profile.identity}
              onChange={(e) => setProfile({ identity: e.target.value })}
            />
          </Field>
          <Field label="Daily time budget (minutes)">
            <Input
              type="number"
              inputMode="numeric"
              value={profile.dailyMinutes}
              onChange={(e) =>
                setProfile({ dailyMinutes: Math.max(5, Number(e.target.value)) })
              }
            />
          </Field>
        </Section>

        <Section title="Reminders" icon={<Bell className="h-3.5 w-3.5" />}>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-bg-surface p-4">
            <div>
              <p className="font-medium text-fg">Daily push notification</p>
              <p className="mt-0.5 text-xs text-fg-dim">
                Permission: {permStatus}
              </p>
            </div>
            <Toggle
              checked={settings.notificationsEnabled && permStatus === "granted"}
              onChange={toggleNotifications}
            />
          </div>
          <Field label="Reminder time">
            <Input
              type="time"
              value={profile.reminderTime}
              onChange={(e) => setProfile({ reminderTime: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quiet hours start">
              <Input
                type="time"
                value={profile.quietHours.start}
                onChange={(e) =>
                  setProfile({
                    quietHours: { ...profile.quietHours, start: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Quiet hours end">
              <Input
                type="time"
                value={profile.quietHours.end}
                onChange={(e) =>
                  setProfile({
                    quietHours: { ...profile.quietHours, end: e.target.value },
                  })
                }
              />
            </Field>
          </div>
        </Section>

        <Section title="AI coach" icon={<BellRing className="h-3.5 w-3.5" />}>
          <p className="rounded-2xl border border-border bg-bg-surface p-4 text-sm text-fg-muted">
            The coach uses your Gemini key, configured server-side via the{" "}
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-xs">
              GEMINI_API_KEY
            </code>{" "}
            environment variable. Free tier signup at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              aistudio.google.com/apikey
            </a>
            .
          </p>
        </Section>

        <Section title="Data" icon={<Clock className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={exportData}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <label>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importData}
              />
              <span className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-bg-elevated text-[15px] font-medium">
                <Upload className="h-4 w-4" /> Import
              </span>
            </label>
          </div>
          <Button
            variant="ghost"
            className="w-full text-danger"
            onClick={() => {
              if (
                confirm(
                  "Erase all goals, tasks, check-ins, and your profile? This cannot be undone."
                )
              ) {
                resetAll();
                router.replace("/onboarding");
              }
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset everything
          </Button>
        </Section>
      </div>
    </PageTransition>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={
        "relative h-7 w-12 rounded-full transition-colors cursor-pointer " +
        (checked ? "bg-accent-gradient" : "bg-bg-elevated")
      }
      aria-pressed={checked}
    >
      <span
        className={
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all " +
          (checked ? "left-[22px]" : "left-0.5")
        }
      />
    </button>
  );
}
