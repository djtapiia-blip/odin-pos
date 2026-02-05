"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, authJsonHeaders, getUser, safeFetch } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Cashier";
  isActive: boolean;
};

const ROLES: User["role"][] = ["Admin", "Supervisor", "Cashier"];

export default function UsersPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("Cashier");

  const load = async () => {
    setError("");
    try {
      const res = await safeFetch(`${API}/api/admin/users`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      setUsers(await res.json());
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  const createUser = async () => {
    setError("");
    try {
      const res = await safeFetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("Cashier");
      await load();
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  const toggleActive = async (userEmail: string) => {
    setError("");
    try {
      const res = await safeFetch(`${API}/api/admin/users/${encodeURIComponent(userEmail)}/toggle`, {
        method: "PUT",
        headers: authHeaders(),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      await load();
    } catch (e: any) {
      if (e?.message === "UNAUTHORIZED") router.replace("/login");
      else if (e?.message === "FORBIDDEN") router.replace("/");
      else setError("Error de red");
    }
  };

  useEffect(() => {
    const u = getUser();
    if (!u) return void router.replace("/login");
    if (u.role !== "Admin") return void router.replace("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => router.push("/")}>
          Volver
        </button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      {/* Crear usuario */}
      <section className="mt-6 bg-white rounded shadow p-4">
        <h2 className="font-semibold">Crear usuario</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="border p-2 rounded" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <select className="border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value as any)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={createUser}>
          Crear
        </button>
      </section>

      {/* Listado */}
      <section className="mt-6 bg-white rounded shadow p-4">
        <h2 className="font-semibold">Listado</h2>

        <div className="mt-3 space-y-2">
          {users.map((u) => (
            <div key={u.email} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-gray-600">
                  {u.email} • {u.role} • Activo: <b>{String(u.isActive)}</b>
                </div>
              </div>

              <button className="bg-indigo-600 text-white px-3 py-2 rounded" onClick={() => toggleActive(u.email)}>
                Toggle Active
              </button>
            </div>
          ))}

          {users.length === 0 && <p className="text-gray-500">No hay usuarios.</p>}
        </div>
      </section>
    </main>
  );
}
