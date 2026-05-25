"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  title?: string;
  eyebrow?: string;
  back?: string;
  right?: ReactNode;
};

export function PageHeader({ title, eyebrow, back, right }: Props) {
  return (
    <header className="px-5 pt-safe">
      <div className="flex items-center justify-between pt-4">
        {back ? (
          <Link
            href={back}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-surface text-fg-muted cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : (
          <span className="h-10" />
        )}
        {right ?? <span className="h-10" />}
      </div>
      {(eyebrow || title) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="mt-4"
        >
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-fg-dim">
              {eyebrow}
            </p>
          )}
          {title && (
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>
          )}
        </motion.div>
      )}
    </header>
  );
}
