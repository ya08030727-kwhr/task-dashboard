import { NextRequest, NextResponse } from "next/server";

const SPREADSHEET_ID = "10SA9uFJzIHTDTL4jHZck0SJ8Hjmx1O_AaNezjp9rjcs";
const SHEET_NAME = "案件管理"; // gid=1417450239

export interface SheetTask {
  caseNo: string;      // A: 案件No.
  status: string;      // B: ステータス
  dueLeft: string;     // C: 納期まで
  client: string;      // D: 請求先
  content: string;     // E: 案件内容
  amount: string;      // F: 受注金額
  dueDate: string;     // G: 予定納品日 (YYYY-MM-DD)
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    // Fetch rows 6 onward (row 6 = headers, row 7+ = data)
    const range = encodeURIComponent(`${SHEET_NAME}!A6:K50`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];

    // Skip header row (index 0 = row 6), parse data rows
    const tasks: SheetTask[] = rows.slice(1)
      .filter(row => row[0] && row[1]) // 案件No. and ステータス must exist
      .map(row => ({
        caseNo:  row[0] || "",
        status:  row[1] || "",
        dueLeft: row[2] || "",
        client:  row[3] || "",
        content: row[4] || "",
        amount:  row[5] || "",
        dueDate: parseDueDate(row[6] || ""),
      }))
      .filter(t => t.content); // 案件内容が空のものは除外

    return NextResponse.json({ tasks });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// "2026/05/01" → "2026-05-01"
function parseDueDate(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\//g, "-").trim();
}
