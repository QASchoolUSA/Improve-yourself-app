export type Profile = {
  name: string;
  identity: string;
  values: string[];
  dailyMinutes: number;
  timezone: string;
  reminderTime: string;
  quietHours: { start: string; end: string };
  onboarded: boolean;
};

export type Milestone = {
  id: string;
  title: string;
  weekOffset: number;
  done: boolean;
};

export type TaskCadence = "once" | "daily" | "weekly";

export type Task = {
  id: string;
  goalId: string;
  title: string;
  cadence: TaskCadence;
  daysOfWeek?: number[];
  estimatedMinutes: number;
  dueDate?: string;
  completedDates: string[];
};

export type Goal = {
  id: string;
  title: string;
  why: string;
  category: string;
  deadline?: string;
  status: "active" | "completed" | "archived";
  createdAt: string;
  milestones: Milestone[];
  tasks: Task[];
};

export type Checkin = {
  id: string;
  goalId: string;
  date: string;
  note: string;
  mood?: 1 | 2 | 3 | 4 | 5;
};

export type CoachMessageKind = "daily" | "review" | "chat";

export type CoachMessage = {
  id: string;
  date: string;
  kind: CoachMessageKind;
  role: "coach" | "user";
  text: string;
};

export type AppSettings = {
  geminiApiKey?: string;
  notificationsEnabled: boolean;
};
