"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, authJsonHeaders, getUser, safeFetch } from "@/lib/api";

type Product = {
  id?: string;
  code?: string | null;
  barcode?: string | null;
  description?: string | null;
  name?: string | null;
  price: number;
  promoPrice: number;
  ecommerceName?: string | null;
  ecommercePrice: number;
  subcategory?: string | null;
  ecommerceCategory?: string | null;
  isActive: boolean;
  showOnIpad: boolean;
  commissionType?: string | null;
  commissionValue: number;
  integrationCode?: string | null;
  displayOrder: number;
  maxOrderQty: number;
  nextOrderTimeMinutes: number;
  prepTimeMinutes: number;
  mealHour?: string | null;
  itemType?: string | null;
  taxType?: string | null;
  taxPercent: number;
  imageUrl?: string | null;
  stock: number;
};

const emptyProduct = (): Product => ({
  code: "",
  barcode: "",
  description: "",
  name: "",
  price: 0,
  promoPrice: 0,
  ecommerceName: "",
  ecommercePrice: 0,
  subcategory: "",
  ecommerceCategory: "",
  isActive: true,
  showOnIpad: true,
  commissionType: "",
  commissionValue: 0,
  integrationCode: "",
  displayOrder: 0,
  maxOrderQty: 0,
  nextOrderTimeMinutes: 0,
  prepTimeMinutes: 0,
  mealHour: "",
  itemType: "",
  taxType: "",
  taxPercent: 0,
  imageUrl: "",
  stock: 0,
});

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductsPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState<Product>(emptyProduct());
  const [editingId, setEditingId] = useState<string | null>(null);

  const canWrite = useMemo(() => {
    const u = getUser();
    return u && ["Admin", "Supervisor"].includes(u.role);
  }, []);

  const load = async () => {
    setError("");
    try {
      const res = await safeFetch(`${API}/api/products`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      setProducts(await res.json());
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) =>
      [p.name, p.code, p.barcode, p.description, p.ecommerceName]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(s))
    );
  }, [products, q]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyProduct());
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id || null);
    setForm({
      ...emptyProduct(),
      ...p,
      price: num(p.price),
      promoPrice: num(p.promoPrice),
      ecommercePrice: num(p.ecommercePrice),
      commissionValue: num(p.commissionValue),
      displayOrder: num(p.displayOrder),
      maxOrderQty: num(p.maxOrderQty),
      nextOrderTimeMinutes: num(p.nextOrderTimeMinutes),
      prepTimeMinutes: num(p.prepTimeMinutes),
      taxPercent: num(p.taxPercent),
      stock: num(p.stock),
      isActive: Boolean(p.isActive),
      showOnIpad: Boolean(p.showOnIpad),
    });
  };

  const save = async () => {
    if (!canWrite) return;

    setError("");
    try {
      const payload: Product = {
        ...form,
        price: num(form.price),
        promoPrice: num(form.promoPrice),
        ecommercePrice: num(form.ecommercePrice),
        commissionValue: num(form.commissionValue),
        displayOrder: num(form.displayOrder),
        maxOrderQty: num(form.maxOrderQty),
        nextOrderTimeMinutes: num(form.nextOrderTimeMinutes),
        prepTimeMinutes: num(form.prepTimeMinutes),
        taxPercent: num(form.taxPercent),
        stock: num(form.stock),
      };

      const url = editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`;
      const method = editingId ? "PUT" : "POST";

      const res = await safeFetch(url, {
        method,
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      await load();
      startCreate();
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  const remove = async (id: string) => {
    if (!canWrite) return;

    setError("");
    try {
      const res = await safeFetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        headers: authHeaders(), // DELETE sin body
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      await load();
      if (editingId === id) startCreate();
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => router.push("/")}>
          Volver
        </button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* FORM */}
        <section className="bg-white rounded shadow p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? "Editar producto" : "Crear producto"}</h2>
            <button className="text-sm underline" onClick={startCreate}>
              Nuevo
            </button>
          </div>

          {!canWrite && (
            <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              Tu rol no puede crear/editar productos.
            </div>
          )}

          <div className="mt-4 space-y-4">
            <Section title="Básico">
              <Input label="Nombre" value={form.name || ""} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />
              <Input label="Descripción" value={form.description || ""} onChange={(v) => setForm((s) => ({ ...s, description: v }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Code" value={form.code || ""} onChange={(v) => setForm((s) => ({ ...s, code: v }))} />
                <Input label="Barcode" value={form.barcode || ""} onChange={(v) => setForm((s) => ({ ...s, barcode: v }))} />
              </div>
              <Input label="Image URL" value={form.imageUrl || ""} onChange={(v) => setForm((s) => ({ ...s, imageUrl: v }))} />
            </Section>

            <Section title="Precios">
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Precio" value={form.price} onChange={(v) => setForm((s) => ({ ...s, price: v }))} />
                <NumberInput label="Promo price" value={form.promoPrice} onChange={(v) => setForm((s) => ({ ...s, promoPrice: v }))} />
              </div>
              <Input label="Ecommerce name" value={form.ecommerceName || ""} onChange={(v) => setForm((s) => ({ ...s, ecommerceName: v }))} />
              <NumberInput label="Ecommerce price" value={form.ecommercePrice} onChange={(v) => setForm((s) => ({ ...s, ecommercePrice: v }))} />
            </Section>

            <Section title="Impuestos">
              <Input label="Tax type" value={form.taxType || ""} onChange={(v) => setForm((s) => ({ ...s, taxType: v }))} />
              <NumberInput label="Tax percent (%)" value={form.taxPercent} onChange={(v) => setForm((s) => ({ ...s, taxPercent: v }))} />
            </Section>

            <Section title="Inventario / Estado">
              <NumberInput label="Stock" value={form.stock} onChange={(v) => setForm((s) => ({ ...s, stock: v }))} />
              <div className="grid grid-cols-2 gap-2">
                <Toggle label="Is active" checked={form.isActive} onChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
                <Toggle label="Show on iPad" checked={form.showOnIpad} onChange={(v) => setForm((s) => ({ ...s, showOnIpad: v }))} />
              </div>
            </Section>

            <Section title="Clasificación / Orden">
              <Input label="Subcategory" value={form.subcategory || ""} onChange={(v) => setForm((s) => ({ ...s, subcategory: v }))} />
              <Input label="Ecommerce category" value={form.ecommerceCategory || ""} onChange={(v) => setForm((s) => ({ ...s, ecommerceCategory: v }))} />
              <Input label="Item type" value={form.itemType || ""} onChange={(v) => setForm((s) => ({ ...s, itemType: v }))} />
              <NumberInput label="Display order" value={form.displayOrder} onChange={(v) => setForm((s) => ({ ...s, displayOrder: v }))} />
            </Section>

            <Section title="Comisión / Integración">
              <Input label="Commission type" value={form.commissionType || ""} onChange={(v) => setForm((s) => ({ ...s, commissionType: v }))} />
              <NumberInput label="Commission value" value={form.commissionValue} onChange={(v) => setForm((s) => ({ ...s, commissionValue: v }))} />
              <Input label="Integration code" value={form.integrationCode || ""} onChange={(v) => setForm((s) => ({ ...s, integrationCode: v }))} />
            </Section>

            <Section title="Restricciones / Tiempos">
              <NumberInput label="Max order qty" value={form.maxOrderQty} onChange={(v) => setForm((s) => ({ ...s, maxOrderQty: v }))} />
              <NumberInput label="Next order time (min)" value={form.nextOrderTimeMinutes} onChange={(v) => setForm((s) => ({ ...s, nextOrderTimeMinutes: v }))} />
              <NumberInput label="Prep time (min)" value={form.prepTimeMinutes} onChange={(v) => setForm((s) => ({ ...s, prepTimeMinutes: v }))} />
              <Input label="Meal hour" value={form.mealHour || ""} onChange={(v) => setForm((s) => ({ ...s, mealHour: v }))} />
            </Section>

            <button
              className={`w-full rounded px-4 py-3 text-white font-semibold ${canWrite ? "bg-blue-600" : "bg-gray-400"}`}
              onClick={save}
              disabled={!canWrite}
            >
              {editingId ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </section>

        {/* LIST */}
        <section className="bg-white rounded shadow p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Listado</h2>
            <input
              className="border p-2 rounded w-full max-w-sm"
              placeholder="Buscar (name, code, barcode...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-600">
                    Code: {p.code || "—"} • Barcode: {p.barcode || "—"} • Precio: <b>RD$ {p.price}</b> • Tax: {p.taxPercent}%
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="bg-gray-800 text-white px-3 py-2 rounded" onClick={() => startEdit(p)}>
                    Editar
                  </button>
                  {canWrite && p.id && (
                    <button className="bg-red-600 text-white px-3 py-2 rounded" onClick={() => remove(p.id!)}>
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && <p className="text-gray-500">No hay productos.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input className="border p-2 rounded w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input
        type="number"
        className="border p-2 rounded w-full"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(num(e.target.value))}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between border rounded p-2">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
