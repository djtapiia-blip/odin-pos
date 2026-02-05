

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, getUser, safeFetch } from "@/lib/api";


type SaleItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
};

type Sale = {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod?: "Cash" | "Card";
  cashReceived?: number;
  change?: number;
  createdByEmail?: string;
  items: SaleItem[];
};

function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeCsv(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export default function SalesPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>(toYYYYMMDD(today));
  const [to, setTo] = useState<string>(toYYYYMMDD(today));

  const load = async (f?: string, t?: string) => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (f) params.set("from", f);
      if (t) params.set("to", t);

      const url = `${API}/api/sales${params.toString() ? `?${params}` : ""}`;

      const res = await safeFetch(url, { headers: authHeaders() });
      if (!res.ok) {
        setError("No se pudieron cargar las ventas");
        return;
      }

      const data: Sale[] = await res.json();
      setSales(data);
      setSelected(null);
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red cargando ventas");
    }
  };

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    // ✅ Solo Admin/Supervisor
    if (!["Admin", "Supervisor"].includes(u.role)) {
      router.replace("/");
      return;
    }
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRango = useMemo(() => sales.reduce((acc, s) => acc + (s.total ?? 0), 0), [sales]);

  const reportByDay = useMemo(() => {
    const map = new Map<
      string,
      { date: string; salesCount: number; itemsQty: number; total: number; cashTotal: number; cardTotal: number }
    >();

    for (const s of sales) {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const row =
        map.get(key) ??
        { date: key, salesCount: 0, itemsQty: 0, total: 0, cashTotal: 0, cardTotal: 0 };

      row.salesCount += 1;
      row.itemsQty += (s.items ?? []).reduce((a, x) => a + (x.qty ?? 0), 0);
      row.total += s.total ?? 0;

      const pm = s.paymentMethod ?? "Cash";
      if (pm === "Card") row.cardTotal += s.total ?? 0;
      else row.cashTotal += s.total ?? 0;

      map.set(key, row);
    }

    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1)); // desc
  }, [sales]);

  const exportCsv = () => {
    const lines1 = [
      ["REPORTE POR DIA", "", "", "", "", ""],
      ["Desde", from, "Hasta", to, "", ""],
      ["Fecha", "Ventas", "Items", "Total", "Total Cash", "Total Card"],
      ...reportByDay.map((r) => [r.date, r.salesCount, r.itemsQty, r.total, r.cashTotal, r.cardTotal]),
      ["", "", "", "", "", ""],
      ["TOTAL RANGO", "", "", totalRango, "", ""],
      ["", "", "", "", "", ""],
    ].map((row) => row.map(escapeCsv).join(","));

    const lines2 = [
      ["DETALLE DE VENTAS", "", "", "", "", ""],
      ["Id", "Fecha", "Cajero", "Metodo", "Total", "ItemsQty"].map(escapeCsv).join(","),
      ...sales.map((s) => {
        const itemsQty = (s.items ?? []).reduce((a, x) => a + (x.qty ?? 0), 0);
        return [
          s.id,
          new Date(s.createdAt).toLocaleString(),
          s.createdByEmail ?? "",
          s.paymentMethod ?? "",
          s.total ?? 0,
          itemsQty,
        ].map(escapeCsv).join(",");
      }),
    ];

    const csv = [...lines1, ...lines2].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_ventas_${from}_a_${to}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ventas</h1>

        <div className="flex gap-2">
          <button className="text-sm underline" onClick={() => load(from, to)}>Recargar</button>
          <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => router.push("/")}>Volver</button>
        </div>
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
        <button className="bg-emerald-600 text-white px-4 py-2 rounded" onClick={exportCsv}>Exportar CSV</button>

        <div className="ml-auto text-sm text-gray-700">Total rango: <b>RD$ {totalRango}</b></div>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      {/* (El resto del UI lo dejamos igual) */}
    </main>
  );
}
