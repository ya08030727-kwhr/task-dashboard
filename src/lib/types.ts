export type TaskTag = "hoiku" | "fukugyo" | "shumi";

export interface Task {
  id: number;
  text: string;
  done: boolean;
  tag: TaskTag;
  dueDate?: string; // YYYY-MM-DD
  channel?: string;
  message_ts?: string;
}

export interface Project {
  id: number;
  name: string;
  progress: number;
  color: string;
}

export type GcalCategory = "仕事" | "プライベート" | "副業" | null;

export interface Schedule {
  id: number;
  time: string;
  title: string;
  isGcal?: boolean;
  calendarName?: string;
  colorId?: string; // Google Calendar colorId
  category?: GcalCategory;
}

export type ViewMode = "morning" | "night";

export interface SlackTask {
  id: number;
  text: string;
  channel: string;
  message_ts: string;
  added_by: string;
  created_at: string;
  done: boolean;
}
