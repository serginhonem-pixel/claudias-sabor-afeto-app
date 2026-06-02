"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos, savePedido } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, ShoppingBag, TrendingUp, Clock, AlertTriangle, Plus, MessageCircle } from "lucide-react";
import type { Pedido, StatusPedido } from "@/types";
import toast from "react-hot-toast";

const STATUS: Record<StatusPedido, { label: string; cls: string }> = {
  aguardando: { label: "Aguardando",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  producao:   { label: "Em Produção", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  pronto:     { label: "Pronto",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  entregue:   { label: "Entregue",    cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  cancelado:  { label: "Cancelado",   cls: "bg-red-50 text-red-500 border border-red-200" },
};

const PROX: Record<StatusPedido, StatusPedido> = {
  aguardando: "producao", producao: "pronto", pronto: "entregue", entregue: "entregue", cancelado: "cancelado",
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function DashboardPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (!conta) return;
    getPedidos(conta.id).then(setPedidos);
  }, [conta]);

  async function avancar(p: Pedido) {
    if (!conta || p.status === "entregue") return;
    await savePedido(conta.id, { ...p, status: PROX[p.status], updatedAt: new Date() }, p.id);
    toast.success(`→ ${STATUS[PROX[p.status]].label}`);
    getPedidos(conta.id).then(setPedidos);
  }

  const hoje = format(new Date(), "yyyy-MM-dd");
  const mesAtual = format(new Date(), "yyyy-MM");
  const saudacao = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const ativos    = pedidos.filter(p => p.status !== "entregue" && p.status !== "cancelado");
  const hoje_     = pedidos.filter(p => p.dataEntrega === hoje && p.status !== "cancelado" && p.status !== "entregue");
  const atrasados = pedidos.filter(p => p.dataEntrega < hoje && p.status !== "entregue" && p.status !== "cancelado");
  const prontos   = pedidos.filter(p => p.status === "pronto");
  const faturamento = pedidos
    .filter(p => p.dataEntrega?.slice(0, 7) === mesAtual && p.status !== "cancelado")
    .reduce((s, p) => s + p.totalFinal, 0);

  const recentes = ativos.slice(0, 5);

  return (
    <>
      <Topbar title="Dashboard" actions={
        <Link href="/pedidos" className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#b04d60] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Novo Pedido
        </Link>
      } />

      <div className="p-4 md:p-6 max-w-5xl space-y-5">

        {/* Saudação */}
        <div>
          <h2 className="font-heading font-bold text-dark text-xl">
            {saudacao}, {conta?.nome?.split(" ")[0] ?? "Claudia"}! 👋
          </h2>
          <p className="text-xs text-muted mt-0.5 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Alertas */}
        <div className="space-y-2">
          {atrasados.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {atrasados.length} pedido{atrasados.length > 1 ? "s" : ""} em atraso
              </p>
              <Link href="/pedidos" className="ml-auto text-xs text-red-600 font-semibold hover:underline shrink-0">Ver →</Link>
            </div>
          )}
          {prontos.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                {prontos.length} pedido{prontos.length > 1 ? "s" : ""} pronto{prontos.length > 1 ? "s" : ""} para entrega
              </p>
              <Link href="/pedidos" className="ml-auto text-xs text-emerald-600 font-semibold hover:underline shrink-0">Ver →</Link>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ShoppingBag,  label: "Pedidos Ativos",  value: ativos.length,      sub: `${hoje_.length} para hoje`,            color: "text-rose",            bg: "bg-rose-light/40" },
            { icon: TrendingUp,   label: "Faturamento Mês", value: fmt(faturamento),   sub: format(new Date(), "MMMM", { locale: ptBR }), color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Clock,        label: "Entrega Hoje",    value: hoje_.length,        sub: "pedidos para hoje",                     color: "text-caramel-DEFAULT",  bg: "bg-amber-50" },
            { icon: AlertTriangle, label: "Em Atraso",      value: atrasados.length,   sub: atrasados.length > 0 ? "atenção!" : "tudo em dia ✓", color: atrasados.length > 0 ? "text-red-500" : "text-emerald-600", bg: atrasados.length > 0 ? "bg-red-50" : "bg-emerald-50" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-rose-light/60 p-4">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={15} className={s.color} />
                </div>
                <p className="text-xs text-muted">{s.label}</p>
                <p className={`font-heading font-bold text-xl ${s.color} mt-0.5`}>{s.value}</p>
                <p className="text-[0.65rem] text-muted mt-0.5">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Entregas de hoje */}
        {hoje_.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
              <Clock size={14} className="text-amber-600" />
              <p className="font-semibold text-sm text-amber-800">Entregas de Hoje</p>
            </div>
            <div className="divide-y divide-rose-light/40">
              {hoje_.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark text-sm">{p.clienteNome}</p>
                    <p className="text-xs text-muted truncate">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                    <span className="text-sm font-bold text-dark">{fmt(p.totalFinal)}</span>
                    <div className="flex gap-1">
                      {p.status !== "entregue" && (
                        <button onClick={() => avancar(p)} className="p-1.5 rounded-lg bg-rose-light hover:bg-rose-mid/30 text-rose transition" title="Avançar">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition">
                        <MessageCircle size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos ativos */}
        <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-light/40 flex items-center justify-between">
            <p className="font-semibold text-sm text-dark">Pedidos em Aberto</p>
            <Link href="/pedidos" className="text-xs text-rose hover:underline">Ver todos →</Link>
          </div>
          {ativos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">🎂</p>
              <p className="text-muted text-sm mb-4">Nenhum pedido ativo no momento.</p>
              <Link href="/pedidos" className="inline-flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#b04d60] text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                <Plus size={12} /> Criar pedido
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-rose-light/40">
              {recentes.map(p => {
                const atrasado = p.dataEntrega < hoje;
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-cream/40 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-dark text-sm">{p.clienteNome}</p>
                        {atrasado && <span className="text-[0.55rem] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full border border-red-200">Atrasado</span>}
                      </div>
                      <p className="text-xs text-muted truncate">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</p>
                      <p className="text-[0.65rem] text-muted mt-0.5">📅 {p.dataEntrega}</p>
                      {p.personalizacao && <p className="text-[0.65rem] text-caramel-DEFAULT truncate">✏️ {p.personalizacao}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                      <p className="text-sm font-bold text-dark mt-1">{fmt(p.totalFinal)}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        {p.status !== "entregue" && (
                          <button onClick={() => avancar(p)} className="p-1 rounded-lg bg-rose-light hover:bg-rose-mid/30 text-rose transition" title="Avançar status">
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                          className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 transition">
                          <MessageCircle size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Novo Pedido",  href: "/pedidos",   emoji: "🛍️" },
            { label: "Novo Cliente", href: "/clientes",  emoji: "👤" },
            { label: "Novo Produto", href: "/produtos",  emoji: "🎂" },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-white border border-rose-light/60 hover:border-rose-mid/40 rounded-xl p-4 flex flex-col items-center gap-2 transition hover:shadow-sm text-center">
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-semibold text-muted">{a.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
