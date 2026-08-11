import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY && ADMIN_PASSWORD);
}

function isAdmin(request: NextRequest) {
  return Boolean(ADMIN_PASSWORD && request.headers.get("x-admin-password") === ADMIN_PASSWORD);
}

async function supabase(path: string, init: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY!,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: "주문 서비스가 준비되지 않았습니다." }, { status: 503 });
  const body = await request.json();
  const size = body.size === "20kg" ? "20kg" : body.size === "10kg" ? "10kg" : null;
  const quantity = Number(body.quantity);
  const price = size === "10kg" ? 39000 : size === "20kg" ? 78000 : 0;
  if (!body.name?.trim() || !body.address?.trim() || !body.phone?.trim() || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json({ error: "주문 정보를 다시 확인해 주세요." }, { status: 400 });
  }
  const response = await supabase("orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: body.name.trim(), address: body.address.trim(), phone: body.phone.trim(), size, quantity, total: price * quantity }),
  });
  if (!response.ok) return NextResponse.json({ error: "주문 접수 중 문제가 발생했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: "주문 서비스가 준비되지 않았습니다." }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  const response = await supabase("orders?select=*&order=created_at.desc", { method: "GET" });
  if (!response.ok) return NextResponse.json({ error: "주문 목록을 불러오지 못했습니다." }, { status: 500 });
  const rows = await response.json();
  return NextResponse.json(rows.map((row: Record<string, unknown>) => ({
    id: row.id, name: row.name, address: row.address, phone: row.phone, size: row.size,
    quantity: row.quantity, total: row.total, createdAt: row.created_at,
  })));
}

export async function DELETE(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: "주문 서비스가 준비되지 않았습니다." }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "주문 번호가 없습니다." }, { status: 400 });
  const response = await supabase(`orders?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) return NextResponse.json({ error: "주문을 삭제하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
