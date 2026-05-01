"use client";
import { Schedule, GcalCategory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// カテゴリ別スタイル
const CATEGORY_STYLE: Record<NonNullable<GcalCategory>, { label: string; bg: string; color: string; dot: string }> = {
  "仕事":       { label: "仕事",       bg: "#FDECEA", color: "#C0392B", dot: "#E53935" },   // Tomato
  "プライベート": { label: "プライベート", bg: "#E3F4FC", color: "#0277BD", dot: "#039BE5" }, // Peacock
  "副業":       { label: "副業",       bg: "#FCE8F0", color: "#AD1457", dot: "#E91E8C" },   // Flamingo
};

function Item({ s }: { s: Schedule }) {
  const cat = s.category ? CATEGORY_STYLE[s.category] : null;
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl mb-2 transition-all"
      style={{
        background: cat ? `${cat.dot}10` : s.isGcal ? "#F0FAFF" : "#F8F8FF",
        border: `1px solid ${cat ? `${cat.dot}40` : s.isGcal ? "#B0D8F5" : "#E0DEFF"}`,
      }}
    >
      {/* カテゴリドット */}
      {cat && (
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: cat.dot }} />
      )}
      <div className="text-xs font-mono font-bold mt-0.5 min-w-[45px]"
        style={{ color: cat ? cat.color : "#7F77DD" }}>
        {s.time}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700">{s.title}</div>
        {s.isGcal && s.calendarName && (
          <div className="text-xs mt-0.5" style={{ color: cat ? cat.color : "#4488CC" }}>
            {s.calendarName}
          </div>
        )}
      </div>
      {cat && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          style={{ background: cat.bg, color: cat.color }}>
          {cat.label}
        </span>
      )}
    </div>
  );
}

export default function ScheduleList({ todaySchedules, tomorrowSchedules }: { todaySchedules: Schedule[]; tomorrowSchedules: Schedule[] }) {
  const today = new Date(), tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sortByTime = (arr: Schedule[]) => [...arr].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="mb-5">
      <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#FFF", border: "1px solid #F0EDFF" }}>
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#5A3A8A" }}>
          <span>🗓️</span><span>スケジュール</span>
        </h2>
        <div className="mb-4">
          <div className="text-xs font-bold mb-2 px-2 py-1 rounded-lg inline-block"
            style={{ background: "#EEEDFE", color: "#7F77DD" }}>
            今日 {formatDate(today)}
          </div>
          {todaySchedules.length === 0
            ? <div className="text-sm text-gray-400 py-2 pl-2">予定はありません</div>
            : sortByTime(todaySchedules).map(s => <Item key={s.id} s={s} />)
          }
        </div>
        <div>
          <div className="text-xs font-bold mb-2 px-2 py-1 rounded-lg inline-block"
            style={{ background: "#FEF0EB", color: "#D85A30" }}>
            明日 {formatDate(tomorrow)}
          </div>
          {tomorrowSchedules.length === 0
            ? <div className="text-sm text-gray-400 py-2 pl-2">予定はありません</div>
            : sortByTime(tomorrowSchedules).map(s => <Item key={s.id} s={s} />)
          }
        </div>
      </div>
    </div>
  );
}
