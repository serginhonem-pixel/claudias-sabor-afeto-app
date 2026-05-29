"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useConta } from "@/hooks/useConta";
import { LayoutDashboard, ShoppingBag, Cake, BookOpen, Package, TrendingUp, Users, Settings, LogOut } from "lucide-react";

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

  return (
    <aside className="w-56 bg-dark flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
      <div className="p-4 border-b border-white/[0.07] flex flex-col items-center">
        <Image src="/logo.png" alt="Claudia's Sabor e Afeto" width={140} height={60} className="object-contain brightness-0 invert opacity-90" />
        {conta?.nome && <p className="text-white/40 text-[10px] mt-2 truncate">{conta.nome}</p>}
      </div>

      <nav className="flex-1 py-3">
        {nav.map((item, i) => {
          if ("section" in item) {
            return <p key={i} className="px-5 pt-3 pb-1 text-[10px] text-white/25 uppercase tracking-widest font-semibold">{item.section}</p>;
          }
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon!;
          return (
            <Link key={item.href} href={item.href!}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-2 ${
                active ? "text-rose-mid bg-rose-DEFAULT/10 border-rose-DEFAULT" : "text-white/45 border-transparent hover:text-white/75 hover:bg-white/5"
              }`}>
              <Icon size={15} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.07] space-y-1">
        <Link href="/configuracoes" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/35 hover:text-white/70 text-[13px] transition hover:bg-white/5">
          <Settings size={14} /> Configurações
        </Link>
        <button onClick={onSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/35 hover:text-rose-mid text-[13px] transition hover:bg-white/5">
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  );
}
