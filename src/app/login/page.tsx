"use client";

import { useState } from "react";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // Redirige a un único dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1110] text-white">
      <div className="w-full max-w-sm bg-[#111a18] p-8 rounded-xl shadow-lg border border-[#1f332d]">

        <h1 className="text-3xl font-bold text-center mb-6 text-green-400">
          Inventario — Login
        </h1>

        <label className="block mb-2 text-green-300">Correo</label>
        <input
          className="w-full p-2 rounded bg-[#1a2421] border border-[#2c4039] mb-4 outline-none focus:border-green-400"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <label className="block mb-2 text-green-300">Contraseña</label>
        <input
          type="password"
          className="w-full p-2 rounded bg-[#1a2421] border border-[#2c4039] mb-4 outline-none focus:border-green-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-700 transition p-2 rounded font-bold"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
