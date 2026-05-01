"use client";
import { useState, useEffect } from "react";
import { Task, Project } from "@/lib/types";
import { getNextId } from "@/lib/storage";

type OnTasksChange = (tasks: Task[], changed?: Task, deleted?: number) => void;
type OnProjectsChange = (projects: Project[], changed?: Project, deleted?: number) => void;

interface Props {
  tasks: Task[];
  onTasksChange: OnTasksChange;
  projects: Project[];
  onProjectsChange: OnProjectsChange;
  onReflectionChange: (d: { good?: string; bad?: string }) => void;
  onTomorrowTasksChange: (texts: string[]) => void;
  fetchReflection: () => Promise<{ good: string; bad: string }>;
  fetchTomorrowTasks: () => Promise<string[]>;
}

export default function NightView({ tasks, onTasksChange, onReflectionChange, onTomorrowTasksChange, fetchReflection, fetchTomorrowTasks }: Props) {
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [tmrTasks, setTmrTasks] = useState<string[]>([]);
  const [newTmr, setNewTmr] = useState("");

  useEffect(() => {
    fetchReflection().then(r => { setGood(r.good); setBad(r.bad); });
    fetchTomorrowTasks().then(setTmrTasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const counted = tasks.filter(t => !(t.done && t.dueDate && t.dueDate < todayStr));
  const done = counted.filter(t => t.done).length;
  const total = counted.length;
  const pending = tasks.filter(t => !t.done);

  const updateGood = (v: string) => { setGood(v); onReflectionChange({ good: v }); };
  const updateBad = (v: string) => { setBad(v); onReflectionChange({ bad: v }); };

  const addTmr = () => {
    if (!newTmr.trim()) return;
    const u = [...tmrTasks, newTmr.trim()];
    setTmrTasks(u); onTomorrowTasksChange(u); setNewTmr("");
  };
  const removeTmr = (i: number) => {
    const u = tmrTasks.filter((_, idx) => idx !== i);
    setTmrTasks(u); onTomorrowTasksChange(u);
  };
  const moveToToday = () => {
    if (!tmrTasks.length) return;
    const newTasks = tmrTasks.map(text => ({ id: getNextId(), text, done: false, tag: "hoiku" as const }));
    onTasksChange([...tasks, ...newTasks]);
    setTmrTasks([]); onTomorrowTasksChange([]);
    alert("✅ 明日のタスクを今日に移しました");
  };

  return (
    <div className="fade-in">
      {/* ふりかえり */}
      <div className="rounded-2xl p-4 mb-5 shadow-sm" style={{ background: "#252540", border: "1px solid #3A3A60" }}>
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#AFA9EC" }}><span>🌙</span><span>今日のふりかえり</span></h2>
        <div className="flex gap-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(127,119,221,0.15)" }}>
          <div className="text-center flex-1"><div className="text-2xl font-bold" style={{ color: "#7F77DD" }}>{done}/{total}</div><div className="text-xs text-gray-400">タスク完了</div></div>
          <div className="w-px" style={{ background: "#3A3A60" }}/>
          <div className="text-center flex-1"><div className="text-2xl font-bold" style={{ color: "#1D9E75" }}>{total - done}</div><div className="text-xs text-gray-400">残り</div></div>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium mb-1.5 block" style={{ color: "#1D9E75" }}>✨ よかったこと</label><textarea value={good} onChange={e => updateGood(e.target.value)} placeholder="今日よかったことを書いてみよう..." rows={3} className="w-full text-sm px-3 py-2 rounded-xl border outline-none resize-none" style={{ border: "1px solid #3A3A60", background: "#1A1A2E", color: "#E8E8F0" }}/></div>
          <div><label className="text-xs font-medium mb-1.5 block" style={{ color: "#F0997B" }}>💡 改善したいこと</label><textarea value={bad} onChange={e => updateBad(e.target.value)} placeholder="明日改善したいことを書いてみよう..." rows={3} className="w-full text-sm px-3 py-2 rounded-xl border outline-none resize-none" style={{ border: "1px solid #3A3A60", background: "#1A1A2E", color: "#E8E8F0" }}/></div>
        </div>
      </div>

      {/* 残っているタスク */}
      {pending.length > 0 && (
        <div className="rounded-2xl p-4 mb-5 shadow-sm" style={{ background: "#252540", border: "1px solid #3A3A60" }}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#AFA9EC" }}><span>📌</span><span>残っているタスク</span></h2>
          {pending.map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-xl mb-2" style={{ background: "#1A1A2E", border: "1px solid #3A3A60" }}>
              <span style={{ color: "#666" }}>○</span>
              <span className="text-sm flex-1" style={{ color: "#A0A0B0" }}>{t.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 明日やること */}
      <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#252540", border: "1px solid #3A3A60" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#AFA9EC" }}><span>📋</span><span>明日やること</span></h2>
          {tmrTasks.length > 0 && <button onClick={moveToToday} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ background: "#1D9E75" }}>今日に移す</button>}
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={newTmr} onChange={e => setNewTmr(e.target.value)} onKeyDown={e => e.key === "Enter" && addTmr()} placeholder="明日のタスクを追加..." className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none" style={{ border: "1px solid #3A3A60", background: "#1A1A2E", color: "#E8E8F0" }}/>
          <button onClick={addTmr} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#7F77DD,#5A52C8)" }}>追加</button>
        </div>
        {tmrTasks.length === 0
          ? <div className="text-sm text-gray-500 py-2 text-center">明日のタスクを追加しましょう</div>
          : tmrTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl mb-2 group" style={{ background: "#1A1A2E", border: "1px solid #3A3A60" }}>
                <span className="text-sm flex-1" style={{ color: "#E8E8F0" }}>{t}</span>
                <button onClick={() => removeTmr(i)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 text-sm">✕</button>
              </div>
            ))
        }
      </div>
    </div>
  );
}
