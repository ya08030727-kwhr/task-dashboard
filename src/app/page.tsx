"use client";
import { useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { ViewMode, Task, Project, Schedule, TaskTag } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  fetchTasks, upsertTask, deleteTask, upsertTasks,
  fetchProjects, upsertProject, deleteProject,
  fetchReflection, saveReflection,
  fetchTomorrowTasks, replaceTomorrowTasks,
} from "@/lib/db";
import { loadSchedules, loadGcalToday, saveGcalToday, loadGcalTomorrow, saveGcalTomorrow, isGcalCacheStale, getNextId } from "@/lib/storage";
import { isMorning, parseGcalEvents } from "@/lib/utils";
import { DEFAULT_PROJECTS } from "@/lib/storage";
import Header from "@/components/Header";
import StatsRow from "@/components/StatsRow";
import ScheduleList from "@/components/ScheduleList";
import TaskList from "@/components/TaskList";
import NightView from "@/components/NightView";
import { SheetTask } from "@/app/api/sheets/route";

const GCAL_CLIENT_ID = process.env.NEXT_PUBLIC_GCAL_CLIENT_ID || "";
const GOOGLE_SCOPE = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
].join(" ");

function Dashboard() {
  const [mode, setMode] = useState<ViewMode>("morning");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [todaySched, setTodaySched] = useState<Schedule[]>([]);
  const [tmrSched, setTmrSched] = useState<Schedule[]>([]);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [isGcalLoading, setIsGcalLoading] = useState(false);
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [gcalStale, setGcalStale] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初期データ読み込み
  useEffect(() => {
    (async () => {
      const [t, p] = await Promise.all([fetchTasks(), fetchProjects()]);
      setTasks(t);
      setProjects(p.length ? p : DEFAULT_PROJECTS);
      if (!p.length) {
        await upsertTasks([]);
        for (const dp of DEFAULT_PROJECTS) await upsertProject(dp);
      }
      const gcalToday = loadGcalToday(), gcalTmr = loadGcalTomorrow();
      const manual = loadSchedules();
      setTodaySched([...manual.today, ...gcalToday]);
      setTmrSched([...manual.tomorrow, ...gcalTmr]);
      if (gcalToday.length || gcalTmr.length) setGcalConnected(true);
      setGcalStale(isGcalCacheStale());
      setMode(isMorning() ? "morning" : "night");
      setLoading(false);
    })();
  }, []);

  // リアルタイム同期
  useEffect(() => {
    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, async () => {
        const t = await fetchTasks();
        setTasks(t);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, async () => {
        const p = await fetchProjects();
        setProjects(p);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // タスク操作
  const handleTasksChange = useCallback(async (newTasks: Task[], changed?: Task, deleted?: number) => {
    setTasks(newTasks);
    if (deleted !== undefined) {
      await deleteTask(deleted);
    } else if (changed) {
      await upsertTask(changed);
    } else {
      // 一括（インポート時など）
      await upsertTasks(newTasks);
    }
  }, []);

  // プロジェクト操作
  const handleProjectsChange = useCallback(async (newProjects: Project[], changed?: Project, deleted?: number) => {
    setProjects(newProjects);
    if (deleted !== undefined) {
      await deleteProject(deleted);
    } else if (changed) {
      await upsertProject(changed);
    } else {
      for (const p of newProjects) await upsertProject(p);
    }
  }, []);

  // Google OAuth
  const googleLogin = GCAL_CLIENT_ID
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useGoogleLogin({
        onSuccess: async (r) => { setAccessToken(r.access_token); await fetchGcal(r.access_token); },
        onError: () => alert("Google連携に失敗しました"),
        scope: GOOGLE_SCOPE,
      })
    : () => alert(".env.local に NEXT_PUBLIC_GCAL_CLIENT_ID を設定してください");

  const fetchGcal = useCallback(async (token?: string) => {
    const tok = token || accessToken;
    if (!tok) { googleLogin(); return; }
    setIsGcalLoading(true);
    try {
      const res = await fetch("/api/gcal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: tok, tzOffset: new Date().getTimezoneOffset(), localDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })() }) });
      if (!res.ok) { if (res.status === 401) { setAccessToken(null); setGcalConnected(false); googleLogin(); } throw new Error(await res.text()); }
      const data = await res.json();
      const te = parseGcalEvents(data.today || []), tre = parseGcalEvents(data.tomorrow || []);
      saveGcalToday(te); saveGcalTomorrow(tre);
      const manual = loadSchedules();
      setTodaySched([...manual.today, ...te]);
      setTmrSched([...manual.tomorrow, ...tre]);
      setGcalConnected(true); setGcalStale(false);
    } catch { alert("カレンダーの取得に失敗しました"); }
    finally { setIsGcalLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchSheets = useCallback(async (token?: string) => {
    const tok = token || accessToken;
    if (!tok) { googleLogin(); return; }
    setIsSheetsLoading(true);
    try {
      const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: tok }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const sheetTasks: SheetTask[] = data.tasks || [];
      const current = await fetchTasks();
      const newTasks: Task[] = sheetTasks
        .filter(st => st.status === "稼働中" && !current.some(t => t.message_ts === st.caseNo))
        .map(st => ({ id: getNextId(), text: `【${st.client}】${st.content}`, done: false, tag: "fukugyo" as TaskTag, dueDate: st.dueDate || undefined, channel: st.caseNo, message_ts: st.caseNo }));
      if (!newTasks.length) { alert("新しい稼働中の案件はありませんでした"); }
      else {
        await upsertTasks(newTasks);
        const updated = [...current, ...newTasks];
        setTasks(updated);
        alert(`✅ ${newTasks.length}件の稼働中案件をインポートしました`);
      }
    } catch (e) { alert(`スプレッドシートの取得に失敗しました: ${e}`); }
    finally { setIsSheetsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const isNight = mode === "night";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F5" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🌸</div>
          <div className="text-sm text-gray-400">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: isNight ? "#1A1A2E" : "#FFF8F5" }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-10">
        <Header
          mode={mode} onModeChange={setMode}
          onGcalRefresh={() => fetchGcal()}
          onSheetsImport={() => fetchSheets()}
          isGcalLoading={isGcalLoading} isSheetsLoading={isSheetsLoading}
          gcalConnected={gcalConnected} gcalStale={gcalStale}
        />
        {isNight
          ? <NightView
              tasks={tasks} onTasksChange={handleTasksChange}
              projects={projects} onProjectsChange={handleProjectsChange}
              onReflectionChange={saveReflection}
              onTomorrowTasksChange={replaceTomorrowTasks}
              fetchReflection={fetchReflection}
              fetchTomorrowTasks={fetchTomorrowTasks}
            />
          : <div className="fade-in">
              <StatsRow tasks={tasks} />
              <ScheduleList todaySchedules={todaySched} tomorrowSchedules={tmrSched} />
              <TaskList tasks={tasks} onTasksChange={handleTasksChange} />
            </div>
        }
      </div>
    </div>
  );
}

export default function Home() {
  if (!GCAL_CLIENT_ID) return <Dashboard />;
  return <GoogleOAuthProvider clientId={GCAL_CLIENT_ID}><Dashboard /></GoogleOAuthProvider>;
}
