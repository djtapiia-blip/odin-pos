
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, getUser, safeFetch } from "@/lib/api";

function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Closeout = {
  date: string;
  salesCount: number;
  itemsQty: number;
  total: number;
  totalCash: number;
  totalCard: number;
};

export default function CloseoutPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<string>(toYYYYMMDD(today));
  const [data, setData] = useState<Closeout | null>(null);
  const [error, setError] = useState("");

  const load = async (d: string) => {
    setError("");
    setData(null);
    try {
      const res = await safeFetch(`${API}/api/reports/closeout?date=${encodeURIComponent(d)}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      setData(await res.json());
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
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cierre de caja</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => router.push("/")}>Volver</button>
      </div>

      <div className="mt-4 bg-white rounded shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm text-gray-600">Día</label>
          <input type="date" className="border p-2 rounded block" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => load(date)}>Cargar</button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      <div className="mt-4 bg-white rounded shadow p-5">
        {!data ? (
          <p className="text-gray-500">Selecciona un día y presiona “Cargar”.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card label="Fecha" value={data.date} />
            <Card label="Ventas" value={data.salesCount} />
            <Card label="Items" value={data.itemsQty} />
            <Card label="Total" value={`RD$ ${data.total}`} strong />
            <Card label="Total Cash" value={`RD$ ${data.totalCash}`} />
            <Card label="Total Card" value={`RD$ ${data.totalCard}`} />
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
  return (
    <div className="border rounded p-4 bg-gray-50">
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`mt-1 ${strong ? "text-lg font-extrabold" : "text-base font-semibold"}`}>{value}</div>
    </div>
  );
}
