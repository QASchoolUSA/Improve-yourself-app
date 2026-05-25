"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";

const tabs = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/coach", label: "Coach", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function TabBar() {
  const pathname = usePathname();
  const onboarded = useStore((s) => s.profile.onboarded);

  if (!onboarded || pathname?.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-safe">
      <div className="mx-2 mb-3 flex items-center justify-around rounded-full border border-border bg-bg-surface/90 px-2 py-2 shadow-card backdrop-blur-xl">
        {tabs.map((t) => {
          const active =
            pathname === t.href || (pathname?.startsWith(t.href) && t.href !== "/");
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex flex-1 items-center justify-center"
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                  active ? "text-fg" : "text-fg-dim hover:text-fg-muted"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-full bg-accent-gradient"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="relative h-5 w-5" strokeWidth={2.2} />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
