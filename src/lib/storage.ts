import { Task, Project, Schedule } from "./types";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch { return fallback; }
}
function setItem(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const DEFAULT_PROJECTS: Project[] = [
  { id: 1, name: "動画編集", progress: 30, color: "#7F77DD" },
  { id: 2, name: "Webデザイン", progress: 60, color: "#F0997B" },
  { id: 3, name: "コーディング", progress: 15, color: "#1D9E75" },
];

export const loadTasks = () => getItem<Task[]>("tasks", []);
export const saveTasks = (v: Task[]) => setItem("tasks", v);
export const loadProjects = () => getItem<Project[]>("projects", DEFAULT_PROJECTS);
export const saveProjects = (v: Project[]) => setItem("projects", v);
export const loadSchedules = () => getItem<{ today: Schedule[]; tomorrow: Schedule[] }>("scheds", { today: [], tomorrow: [] });
export const saveSchedules = (v: { today: Schedule[]; tomorrow: Schedule[] }) => setItem("scheds", v);
export const loadTomorrowTasks = () => getItem<string[]>("tmr_tasks", []);
export const saveTomorrowTasks = (v: string[]) => setItem("tmr_tasks", v);
export const loadReflection = () => ({
  good: getItem<string>("reflect-good", ""),
  bad: getItem<string>("reflect-bad", ""),
});
export const saveReflection = (d: { good?: string; bad?: string }) => {
  if (d.good !== undefined) setItem("reflect-good", d.good);
  if (d.bad !== undefined) setItem("reflect-bad", d.bad);
};
export function getNextId(): number {
  const id = getItem<number>("next_id", 1);
  setItem("next_id", id + 1);
  return id;
}

// Gcal cache with date validation
function todayStr() {
  // ローカル日付（UTC変換なし）で判定 → 0:00 JST に日付が変わる
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function loadGcalToday(): Schedule[] {
  if (getItem<string>("gcal_date", "") !== todayStr()) return [];
  return getItem<Schedule[]>("gcal_today", []);
}
export function saveGcalToday(v: Schedule[]) {
  setItem("gcal_today", v);
  setItem("gcal_date", todayStr());
}
export function loadGcalTomorrow(): Schedule[] {
  if (getItem<string>("gcal_date", "") !== todayStr()) return [];
  return getItem<Schedule[]>("gcal_tmr", []);
}
export function saveGcalTomorrow(v: Schedule[]) {
  setItem("gcal_tmr", v);
}
export function isGcalCacheStale(): boolean {
  return getItem<string>("gcal_date", "") !== todayStr();
}
