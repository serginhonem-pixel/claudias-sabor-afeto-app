"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createConta, saveUserConta } from "@/lib/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function CadastroPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeConta, setNomeConta] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeConta.trim()) { toast.error("Informe o nome da confeitaria"); return; }
    setLoading(true);
    try {
      const cred = await signUp(email, senha);
      const contaId = await createConta({ nome: nomeConta.trim(), telefone: telefone.trim(), ativo: true });
      await saveUserConta(cred.user.uid, contaId);
      toast.success("Conta criada!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) toast.error("E-mail já cadastrado");
      else if (msg.includes("weak-password")) toast.error("Senha deve ter ao menos 6 caracteres");
      else toast.error("Erro ao criar conta");
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
          <p className="font-heading italic text-rose-DEFAULT text-2xl">Claudia's</p>
          <p className="font-heading font-semibold text-dark text-2xl">Sabor e Afeto</p>
          <p className="text-muted text-sm mt-1">Crie sua conta grátis</p>
        </div>

        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-rose-DEFAULT" : "bg-rose-light"}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-rose-DEFAULT" : "bg-rose-light"}`} />
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleCadastro}
          className="bg-white rounded-2xl shadow-sm border border-rose-light/60 p-6 space-y-4">

          {step === 1 && (
            <>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Seus dados de acesso</p>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={input} placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} className={input} placeholder="Mínimo 6 caracteres" />
              </div>
              <button type="submit" className="w-full bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white font-semibold py-3 rounded-xl text-sm transition">
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Sua confeitaria</p>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Nome da confeitaria *</label>
                <input type="text" value={nomeConta} onChange={e => setNomeConta(e.target.value)} required className={input} placeholder="Ex: Claudia's Sabor e Afeto" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">WhatsApp</label>
                <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className={input} placeholder="(27) 99999-9999" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-rose-light text-muted py-3 rounded-xl text-sm hover:bg-rose-light/30 transition font-medium">
                  Voltar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition">
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-rose-DEFAULT font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
