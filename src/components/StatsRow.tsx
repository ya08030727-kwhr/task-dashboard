"use client";
import { Task } from "@/lib/types";

function isOldDone(t: Task): boolean {
  if (!t.done || !t.dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(t.dueDate) < today;
}

export default function StatsRow({ tasks }: { tasks: Task[] }) {
  const counted = tasks.filter(t => !isOldDone(t));
  const total = counted.length, done = counted.filter(t => t.done).length;
  const remaining = total - done;
  const cards = [
    { label:"今日のタスク", value:total, unit:"件", icon:"📋", color:"#7F77DD", bg:"#EEEDFE" },
    { label:"完了済み", value:done, unit:"件", icon:"✅", color:"#1D9E75", bg:"#E6F7F2" },
    { label:"残り", value:remaining, unit:"件", icon:"⏳", color:"#D85A30", bg:"#FEF0EB" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cards.map(c => (
        <div key={c.label} className="rounded-2xl p-4 text-center shadow-sm" style={{ background: c.bg }}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}<span className="text-sm ml-0.5">{c.unit}</span></div>
          <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
