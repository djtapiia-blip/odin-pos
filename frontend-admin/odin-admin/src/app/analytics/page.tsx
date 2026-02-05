
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, getUser, safeFetch } from "@/lib/api";

type SaleItem = { productId: string; name: string; price: number; qty: number; lineTotal: number; };
type Sale = { id: string; createdAt: string; total: number; paymentMethod?: "Cash" | "Card"; items: SaleItem[]; };

function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function money(n: number) { return `RD$ ${Number(n ?? 0).toFixed(2)}`; }

export default function AnalyticsPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toYYYYMMDD(today));
  const [to, setTo] = useState(toYYYYMMDD(today));
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState("");

  const load = async (f: string, t: string) => {
    setError("");
    try {
      const params = new URLSearchParams({ from: f, to: t });
      const url = `${API}/api/sales?${params.toString()}`;

      const res = await safeFetch(url, { headers: authHeaders() });
      if (!res.ok) return setError("No se pudieron cargar las ventas");
      setSales(await res.json());
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  useEffect(() => {
    const u = getUser();
    if (!u) return void router.replace("/login");
    if (!["Admin", "Supervisor"].includes(u.role)) return void router.replace("/");
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const total = sales.reduce((a, s) => a + (s.total ?? 0), 0);
    const cash = sales.filter((s) => (s.paymentMethod ?? "Cash") === "Cash").reduce((a, s) => a + (s.total ?? 0), 0);
    const card = sales.filter((s) => (s.paymentMethod ?? "Cash") === "Card").reduce((a, s) => a + (s.total ?? 0), 0);
    return { total, cash, card, count: sales.length };
  }, [sales]);

  const byDay = useMemo(() => {
    const map = new Map<string, { date: string; total: number; count: number }>();
    for (const s of sales) {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = map.get(key) ?? { date: key, total: 0, count: 0 };
      row.total += s.total ?? 0;
      row.count += 1;
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [sales]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of sales) {
      for (const it of s.items ?? []) {
        const key = it.productId || it.name;
        const row = map.get(key) ?? { name: it.name, qty: 0, revenue: 0 };
        row.qty += it.qty ?? 0;
        row.revenue += it.lineTotal ?? 0;
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [sales]);

  const maxDayTotal = useMemo(() => Math.max(1, ...byDay.map((x) => x.total)), [byDay]);
  const maxProdRevenue = useMemo(() => Math.max(1, ...topProducts.map((x) => x.revenue)), [topProducts]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gráficas</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => router.push("/")}>Volver</button>
      </div>

      <div className="mt-4 bg-white rounded shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm text-gray-600">Desde</label>
          <input type="date" className="border p-2 rounded block" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Hasta</label>
          <input type="date" className="border p-2 rounded block" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => load(from, to)}>Aplicar</button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Ventas" value={totals.count} />
        <Kpi title="Total" value={money(totals.total)} strong />
        <Kpi title="Cash" value={money(totals.cash)} />
        <Kpi title="Card" value={money(totals.card)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold">Ventas por día</h2>
          {byDay.length === 0 ? (
            <p className="mt-3 text-gray-500">No hay datos.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {byDay.map((d) => {
                const w = Math.round((d.total / maxDayTotal) * 100);
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-600">{d.date}</div>
                    <div className="flex-1 h-3 rounded bg-gray-100 overflow-hidden">
                      <div className="h-3 bg-indigo-600" style={{ width: `${w}%` }} />
                    </div>
                    <div className="w-28 text-right text-xs font-semibold">{money(d.total)}</div>
                    <div className="w-10 text-right text-xs text-gray-500">{d.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold">Top productos (ingreso)</h2>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-gray-500">No hay datos.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topProducts.map((p) => {
                const w = Math.round((p.revenue / maxProdRevenue) * 100);
                return (
                  <div key={p.name} className="border rounded p-3">
                    <div className="flex justify-between">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm font-semibold">{money(p.revenue)}</div>
                    </div>
                    <div className="mt-2 h-3 rounded bg-gray-100 overflow-hidden">
                      <div className="h-3 bg-emerald-600" style={{ width: `${w}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">Cantidad: <b>{p.qty}</b></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({ title, value, strong }: { title: string; value: any; strong?: boolean }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-xs text-gray-600">{title}</div>
      <div className={`mt-1 ${strong ? "text-lg font-extrabold" : "text-base font-semibold"}`}>{value}</div>
    </div>
  );
}
