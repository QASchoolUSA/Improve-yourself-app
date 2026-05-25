"use client";

import { Drawer } from "vaul";
import { ReactNode } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Sheet({ open, onOpenChange, title, description, children }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] max-w-md flex-col rounded-t-3xl border-t border-border bg-bg-surface outline-none pb-safe">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-bg-elevated" />
          {(title || description) && (
            <div className="px-5 pt-5">
              {title && (
                <Drawer.Title className="font-display text-xl font-semibold tracking-tight">
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="mt-1 text-sm text-fg-muted">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}
          <div className="overflow-y-auto px-5 pb-6 pt-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
