export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function authHeaders(extra?: Record<string, string>) {
  const u = getUser();
  return {
    "X-User-Role": u?.role || "",
    "X-User-Email": u?.email || "",
    ...(extra || {}),
  };
}

export function authJsonHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    ...authHeaders(extra),
  };
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 403) throw new Error("FORBIDDEN");
  return res;
}

