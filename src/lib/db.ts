import { supabase } from "./supabase";
import { Task, Project } from "./types";

// ── Tasks ──────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").order("id");
  if (error) { console.error(error); return []; }
  return (data || []).map(rowToTask);
}

export async function upsertTask(task: Task) {
  const { error } = await supabase.from("tasks").upsert(taskToRow(task));
  if (error) console.error("upsertTask", error);
}

export async function deleteTask(id: number) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) console.error("deleteTask", error);
}

export async function upsertTasks(tasks: Task[]) {
  if (!tasks.length) return;
  const { error } = await supabase.from("tasks").upsert(tasks.map(taskToRow));
  if (error) console.error("upsertTasks", error);
}

// ── Projects ───────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from("projects").select("*").order("id");
  if (error) { console.error(error); return []; }
  return (data || []).map(rowToProject);
}

export async function upsertProject(p: Project) {
  const { error } = await supabase.from("projects").upsert({ id: p.id, name: p.name, progress: p.progress, color: p.color });
  if (error) console.error("upsertProject", error);
}

export async function deleteProject(id: number) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) console.error("deleteProject", error);
}

// ── Reflection ─────────────────────────────────────────

export async function fetchReflection(): Promise<{ good: string; bad: string }> {
  const { data, error } = await supabase.from("reflection").select("*").eq("id", 1).single();
  if (error || !data) return { good: "", bad: "" };
  return { good: data.good || "", bad: data.bad || "" };
}

export async function saveReflection(d: { good?: string; bad?: string }) {
  const { error } = await supabase.from("reflection").upsert({ id: 1, ...d, updated_at: new Date().toISOString() });
  if (error) console.error("saveReflection", error);
}

// ── Tomorrow tasks ─────────────────────────────────────

export async function fetchTomorrowTasks(): Promise<string[]> {
  const { data, error } = await supabase.from("tomorrow_tasks").select("*").order("position");
  if (error) { console.error(error); return []; }
  return (data || []).map((r: { text: string }) => r.text);
}

export async function replaceTomorrowTasks(texts: string[]) {
  await supabase.from("tomorrow_tasks").delete().neq("id", 0);
  if (!texts.length) return;
  const { error } = await supabase.from("tomorrow_tasks").insert(texts.map((text, i) => ({ text, position: i })));
  if (error) console.error("replaceTomorrowTasks", error);
}

// ── Row converters ─────────────────────────────────────

function taskToRow(t: Task) {
  return {
    id: t.id,
    text: t.text,
    done: t.done,
    tag: t.tag,
    due_date: t.dueDate || null,
    channel: t.channel || null,
    message_ts: t.message_ts || null,
  };
}

function rowToTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as number,
    text: r.text as string,
    done: r.done as boolean,
    tag: r.tag as Task["tag"],
    dueDate: r.due_date as string | undefined,
    channel: r.channel as string | undefined,
    message_ts: r.message_ts as string | undefined,
  };
}

function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as number,
    name: r.name as string,
    progress: r.progress as number,
    color: r.color as string,
  };
}
