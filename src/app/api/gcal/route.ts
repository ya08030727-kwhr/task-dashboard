import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    const today = new Date(); today.setHours(0,0,0,0);
    const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(dayAfterTomorrow.getDate()+2);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

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
