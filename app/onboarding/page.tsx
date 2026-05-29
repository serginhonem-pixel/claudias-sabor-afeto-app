"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createConta, saveUserConta } from "@/lib/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function OnboardingPage() {
  const [nomeConta, setNomeConta] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nomeConta.trim()) { toast.error("Informe o nome"); return; }
    setLoading(true);
    try {
      const contaId = await createConta({ nome: nomeConta.trim(), telefone, ativo: true });
      await saveUserConta(user.uid, contaId);
      toast.success("Pronto!");
      router.replace("/dashboard");
    } catch { toast.error("Erro. Tente novamente."); }
    finally { setLoading(false); }
  }

  const input = "w-full border border-rose-light rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-mid transition bg-white";

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Claudia's Sabor e Afeto" width={200} height={86} className="object-contain mx-auto" />
          <p className="font-heading font-semibold text-dark text-xl mt-4">Bem-vinda!</p>
          <p className="text-muted text-sm mt-1">Vamos configurar sua confeitaria</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-rose-light/60 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Nome da confeitaria *</label>
            <input type="text" value={nomeConta} onChange={e => setNomeConta(e.target.value)} required autoFocus className={input} placeholder="Ex: Claudia's Sabor e Afeto" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">WhatsApp</label>
            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className={input} placeholder="(27) 99999-9999" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading ? "Configurando..." : "Começar →"}
          </button>
        </form>
      </div>
    </main>
  );
}
