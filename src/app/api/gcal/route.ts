import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    // 広めの2日分ウィンドウで取得（今日/明日の分類はクライアント側で行う）
    const now = new Date();
    const windowStart = new Date(now); windowStart.setHours(0,0,0,0);
    const windowEnd = new Date(windowStart); windowEnd.setDate(windowEnd.getDate()+3);

    const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!calRes.ok) return NextResponse.json({ error: "callist failed" }, { status: calRes.status });
    const { items: calendars = [] } = await calRes.json();

    const allEvents: object[] = [];
    await Promise.all(
      calendars.filter((c: {accessRole:string}) => c.accessRole !== "freeBusyReader").slice(0,10)
        .map(async (cal: {id:string; summary:string}) => {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${new URLSearchParams({ timeMin:windowStart.toISOString(), timeMax:windowEnd.toISOString(), singleEvents:"true", orderBy:"startTime", maxResults:"20" })}`, { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!res.ok) return;
          const { items = [] } = await res.json();
          for (const e of items) {
            allEvents.push({ ...e, calendarName: cal.summary, colorId: e.colorId || null });
          }
        })
    );
    return NextResponse.json({ events: allEvents });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
