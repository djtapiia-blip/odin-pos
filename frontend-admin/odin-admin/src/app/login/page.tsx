"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Si ya hay sesión, manda al dashboard
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u?.role) router.replace("/");
    } catch {}
  }, [router]);

  const login = async () => {
    setError("");
    try {
      if (!API) {
        setError("Falta NEXT_PUBLIC_API_URL en .env.local");
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

      // Debe traer role/email
      if (!user?.role || !user?.email) {
        setError("El backend no devolvió role/email. Revisa /api/auth/login.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      router.replace("/");
    } catch {
      setError("Error de red");
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" suppressHydrationWarning>
      {/* Fondo degradado */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-orange-400" />

      {/* Ondas / shapes */}
      <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-white/15 blur-2xl" />
      <div className="absolute top-16 left-24 h-[520px] w-[520px] rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-32 -right-28 h-[520px] w-[520px] rounded-full bg-white/15 blur-2xl" />
      <div className="absolute bottom-8 right-40 h-[420px] w-[420px] rounded-full bg-white/10 blur-2xl" />

      {/* Card */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative p-10 sm:p-12">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 relative">
                <Image
                  src="/odin-logo.jpg"
                  alt="ODIN"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-2xl font-extrabold tracking-wide text-indigo-700">
                ODIN
              </div>
            </div>

            <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold text-indigo-700">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-gray-600">Inicia sesión en tu cuenta</p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-4">
              {/* Email */}
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6.5h16v11H4v-11Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m5 7.5 7 6 7-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-12 py-4 text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 11V8.5a5 5 0 0 1 10 0V11"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-12 py-4 pr-12 text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-200"
                  placeholder="Contraseña"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label="Mostrar/Ocultar contraseña"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>

              {/* Button */}
              <button
                onClick={login}
                className="w-full rounded-xl py-4 text-white font-semibold shadow-lg transition active:scale-[0.99] bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-400"
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className="w-full text-center text-indigo-700/80 hover:text-indigo-700 text-sm mt-2"
                onClick={() => alert("Luego hacemos el flujo de recuperación 👀")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          {/* “onda” inferior dentro del card */}
          <div className="h-20 bg-gradient-to-r from-indigo-100 via-fuchsia-100 to-orange-100" />
        </div>
      </div>
    </main>
  );
}
