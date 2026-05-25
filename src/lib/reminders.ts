"use client";

import { todayISO } from "./utils";

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function isQuietHour(now: Date, quiet: { start: string; end: string }): boolean {
  const [sh, sm] = quiet.start.split(":").map(Number);
  const [eh, em] = quiet.end.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  if (startM === endM) return false;
  if (startM < endM) return cur >= startM && cur < endM;
  return cur >= startM || cur < endM;
}

export function nextFireMs(timeHHMM: string, from = new Date()): number {
  const [h, m] = timeHHMM.split(":").map(Number);
  const next = new Date(from);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - from.getTime();
}

export async function fireLocalNotification(title: string, body: string, url = "/today") {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.svg",
        badge: "/icons/badge.svg",
        data: { url },
        tag: "coach-daily",
      });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.svg" });
    }
  } catch {
    /* ignore */
  }
}

const LAST_FIRED_KEY = "coach-last-daily-fired";

export function shouldFireDaily(): boolean {
  if (typeof window === "undefined") return false;
  const today = todayISO();
  const last = localStorage.getItem(LAST_FIRED_KEY);
  return last !== today;
}

export function markDailyFired() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_FIRED_KEY, todayISO());
}
