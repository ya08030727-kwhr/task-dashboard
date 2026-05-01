import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, localDate, tzOffset = 0 } = await request.json();
    if (!accessToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    // クライアントのローカル日付 "YYYY-MM-DD" を基準に境界を計算
    // localDate がない場合は tzOffset で推定（フォールバック）
    function localMidnight(baseDate: string, daysFromNow: number): Date {
      const [y, m, d] = baseDate.split("-").map(Number);
      // ローカル 00:00 をUTCに変換: UTC = local + tzOffset(分)
      return new Date(Date.UTC(y, m - 1, d + daysFromNow) + tzOffset * 60 * 1000);
    }
    const base = localDate || (() => {
      const n = new Date(Date.now() - tzOffset * 60 * 1000);
      return `${n.getUTCFullYear()}-${String(n.getUTCMonth()+1).padStart(2,"0")}-${String(n.getUTCDate()).padStart(2,"0")}`;
    })();
    const today = localMidnight(base, 0);
    const tomorrow = localMidnight(base, 1);
    const dayAfterTomorrow = localMidnight(base, 2);

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
