"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PosLoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("posUser") || "null");
      if (u?.role && u?.email) router.replace("/");
    } catch {}
  }, [router]);

  const login = async () => {
    setError("");
    try {
      if (!API) {
        setError("Falta NEXT_PUBLIC_API_URL en .env.local del POS");
        return;
      }

      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Credenciales incorrectas");
        return;
      }

      const user = await res.json();

      if (!user?.role || !user?.email) {
        setError("El backend no devolvió role/email");
        return;
      }

      // ✅ Guardar sesión del POS separado del admin
      localStorage.setItem("posUser", JSON.stringify(user));
      router.replace("/");
    } catch {
      setError("Error de red");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded shadow p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold">POS Login</h1>

        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

        <div className="mt-4 space-y-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={login}>
            Entrar
          </button>
        </div>
      </div>
    </main>
  );
}
