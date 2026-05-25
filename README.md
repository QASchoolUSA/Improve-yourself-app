# Coach — Become Who You Want to Be

A mobile-first installable PWA that acts as your AI personal trainer. You tell it who you want to become; it sets goals, decomposes them into concrete tasks, reminds you, tracks progress, and coaches you with daily messages powered by Google Gemini.

## What it does

- **Onboarding** captures your identity, values, and daily time budget. That context shapes every AI reply.
- **Goals** — create a goal and the coach builds a weekly plan: milestones + daily/weekly/one-off tasks sized to your time budget.
- **Today** — your daily AI message, all today's tasks across goals, swipe-to-complete, streak ring.
- **Coach** — chat with your trainer any time. Weekly review button summarizes wins, frictions, and concrete adjustments.
- **Reminders** — daily push notification (with AI-personalized text) delivered via Web Notifications + a Service Worker. Quiet hours respected.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Motion (formerly Framer Motion) · Vaul bottom sheets · Zustand + localStorage · Google Gemini 2.0 Flash · PWA (manifest + service worker).

## Run locally

```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm install
npm run dev
```

Open <http://localhost:3000> on your phone over LAN (`http://<your-mac-ip>:3000`) to test mobile.

## Get a free Gemini API key

1. Go to <https://aistudio.google.com/apikey>.
2. Click **Create API key**.
3. Copy it into `.env.local` as `GEMINI_API_KEY=...`.

Free tier (Gemini 2.0 Flash): 15 requests/min, 1M tokens/day — well above a single-user coach's needs.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at <https://vercel.com/new>.
3. In **Settings → Environment Variables**, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL` if you want to override the default `gemini-2.0-flash`).
4. Deploy. Vercel's free Hobby tier is plenty for personal use.

## Install on your phone

After deploying:

- **iOS Safari**: open the site → Share → **Add to Home Screen**. Launches full-screen, no browser chrome.
- **Android Chrome**: open the site → menu → **Install app**. Real PWA, system-level notifications.

Note: iOS Safari supports web push notifications only for installed PWAs (iOS 16.4+). The in-app daily message always works regardless.

## Architecture

```
src/
  app/
    layout.tsx           Root layout with fonts, tab bar, SW + reminder runner
    page.tsx             Redirects to /today or /onboarding
    onboarding/          First-run identity capture
    today/               Today tab
    goals/               Goals list
    goal/[id]/           Goal detail with milestones, tasks, check-ins
    coach/               Chat + weekly review
    settings/            Profile, reminders, data
    api/coach/route.ts   Server-side Gemini proxy (keeps key off client)
  components/            UI primitives (Sheet, Button, GoalCard, TaskRow, ProgressRing, ...)
  lib/
    store.ts             Zustand store + localStorage persist
    types.ts             Domain types
    progress.ts          Progress, streaks, today's tasks
    reminders.ts         Notification permission + scheduler
    haptics.ts           navigator.vibrate wrapper
    ai/
      provider.ts        Gemini provider (swappable for Groq/OpenRouter)
      prompts.ts         All four AI prompts (decompose, daily, review, chat)
      client.ts          Browser-side fetch helpers
public/
  sw.js                  Service worker for offline shell + notification clicks
  manifest.webmanifest   PWA manifest
  icons/                 SVG icons
```

## Customization

- **Different AI provider**: swap `getProvider()` in `src/lib/ai/provider.ts`. Same interface, free providers like Groq drop in cleanly.
- **Theme**: tokens live in `tailwind.config.ts` under `colors.bg`, `colors.accent`, and the `accent-gradient` background image.
- **Voice / tone**: edit the `VOICE` constant in `src/lib/ai/prompts.ts` to change how the coach talks to you.

## Privacy

All your data (profile, goals, tasks, check-ins, chat history) lives in `localStorage` on your device. Only the prompts sent to Gemini leave your device. No accounts, no analytics, no backend database.
# Improve-yourself-app
