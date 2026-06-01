"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { getUserConta } from "@/lib/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signIn(email, senha);
      const conta = await getUserConta(cred.user.uid);
      router.replace(conta ? "/dashboard" : "/onboarding");
    } catch {
      toast.error("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full border border-rose-light rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-mid focus:ring-2 focus:ring-rose-light transition bg-white";

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Claudia's Sabor e Afeto" width={220} height={95} className="object-contain mx-auto" />
          <p className="text-muted text-sm mt-3">Entre na sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-rose-light/60 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={input} placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required className={input} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-rose hover:bg-rose/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-rose font-semibold hover:underline">Criar conta</Link>
        </p>
      </div>
    </main>
  );
}
