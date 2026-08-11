"use client";

import { FormEvent, useMemo, useState } from "react";

type Size = "10kg" | "20kg";
type Order = {
  id: string;
  name: string;
  address: string;
  phone: string;
  size: Size;
  quantity: number;
  total: number;
  createdAt: string;
};

const PRODUCTS = {
  "10kg": 39000,
  "20kg": 78000,
} as const;

const FARM_ADDRESS = "주소를 입력해 주세요";
const PAYMENT_ACCOUNT = {
  bank: "IBK기업은행",
  number: "237-132742-04-012",
  holder: "농업회사법인 하얀술 주식회사",
} as const;
const money = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"order" | "manage">("order");
  const [size, setSize] = useState<Size>("10kg");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = PRODUCTS[size] * quantity;
  const summary = useMemo(() => orders.reduce((acc, order) => {
    acc.count += order.quantity;
    acc.amount += order.total;
    acc[order.size] += order.quantity;
    return acc;
  }, { count: 0, amount: 0, "10kg": 0, "20kg": 0 }), [orders]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, address: form.get("address"), phone: form.get("phone"), size, quantity }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      event.currentTarget.reset();
      setQuantity(1);
      setMessage(`${name}님의 주문이 접수되었습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문을 접수하지 못했습니다.");
    } finally { setLoading(false); }
    window.setTimeout(() => setMessage(""), 4000);
  }

  async function unlockOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/orders", { headers: { "x-admin-password": adminPassword } });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) { setMessage(result.error); window.setTimeout(() => setMessage(""), 3500); return; }
    setOrders(result);
    setAdminUnlocked(true);
  }

  async function deleteOrder(id: string) {
    if (!confirm("이 주문을 삭제할까요?")) return;
    const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-admin-password": adminPassword } });
    if (response.ok) setOrders(orders.filter((item) => item.id !== id));
    else setMessage("주문을 삭제하지 못했습니다.");
  }

  function orderText() {
    return [
      "[서영암농협 유기농 새청무 발주]",
      `배송지: ${FARM_ADDRESS}`,
      `총 수량: ${summary.count}포 (10kg ${summary["10kg"]}포 / 20kg ${summary["20kg"]}포)`,
      `총 금액: ${money(summary.amount)}원`,
      "",
      ...orders.map((order, index) => `${index + 1}. ${order.name} / ${order.phone} / ${order.address} / ${order.size} × ${order.quantity}개 / ${money(order.total)}원`),
    ].join("\n");
  }

  async function copyOrders() {
    await navigator.clipboard.writeText(orderText());
    setMessage("발주 내용이 복사되었습니다.");
    window.setTimeout(() => setMessage(""), 3000);
  }

  async function copyAccount() {
    await navigator.clipboard.writeText(PAYMENT_ACCOUNT.number);
    setMessage("입금 계좌번호가 복사되었습니다.");
    window.setTimeout(() => setMessage(""), 3000);
  }

  function downloadCsv() {
    const rows = [["주문일", "이름", "전화번호", "주소", "용량", "수량", "금액"], ...orders.map((o) => [new Date(o.createdAt).toLocaleDateString("ko-KR"), o.name, o.phone, o.address, o.size, o.quantity, o.total])];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `새청무-주문목록-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="새청무 주문 홈"><span className="grain">米</span><span>하얀술의<br /><strong>유기농 새청무</strong></span></a>
        <nav aria-label="주요 메뉴">
          <button className={tab === "order" ? "active" : ""} onClick={() => setTab("order")}>주문하기</button>
          <button className={tab === "manage" ? "active" : ""} onClick={() => setTab("manage")}>주문관리 <span>{orders.length}</span></button>
        </nav>
      </header>

      {message && <div className="toast" role="status">✓ {message}</div>}

      {tab === "order" ? (
        <>
          <section className="hero" id="top">
            <div className="eyebrow">ORGANIC RICE · YEONGAM</div>
            <h1>땅이 키우고,<br /><em>정성으로 거둔 쌀</em></h1>
            <p>서영암의 맑은 햇살과 건강한 흙에서 자란 유기농 새청무를<br className="desktop" /> 산지의 마음 그대로 보내드립니다.</p>
            <div className="trust"><span>✓ 유기농 재배</span><span>✓ 서영암 산지직송</span><span>✓ 안전한 포장</span></div>
          </section>

          <section className="order-layout">
            <div className="story-card">
              <div className="rice-visual"><span>햅쌀</span><b>새청무</b><small>ORGANIC RICE</small></div>
              <div className="story-copy"><p>오늘의 밥상이 기다려지는 이유</p><h2>찰기와 윤기가 좋은<br />우리 땅의 새청무</h2><div className="price-line"><span>10kg <b>39,000원</b></span><span>20kg <b>78,000원</b></span></div></div>
            </div>

            <form className="order-form" onSubmit={submitOrder}>
              <div className="form-head"><span>01</span><div><h2>배송 정보를 알려주세요</h2><p>정확한 배송을 위해 빠짐없이 입력해 주세요.</p></div></div>
              <label>주문자 이름<input name="name" required placeholder="이름을 입력해 주세요" autoComplete="name" /></label>
              <label>전화번호<input name="phone" required type="tel" placeholder="010-0000-0000" autoComplete="tel" pattern="[0-9-]{9,13}" /></label>
              <label>배송 주소<textarea name="address" required placeholder="도로명 주소와 상세 주소를 입력해 주세요" autoComplete="street-address" rows={3} /></label>
              <fieldset><legend>용량 선택</legend><div className="size-options">
                {(Object.keys(PRODUCTS) as Size[]).map((item) => <button type="button" key={item} className={size === item ? "selected" : ""} onClick={() => setSize(item)}><span>{item}</span><b>{money(PRODUCTS[item])}원</b><i>{size === item ? "✓" : ""}</i></button>)}
              </div></fieldset>
              <div className="quantity-row"><div><b>수량</b><small>필요한 포대 수를 선택해 주세요.</small></div><div className="stepper"><button type="button" aria-label="수량 줄이기" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><output>{quantity}</output><button type="button" aria-label="수량 늘리기" onClick={() => setQuantity(quantity + 1)}>＋</button></div></div>
              <div className="total-row"><span>총 주문 금액</span><strong>{money(total)}<small>원</small></strong></div>
              <section className="payment-box" aria-labelledby="payment-title">
                <div className="payment-title"><span>입금처</span><small>무통장 입금</small></div>
                <div className="payment-account">
                  <div><p id="payment-title">{PAYMENT_ACCOUNT.bank}</p><strong>{PAYMENT_ACCOUNT.number}</strong><small>예금주 · {PAYMENT_ACCOUNT.holder}</small></div>
                  <button type="button" onClick={copyAccount} aria-label="입금 계좌번호 복사">계좌 복사</button>
                </div>
                <p className="payment-note">주문자 이름과 입금자 이름을 동일하게 입력해 주세요.</p>
              </section>
              <button className="submit" type="submit" disabled={loading}>{loading ? "주문 접수 중…" : "이 내용으로 주문하기"} <span>→</span></button>
              <p className="privacy">입력하신 정보는 주문 및 배송 목적으로만 사용됩니다.</p>
            </form>
          </section>
        </>
      ) : (
        <section className="manage">
          <div className="manage-head"><div><div className="eyebrow">ORDER DESK</div><h1>주문 관리</h1><p>접수된 주문을 확인하고 서영암농협 발주용으로 정리하세요.</p></div>{adminUnlocked && <div className="manage-actions"><button onClick={copyOrders} disabled={!orders.length}>발주 내용 복사</button><button className="outline" onClick={downloadCsv} disabled={!orders.length}>CSV 내려받기</button></div>}</div>
          {!adminUnlocked ? <form className="admin-login" onSubmit={unlockOrders}><span>관리자 전용</span><h2>주문 목록을 확인하려면<br />비밀번호를 입력해 주세요.</h2><label>관리자 비밀번호<input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required autoComplete="current-password" placeholder="비밀번호 입력" /></label><button type="submit" disabled={loading}>{loading ? "확인 중…" : "주문 목록 열기"}</button><p>소비자의 개인정보 보호를 위해 주문관리 화면은 하얀술 관리자만 볼 수 있습니다.</p></form> : <>
          <div className="stats"><article><span>총 주문</span><b>{orders.length}<small>건</small></b></article><article><span>총 수량</span><b>{summary.count}<small>포</small></b></article><article><span>10kg</span><b>{summary["10kg"]}<small>포</small></b></article><article><span>20kg</span><b>{summary["20kg"]}<small>포</small></b></article><article><span>총 금액</span><b>{money(summary.amount)}<small>원</small></b></article></div>
          <div className="order-list">
            {!orders.length ? <div className="empty"><span>米</span><h2>아직 접수된 주문이 없어요</h2><p>주문하기에서 첫 주문을 등록해 주세요.</p><button onClick={() => setTab("order")}>주문 등록하기</button></div> : orders.map((order) => <article key={order.id}><div className="order-main"><span className="size-chip">{order.size}</span><div><h3>{order.name} <small>{order.phone}</small></h3><p>{order.address}</p></div></div><div className="order-meta"><span>{order.quantity}개</span><b>{money(order.total)}원</b><small>{new Date(order.createdAt).toLocaleString("ko-KR")}</small><button aria-label={`${order.name} 주문 삭제`} onClick={() => deleteOrder(order.id)}>삭제</button></div></article>)}
          </div>
          <p className="local-note">주문 내역은 Supabase에 안전하게 저장되어 여러 기기에서 확인할 수 있습니다.</p></>}
        </section>
      )}

      <footer><div><b>하얀술의 유기농 새청무</b><p>좋은 쌀 한 톨에 담긴 농부의 시간과 마음을 전합니다.</p></div><span>서영암농협 발주 · 산지직송</span></footer>
    </main>
  );
}
