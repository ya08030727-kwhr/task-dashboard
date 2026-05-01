import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, tzOffset = 0 } = await request.json();
    if (!accessToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    // ユーザーのローカル日付で今日/明日の境界を計算（タイムゾーン対応）
    // tzOffset = getTimezoneOffset() の値（JST = -540）
    function localMidnight(daysFromNow: number): Date {
      const localNow = new Date(Date.now() - tzOffset * 60 * 1000);
      const y = localNow.getUTCFullYear();
      const m = localNow.getUTCMonth();
      const d = localNow.getUTCDate() + daysFromNow;
      return new Date(Date.UTC(y, m, d) + tzOffset * 60 * 1000);
    }
    const today = localMidnight(0);
    const tomorrow = localMidnight(1);
    const dayAfterTomorrow = localMidnight(2);

    const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!calRes.ok) return NextResponse.json({ error: "callist failed" }, { status: calRes.status });
    const { items: calendars = [] } = await calRes.json();

    const todayEvents: object[] = [], tmrEvents: object[] = [];
    await Promise.all(
      calendars.filter((c: {accessRole:string}) => c.accessRole !== "freeBusyReader").slice(0,10)
        .map(async (cal: {id:string; summary:string}) => {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${new URLSearchParams({ timeMin:today.toISOString(), timeMax:dayAfterTomorrow.toISOString(), singleEvents:"true", orderBy:"startTime", maxResults:"20" })}`, { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!res.ok) return;
          const { items = [] } = await res.json();
          for (const e of items) {
            const s = new Date(e.start?.dateTime || e.start?.date);
            const enriched = { ...e, calendarName: cal.summary, colorId: e.colorId || null };
            if (s >= today && s < tomorrow) todayEvents.push(enriched);
            else if (s >= tomorrow && s < dayAfterTomorrow) tmrEvents.push(enriched);
          }
        })
    );
    return NextResponse.json({ today: todayEvents, tomorrow: tmrEvents });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
