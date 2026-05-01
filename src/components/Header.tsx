"use client";
import { ViewMode } from "@/lib/types";
import { formatDate, greetingMessage } from "@/lib/utils";

interface Props {
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  onGcalRefresh: () => void;
  onSheetsImport: () => void;
  isGcalLoading: boolean;
  isSheetsLoading: boolean;
  gcalConnected: boolean;
  gcalStale: boolean;
}

export default function Header({ mode, onModeChange, onGcalRefresh, onSheetsImport, isGcalLoading, isSheetsLoading, gcalConnected, gcalStale }: Props) {
  const isNight = mode === "night";
  return (
    <header className="rounded-2xl p-5 mb-5 shadow-sm" style={{ background: isNight ? "linear-gradient(135deg,#1A1A2E,#252545)" : "linear-gradient(135deg,#FFE8DC,#EEE9FF)" }}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: isNight ? "#AFA9EC" : "#A0785A" }}>{formatDate(new Date())}</div>
          <h1 className="text-xl font-bold" style={{ color: isNight ? "#E8E8F0" : "#5A3A28" }}>{greetingMessage()}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ background: isNight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)" }}>
            <button onClick={() => onModeChange("morning")} className="px-4 py-2 text-sm font-medium transition-all" style={{ background: !isNight ? "linear-gradient(135deg,#F0997B,#D85A30)" : "transparent", color: !isNight ? "white" : "#AFA9EC", borderRadius: "10px" }}>☀️ 朝</button>
            <button onClick={() => onModeChange("night")} className="px-4 py-2 text-sm font-medium transition-all" style={{ background: isNight ? "linear-gradient(135deg,#7F77DD,#5A52C8)" : "transparent", color: isNight ? "white" : "#C09070", borderRadius: "10px" }}>🌙 夜</button>
          </div>

          {/* Google Calendar button */}
          <button onClick={onGcalRefresh} disabled={isGcalLoading} className="px-3 py-2 text-sm rounded-xl font-medium flex items-center gap-1.5 relative" style={{ background: gcalConnected && !gcalStale ? "rgba(29,158,117,0.15)" : isNight ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)", color: gcalConnected && !gcalStale ? "#1D9E75" : "#7F77DD", border: `1px solid ${gcalConnected && !gcalStale ? "#1D9E75" : "#AFA9EC"}` }}>
            <span>{isGcalLoading ? "⟳" : "📅"}</span>
            <span>{isGcalLoading ? "取得中..." : gcalConnected && !gcalStale ? "Gcal同期済" : gcalStale ? "Gcal（要更新）" : "Gcal連携"}</span>
            {gcalStale && !isGcalLoading && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "#D85A30" }} />
            )}
          </button>

          {/* Sheets import button */}
          <button onClick={onSheetsImport} disabled={isSheetsLoading} className="px-3 py-2 text-sm rounded-xl font-medium flex items-center gap-1.5" style={{ background: isNight ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)", color: "#1D9E75", border: "1px solid #1D9E75" }}>
            <span>{isSheetsLoading ? "⟳" : "📊"}</span>
            <span>{isSheetsLoading ? "取得中..." : "案件取込"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
