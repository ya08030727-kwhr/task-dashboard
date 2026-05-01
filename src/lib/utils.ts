import { TaskTag } from "./types";

export function formatDate(date: Date): string {
  const days = ["日","月","火","水","木","金","土"];
  return `${date.getMonth()+1}月${date.getDate()}日（${days[date.getDay()]}）`;
}
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
}
export function isMorning(): boolean {
  const h = new Date().getHours();
  return h >= 5 && h < 18;
}
export function greetingMessage(): string {
  const h = new Date().getHours();
  if (h < 10) return "おはようございます！✨";
  if (h < 18) return "お疲れさまです！💪";
  return "今日もお疲れさまでした！🌙";
}

export const TAG_LABELS: Record<TaskTag, string> = { hoiku:"保育", fukugyo:"副業", shumi:"プライベート" };
// スケジュールと同じ色体系：Tomato=保育(仕事), Flamingo=副業, Peacock=プライベート
export const TAG_COLORS: Record<TaskTag, { bg:string; text:string; border:string; dot:string }> = {
  hoiku:   { bg:"#FDECEA", text:"#C0392B", border:"#E5393540", dot:"#E53935" },  // Tomato → 仕事/保育
  fukugyo: { bg:"#FCE8F0", text:"#AD1457", border:"#E91E8C40", dot:"#E91E8C" },  // Flamingo → 副業
  shumi:   { bg:"#E3F4FC", text:"#0277BD", border:"#039BE540", dot:"#039BE5" },  // Peacock → プライベート
};

export interface GoogleCalendarEvent {
  id?: string; summary?: string;
  start?: { dateTime?: string; date?: string };
  calendarName?: string;
  colorId?: string;
}

// Google Calendar colorId → カテゴリ
// Tomato=11→仕事, Peacock=7→プライベート, Flamingo=4→副業
function colorIdToCategory(colorId?: string): import("./types").GcalCategory {
  if (!colorId) return null;
  const map: Record<string, import("./types").GcalCategory> = {
    "11": "仕事",       // Tomato
    "7":  "プライベート", // Peacock
    "4":  "副業",       // Flamingo
  };
  return map[colorId] ?? null;
}

export function parseGcalEvents(events: GoogleCalendarEvent[]): import("./types").Schedule[] {
  return events.map((e, i) => ({
    id: i + 1,
    time: e.start?.dateTime ? formatTime(new Date(e.start.dateTime)) : "終日",
    title: e.summary || "(無題)",
    isGcal: true,
    calendarName: e.calendarName,
    colorId: e.colorId,
    category: colorIdToCategory(e.colorId),
  }));
}
