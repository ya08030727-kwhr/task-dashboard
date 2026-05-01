"use client";
import { useState, useRef } from "react";
import { Task, TaskTag, SlackTask } from "@/lib/types";
import { TAG_LABELS, TAG_COLORS } from "@/lib/utils";
import { getNextId } from "@/lib/storage";

const TAGS: TaskTag[] = ["hoiku","fukugyo","shumi"];

type OnTasksChange = (tasks: Task[], changed?: Task, deleted?: number) => void;

function dueBadge(dueDate?: string) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  const diff = Math.round((due.getTime()-today.getTime())/(86400000));
  if (diff < 0) return { label:`${Math.abs(diff)}日超過`, color:"#C0392B", bg:"#FDECEA" };
  if (diff === 0) return { label:"今日まで", color:"#D85A30", bg:"#FEF0EB" };
  if (diff === 1) return { label:"明日まで", color:"#BA7517", bg:"#FEF9EE" };
  return { label:`${diff}日後`, color:"#1D9E75", bg:"#E6F7F2" };
}

function TaskItem({ task, onToggle, onDelete, onDueDateChange }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onDueDateChange: (id: number, d: string) => void;
}) {
  const ts = TAG_COLORS[task.tag];
  const due = dueBadge(task.dueDate);
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl mb-2 group transition-all"
      style={{ background: task.done ? "#F5F5F8" : ts.bg, border: `1px solid ${task.done ? "#E0E0E8" : ts.border}`, opacity: task.done ? 0.6 : 1 }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: task.done ? "#C0C0C8" : ts.dot }}/>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ accentColor: "#1D9E75" }}/>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium" style={{ color: task.done ? "#A0A0B0" : ts.text, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
        {task.channel && <span className="text-xs ml-2" style={{ color: ts.text, opacity: 0.6 }}>{task.channel}</span>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {due && !task.done && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.7)", color: due.color }}>📅 {due.label}</span>}
          {!task.done && (showPicker
            ? <input type="date" defaultValue={task.dueDate||""} autoFocus className="text-xs px-2 py-0.5 rounded-lg border outline-none" style={{ border: `1px solid ${ts.border}`, color: ts.text }} onChange={e => { onDueDateChange(task.id, e.target.value); setShowPicker(false); }} onBlur={() => setShowPicker(false)}/>
            : <button onClick={() => setShowPicker(true)} className="text-xs transition-colors opacity-0 group-hover:opacity-100" style={{ color: ts.text, opacity: 0.5 }}>{task.dueDate ? "✏️ 期日変更" : "📅 期日を設定"}</button>
          )}
        </div>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.6)", color: ts.text }}>{TAG_LABELS[task.tag]}</span>
      <button onClick={() => onDelete(task.id)} className="transition-colors opacity-0 group-hover:opacity-100 text-sm mt-0.5" style={{ color: ts.text }}>✕</button>
    </div>
  );
}

export default function TaskList({ tasks, onTasksChange }: { tasks: Task[]; onTasksChange: OnTasksChange }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<TaskTag>("hoiku");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<TaskTag | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.tag === filter);
  const pending = filtered.filter(t => !t.done).sort((a, b) => !a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.localeCompare(b.dueDate));

  const add = () => {
    if (!text.trim()) return;
    const t: Task = { id: getNextId(), text: text.trim(), done: false, tag, dueDate: due || undefined };
    onTasksChange([...tasks, t], t);
    setText(""); setDue("");
  };

  const toggle = (id: number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    const changed = updated.find(t => t.id === id)!;
    onTasksChange(updated, changed);
  };

  const remove = (id: number) => {
    onTasksChange(tasks.filter(t => t.id !== id), undefined, id);
  };

  const changeDue = (id: number, d: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, dueDate: d || undefined } : t);
    const changed = updated.find(t => t.id === id)!;
    onTasksChange(updated, changed);
  };

  const slackImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SlackTask[];
        const newTasks: Task[] = data
          .filter(item => !tasks.some(t => t.message_ts === item.message_ts))
          .map(item => ({ id: getNextId(), text: item.text, done: item.done, tag: "fukugyo" as TaskTag, channel: item.channel, message_ts: item.message_ts }));
        onTasksChange([...tasks, ...newTasks]);
        alert(`✅ ${newTasks.length}件インポートしました`);
      } catch { alert("読み込み失敗"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  return (
    <div className="mb-5">
      <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#FFF", border: "1px solid #F0EDFF" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#5A3A8A" }}><span>✅</span><span>タスク</span></h2>
          <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5" style={{ background: "#FEF0EB", color: "#D85A30", border: "1px solid #F0997B" }}><span>🫡</span><span>Slackから追加</span></button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={slackImport}/>
        </div>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(["all", ...TAGS] as const).map(f => {
            const s = f !== "all" ? TAG_COLORS[f] : null;
            return <button key={f} onClick={() => setFilter(f)} className="text-xs px-3 py-1 rounded-full font-medium transition-all" style={{ background: filter === f ? (s?.text || "#7F77DD") : (s?.bg || "#F0F0FF"), color: filter === f ? "white" : (s?.text || "#7F77DD"), border: s ? `1px solid ${s.border}` : undefined }}>{f === "all" ? "すべて" : TAG_LABELS[f]}</button>;
          })}
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="新しいタスクを追加..." className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none" style={{ border: "1px solid #E0DEFF", background: "#FAFAFF" }}/>
            <select value={tag} onChange={e => setTag(e.target.value as TaskTag)} className="text-xs px-2 py-2 rounded-xl border outline-none" style={{ border: "1px solid #E0DEFF", background: "#FAFAFF", color: "#7F77DD" }}>
              {TAGS.map(t => <option key={t} value={t}>{TAG_LABELS[t]}</option>)}
            </select>
            <button onClick={add} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#7F77DD,#5A52C8)" }}>追加</button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <span className="text-xs text-gray-400">📅 期日：</span>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} className="text-xs px-2 py-1 rounded-lg border outline-none" style={{ border: "1px solid #E0DEFF", background: "#FAFAFF", color: "#7F77DD" }}/>
            {due && <button onClick={() => setDue("")} className="text-xs text-gray-400">✕</button>}
          </div>
        </div>
        {pending.length === 0 && <div className="text-center py-6 text-gray-400 text-sm"><div className="text-3xl mb-2">🎉</div>タスクがありません</div>}
        {pending.map(t => <TaskItem key={t.id} task={t} onToggle={toggle} onDelete={remove} onDueDateChange={changeDue}/>)}
      </div>
    </div>
  );
}
