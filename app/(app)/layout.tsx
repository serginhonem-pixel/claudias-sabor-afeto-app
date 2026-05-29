"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserConta } from "@/lib/firestore";
import { ContaContext } from "@/hooks/useConta";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";
import type { Conta } from "@/types";
import { ShoppingBag, LayoutDashboard, Cake, Package, Users, MoreHorizontal, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [conta, setConta] = useState<Conta | null>(null);
  const [contaLoading, setContaLoading] = useState(true);
  const [maisAberto, setMaisAberto] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!user) return;
    getUserConta(user.uid).then(c => {
      if (!c) router.replace("/onboarding");
      else setConta(c);
      setContaLoading(false);
    });
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading || contaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-rose-DEFAULT border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ContaContext.Provider value={{ conta, loading: contaLoading }}>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: "DM Sans, sans-serif", fontSize: "13px" } }} />
      <div className="flex min-h-screen bg-cream">
        <div className="hidden md:flex">
          <Sidebar onSignOut={handleSignOut} />
        </div>
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav onSignOut={handleSignOut} maisAberto={maisAberto} setMaisAberto={setMaisAberto} />
    </ContaContext.Provider>
  );
}

function BottomNav({ onSignOut, maisAberto, setMaisAberto }: { onSignOut: () => void; maisAberto: boolean; setMaisAberto: (v: boolean) => void }) {
  const pathname = usePathname();
  const principais = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/pedidos",   icon: ShoppingBag,     label: "Pedidos" },
    { href: "/produtos",  icon: Cake,            label: "Produtos" },
    { href: "/estoque",   icon: Package,         label: "Estoque" },
  ];
  const extras = [
    { href: "/receitas",  emoji: "📖", label: "Receitas" },
    { href: "/custos",    emoji: "📊", label: "Custos" },
    { href: "/clientes",  emoji: "👥", label: "Clientes" },
    { href: "/configuracoes", emoji: "⚙️", label: "Config." },
  ];

  return (
    <>
      {maisAberto && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMaisAberto(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-dark border-t border-white/10 p-3 grid grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
            {extras.map(({ href, emoji, label }) => (
              <Link key={href} href={href} onClick={() => setMaisAberto(false)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <span className="text-xl">{emoji}</span>
                <span className="text-[0.6rem] text-white/60 font-medium">{label}</span>
              </Link>
            ))}
            <button onClick={() => { setMaisAberto(false); onSignOut(); }}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 hover:bg-rose-DEFAULT/20 transition">
              <LogOut size={18} className="text-rose-mid" />
              <span className="text-[0.6rem] text-rose-mid font-medium">Sair</span>
            </button>
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark border-t border-white/10 flex">
        {principais.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition ${active ? "text-rose-mid" : "text-white/40"}`}>
              <Icon size={20} />
              <span className="text-[0.6rem] font-medium">{label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMaisAberto(!maisAberto)} className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition ${maisAberto ? "text-rose-mid" : "text-white/40"}`}>
          <MoreHorizontal size={20} />
          <span className="text-[0.6rem] font-medium">Mais</span>
        </button>
      </nav>
    </>
  );
}
