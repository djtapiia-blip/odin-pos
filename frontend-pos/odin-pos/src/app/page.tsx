"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPosUser, posHeaders, posJsonHeaders, safeFetch } from "@/lib/api";

type Product = {
  id: string;
  name?: string | null;
  barcode?: string | null;
  code?: string | null;
  price: number;
  taxPercent?: number;
  stock?: number;
  isActive?: boolean;
};

type CartLine = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  taxPercent: number;
};

function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return `RD$ ${v.toFixed(2)}`;
}

export default function PosHomePage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // ✅ Proteger: si no hay sesión, al login
  useEffect(() => {
    const u = getPosUser();
    if (!u) router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Cargar productos (SIN JSON.parse si falla)
  const loadProducts = async () => {
    setError("");
    setLoading(true);
    try {
      if (!API) {
        setError("Falta NEXT_PUBLIC_API_URL en .env.local del POS");
        return;
      }

      const res = await safeFetch(`${API}/api/products`, {
        headers: posHeaders(),
      });

      if (!res.ok) {
        const txt = await res.text(); // 👈 evita res.json() con 401
        setError(txt || "No se pudieron cargar productos");
        return;
      }

      const data: Product[] = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") setError("No autorizado");
      else setError("Error de red cargando productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) =>
      [p.name, p.barcode, p.code].filter(Boolean).some((x) => String(x).toLowerCase().includes(s))
    );
  }, [products, q]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.price * it.qty, 0);
  }, [cart]);

  const taxTotal = useMemo(() => {
    // taxPercent viene en producto (0..100)
    return cart.reduce((acc, it) => {
      const t = (it.taxPercent ?? 0) / 100;
      return acc + it.price * it.qty * t;
    }, 0);
  }, [cart]);

  const total = useMemo(() => subtotal + taxTotal, [subtotal, taxTotal]);

  const change = useMemo(() => {
    if (paymentMethod !== "Cash") return 0;
    return Math.max(0, cashReceived - total);
  }, [paymentMethod, cashReceived, total]);

  const addToCart = (p: Product) => {
    if (!p?.id) return;

    const name = (p.name || "Producto").toString();
    const price = Number(p.price) || 0;
    const taxP = Number(p.taxPercent ?? 0) || 0;

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { productId: p.id, name, price, qty: 1, taxPercent: taxP }];
    });
  };

  const decQty = (productId: string) => {
    setCart((prev) => {
      const copy = prev.map((x) => (x.productId === productId ? { ...x, qty: x.qty - 1 } : x));
      return copy.filter((x) => x.qty > 0);
    });
  };

  const incQty = (productId: string) => {
    setCart((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, qty: x.qty + 1 } : x))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
    setPaymentMethod("Cash");
  };

  const confirmSale = async () => {
    setError("");

    if (cart.length === 0) {
      setError("Carrito vacío");
      return;
    }

    if (paymentMethod === "Cash" && cashReceived < total) {
      setError("Efectivo insuficiente");
      return;
    }

    try {
      const u = getPosUser();
      if (!u?.email) {
        router.replace("/login");
        return;
      }

      const body = {
        items: cart.map((x) => ({ productId: x.productId, qty: x.qty })),
        paymentMethod,
        cashReceived: paymentMethod === "Cash" ? cashReceived : 0,
        createdByEmail: u.email,
      };

      const res = await safeFetch(`${API}/api/sales`, {
        method: "POST",
        headers: posJsonHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(txt || "No se pudo registrar la venta");
        return;
      }

      clearCart();
      await loadProducts();
      alert("✅ Venta registrada");
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") setError("No autorizado para vender");
      else setError("Error de red registrando venta");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">POS</h1>
        <div className="flex gap-2">
          <button className="text-sm underline" onClick={loadProducts}>
            Recargar
          </button>
          <button
            className="text-sm underline"
            onClick={() => {
              localStorage.removeItem("posUser");
              localStorage.removeItem("user");
              router.replace("/login");
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {/* Productos */}
        <section className="lg:col-span-2 bg-white rounded shadow p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Productos</h2>
            <input
              className="border p-2 rounded w-full max-w-sm"
              placeholder="Buscar por nombre / barcode / code..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="mt-4 text-gray-500">Cargando...</p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  className="border rounded p-3 text-left hover:bg-gray-50"
                  onClick={() => addToCart(p)}
                >
                  <div className="font-medium truncate">{p.name || "Producto"}</div>
                  <div className="text-xs text-gray-600 truncate">
                    {p.barcode ? `Barcode: ${p.barcode}` : "—"} {p.code ? ` • Code: ${p.code}` : ""}
                  </div>
                  <div className="mt-1 font-semibold">{money(Number(p.price) || 0)}</div>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-gray-500">No hay productos.</p>}
            </div>
          )}
        </section>

        {/* Carrito */}
        <section className="bg-white rounded shadow p-4">
          <h2 className="font-semibold">Carrito</h2>

          <div className="mt-3 space-y-2 max-h-[320px] overflow-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500">Vacío</p>
            ) : (
              cart.map((it) => (
                <div key={it.productId} className="border rounded p-2">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-between">
                    <span>{money(it.price)} • Tax {it.taxPercent}%</span>
                    <span className="font-semibold">{money(it.price * it.qty)}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => decQty(it.productId)}>
                      -
                    </button>
                    <div className="min-w-[28px] text-center">{it.qty}</div>
                    <button className="px-3 py-1 border rounded" onClick={() => incQty(it.productId)}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="flex justify-between">
              <span>Impuestos</span>
              <b>{money(taxTotal)}</b>
            </div>
            <div className="flex justify-between text-base mt-1">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold">Pago</div>
            <div className="mt-2 flex gap-2">
              <button
                className={`px-4 py-2 rounded ${paymentMethod === "Cash" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setPaymentMethod("Cash")}
              >
                Efectivo
              </button>
              <button
                className={`px-4 py-2 rounded ${paymentMethod === "Card" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setPaymentMethod("Card")}
              >
                Tarjeta
              </button>
            </div>

            {paymentMethod === "Cash" && (
              <div className="mt-3">
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={Number.isFinite(cashReceived) ? cashReceived : 0}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="Efectivo recibido"
                />
                <div className="mt-2 text-sm">
                  Cambio: <b>{money(change)}</b>
                </div>
              </div>
            )}
          </div>

          <button
            className="mt-4 w-full bg-emerald-600 text-white py-3 rounded font-semibold disabled:opacity-50"
            onClick={confirmSale}
            disabled={cart.length === 0 || (paymentMethod === "Cash" && cashReceived < total)}
          >
            Confirmar Venta
          </button>

          <button className="mt-2 w-full bg-gray-200 py-3 rounded" onClick={clearCart}>
            Limpiar carrito
          </button>
        </section>
      </div>
    </main>
  );
}
