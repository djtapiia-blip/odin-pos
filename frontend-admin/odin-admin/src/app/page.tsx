"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) return void router.replace("/login");
    setUser(u);
  }, [router]);

  if (!user) return <div className="p-6">Cargando...</div>;

  const isAdmin = user.role === "Admin";
  const isSupervisor = user.role === "Supervisor";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <p className="mt-2">
        Bienvenido, <b>{user.name}</b> ({user.email}) — <b>{user.role}</b>
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {(isAdmin || isSupervisor) && (
          <>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => router.push("/products")}>
              Productos
            </button>

            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => router.push("/sales")}>
              Ventas
            </button>

            <button className="bg-amber-600 text-white px-4 py-2 rounded" onClick={() => router.push("/closeout")}>
              Cierre de caja
            </button>

            <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={() => router.push("/analytics")}>
              Gráficas
            </button>
          </>
        )}

        {isAdmin && (
          <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={() => router.push("/users")}>
            Usuarios
          </button>
        )}

        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => {
            localStorage.removeItem("user");
            router.replace("/login");
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
