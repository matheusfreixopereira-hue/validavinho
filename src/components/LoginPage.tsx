import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { login } from "@/lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.10_0.04_350)] via-[oklch(0.15_0.06_350)] to-[oklch(0.08_0.03_350)]">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo + branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="https://iili.io/BSf2Wmv.webp"
            alt="Vinho24h"
            className="h-16 w-auto drop-shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">ValidaVinho</h1>
            <p className="mt-1 text-sm text-white/60">Aqui voce encontra o melhor para sua adega!</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="mb-5 text-center text-base font-semibold text-white/90">Acesso ao sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fqv01"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[oklch(0.70_0.15_350)] focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-[oklch(0.70_0.15_350)] focus:bg-white/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300 border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="mt-1 w-full rounded-xl bg-[oklch(0.38_0.19_350)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[oklch(0.44_0.19_350)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/25">
          Vinho24h &copy; {new Date().getFullYear()} — Sistema de Analise de Viabilidade
        </p>
      </div>
    </div>
  );
}
