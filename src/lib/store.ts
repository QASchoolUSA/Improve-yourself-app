"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Profile,
  Goal,
  Task,
  Checkin,
  CoachMessage,
  AppSettings,
  Milestone,
} from "./types";
import { todayISO, uid } from "./utils";

type State = {
  profile: Profile;
  goals: Goal[];
  checkins: Checkin[];
  messages: CoachMessage[];
  settings: AppSettings;
  dailyMessageCache: Record<string, string>;
};

type Actions = {
  setProfile: (p: Partial<Profile>) => void;
  completeOnboarding: () => void;

  addGoal: (g: Omit<Goal, "id" | "createdAt" | "status" | "milestones" | "tasks"> & {
    milestones?: Milestone[];
    tasks?: Task[];
  }) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  setGoalPlan: (id: string, milestones: Milestone[], tasks: Omit<Task, "id" | "goalId" | "completedDates">[]) => void;
  archiveGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;

  toggleMilestone: (goalId: string, milestoneId: string) => void;
  toggleTask: (taskId: string, date?: string) => void;
  addTask: (goalId: string, t: Omit<Task, "id" | "goalId" | "completedDates">) => void;
  removeTask: (taskId: string) => void;

  addCheckin: (c: Omit<Checkin, "id">) => void;

  addMessage: (m: Omit<CoachMessage, "id">) => void;
  clearChat: () => void;

  setSettings: (s: Partial<AppSettings>) => void;
  setDailyMessage: (date: string, text: string) => void;

  resetAll: () => void;
  importAll: (data: Partial<State>) => void;
};

const defaultProfile: Profile = {
  name: "",
  identity: "",
  values: [],
  dailyMinutes: 30,
  timezone:
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  reminderTime: "08:00",
  quietHours: { start: "22:00", end: "07:00" },
  onboarded: false,
};

const defaultSettings: AppSettings = {
  notificationsEnabled: false,
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      goals: [],
      checkins: [],
      messages: [],
      settings: defaultSettings,
      dailyMessageCache: {},

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, onboarded: true } })),

      addGoal: (g) => {
        const id = uid("g_");
        const goal: Goal = {
          id,
          createdAt: new Date().toISOString(),
          status: "active",
          milestones: g.milestones ?? [],
          tasks: g.tasks ?? [],
          title: g.title,
          why: g.why,
          category: g.category,
          deadline: g.deadline,
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        return id;
      },
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      setGoalPlan: (id, milestones, tasks) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  milestones: milestones.map((m) => ({ ...m, id: m.id || uid("m_") })),
                  tasks: tasks.map((t) => ({
                    ...t,
                    id: uid("t_"),
                    goalId: id,
                    completedDates: [],
                  })),
                }
              : g
          ),
        })),
      archiveGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, status: "archived" } : g)),
        })),
      completeGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, status: "completed" } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, done: !m.done } : m
                  ),
                }
              : g
          ),
        })),

      toggleTask: (taskId, date) => {
        const d = date ?? todayISO();
        set((s) => ({
          goals: s.goals.map((g) => ({
            ...g,
            tasks: g.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const has = t.completedDates.includes(d);
              return {
                ...t,
                completedDates: has
                  ? t.completedDates.filter((x) => x !== d)
                  : [...t.completedDates, d],
              };
            }),
          })),
        }));
      },

      addTask: (goalId, t) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  tasks: [
                    ...g.tasks,
                    { ...t, id: uid("t_"), goalId, completedDates: [] },
                  ],
                }
              : g
          ),
        })),
      removeTask: (taskId) =>
        set((s) => ({
          goals: s.goals.map((g) => ({
            ...g,
            tasks: g.tasks.filter((t) => t.id !== taskId),
          })),
        })),

      addCheckin: (c) =>
        set((s) => ({
          checkins: [...s.checkins, { ...c, id: uid("c_") }],
        })),

      addMessage: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: uid("msg_") }],
        })),
      clearChat: () =>
        set((s) => ({
          messages: s.messages.filter((m) => m.kind !== "chat"),
        })),

      setSettings: (sNew) => set((s) => ({ settings: { ...s.settings, ...sNew } })),
      setDailyMessage: (date, text) =>
        set((s) => ({ dailyMessageCache: { ...s.dailyMessageCache, [date]: text } })),

      resetAll: () =>
        set({
          profile: defaultProfile,
          goals: [],
          checkins: [],
          messages: [],
          settings: defaultSettings,
          dailyMessageCache: {},
        }),
      importAll: (data) => set((s) => ({ ...s, ...data })),
    }),
    {
      name: "coach-store-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
