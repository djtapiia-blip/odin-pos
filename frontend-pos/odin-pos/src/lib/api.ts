// src/lib/api.ts (POS)

export function getPosUser() {
  const raw = localStorage.getItem("posUser") || localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // si estaba corrupto, lo borramos para que no rompa
    localStorage.removeItem("posUser");
    localStorage.removeItem("user");
    return null;
  }
}

// ✅ Headers para GET (sin Content-Type)
export function posHeaders(extra?: Record<string, string>) {
  const u = getPosUser();
  return {
    "X-User-Role": u?.role || "",
    "X-User-Email": u?.email || "",
    ...(extra || {}),
  };
}

// ✅ Headers para POST/PUT/DELETE con JSON
export function posJsonHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    ...posHeaders(extra),
  };
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);

  // IMPORTANTE: no intentes res.json() si no es ok
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 403) throw new Error("FORBIDDEN");

  return res;
}
