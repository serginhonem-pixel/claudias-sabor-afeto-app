"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useConta } from "@/hooks/useConta";
import { LayoutDashboard, ShoppingBag, Cake, BookOpen, Package, TrendingUp, Users, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

const nav = [
  { section: "Principal" },
  { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
  { label: "Pedidos",    href: "/pedidos",   icon: ShoppingBag },
  { section: "Cardápio" },
  { label: "Produtos",   href: "/produtos",  icon: Cake },
  { label: "Receitas",   href: "/receitas",  icon: BookOpen },
  { section: "Operação" },
  { label: "Estoque",    href: "/estoque",   icon: Package },
  { label: "Custos & CMV", href: "/custos",  icon: TrendingUp },
  { section: "Cadastros" },
  { label: "Clientes",   href: "/clientes",  icon: Users },
];

export function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();
  const { conta } = useConta();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} bg-dark flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 transition-all duration-200 relative`}>

      {/* Botão toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-dark border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className={`border-b border-white/[0.07] flex flex-col items-center ${collapsed ? "p-2 py-4" : "p-4"}`}>
        {collapsed ? (
          <div className="w-8 h-8 bg-cream rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-dark">C</span>
          </div>
        ) : (
          <>
            <div className="bg-cream rounded-xl px-3 py-2">
              <Image src="/logo.png" alt="Claudia's Sabor e Afeto" width={130} height={56} className="object-contain" />
            </div>
            {conta?.nome && <p className="text-white/40 text-[10px] mt-2 truncate">{conta.nome}</p>}
          </>
        )}
      </div>

      <nav className="flex-1 py-3">
        {nav.map((item, i) => {
          if ("section" in item) {
            if (collapsed) return null;
            return <p key={i} className="px-5 pt-3 pb-1 text-[10px] text-white/25 uppercase tracking-widest font-semibold">{item.section}</p>;
          }
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon!;
          return (
            <Link key={item.href} href={item.href!} title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 py-2.5 text-[13px] font-medium transition-all border-l-2 ${collapsed ? "px-4 justify-center" : "px-5"} ${
                active ? "text-rose-mid bg-rose-DEFAULT/10 border-rose-DEFAULT" : "text-white/45 border-transparent hover:text-white/75 hover:bg-white/5"
              }`}>
              <Icon size={15} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 border-t border-white/[0.07] space-y-1`}>
        <Link href="/configuracoes" title={collapsed ? "Configurações" : undefined}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/35 hover:text-white/70 text-[13px] transition hover:bg-white/5 ${collapsed ? "justify-center" : ""}`}>
          <Settings size={14} />
          {!collapsed && "Configurações"}
        </Link>
        <button onClick={onSignOut} title={collapsed ? "Sair" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/35 hover:text-rose-mid text-[13px] transition hover:bg-white/5 ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={14} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
