"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Pedido } from "@/types";

const STATUS = {
  aguardando: { label: "Aguardando",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  producao:   { label: "Em Produção", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  pronto:     { label: "Pronto",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  entregue:   { label: "Entregue",    cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  cancelado:  { label: "Cancelado",   cls: "bg-red-50 text-red-500 border border-red-200" },
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function DashboardPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (!conta) return;
    getPedidos(conta.id).then(setPedidos);
  }, [conta]);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const mesAtual = format(new Date(), "yyyy-MM");

  const ativos = pedidos.filter(p => p.status !== "entregue" && p.status !== "cancelado");
  const entregaHoje = pedidos.filter(p => p.dataEntrega === hoje && p.status !== "cancelado");
  const faturamentoMes = pedidos
    .filter(p => p.createdAt && format(new Date(p.createdAt), "yyyy-MM") === mesAtual && p.status !== "cancelado")
    .reduce((s, p) => s + p.totalFinal, 0);
  const atrasados = pedidos.filter(p => p.dataEntrega < hoje && p.status !== "entregue" && p.status !== "cancelado");

  return (
    <>
      <Topbar title="Dashboard" actions={
        <Link href="/pedidos" className="flex items-center gap-1.5 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          + Novo Pedido
        </Link>
      } />
      <div className="p-4 md:p-6 max-w-5xl">

        {/* Alert atrasados */}
        {atrasados.length > 0 && (
          <div className="mb-5 bg-rose-light border border-rose-mid/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-rose-DEFAULT text-lg">⚠️</span>
            <p className="text-sm text-rose-DEFAULT font-medium">
              {atrasados.length} pedido{atrasados.length > 1 ? "s" : ""} em atraso — verifique a aba de pedidos
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pedidos Ativos",    value: ativos.length,         sub: `${entregaHoje.length} entregam hoje`, color: "text-rose-DEFAULT" },
            { label: "Faturamento Mês",   value: fmt(faturamentoMes),   sub: format(new Date(), "MMMM yyyy", { locale: ptBR }), color: "text-emerald-600" },
            { label: "Entrega Hoje",      value: entregaHoje.length,    sub: "pedidos para hoje", color: "text-caramel-DEFAULT" },
            { label: "Em Atraso",         value: atrasados.length,      sub: atrasados.length > 0 ? "atenção necessária" : "tudo em dia ✓", color: atrasados.length > 0 ? "text-rose-DEFAULT" : "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-rose-light/60 p-4">
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`font-heading font-semibold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Pedidos recentes */}
        <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-light/40 flex items-center justify-between">
            <p className="font-semibold text-sm text-dark">Pedidos Recentes</p>
            <Link href="/pedidos" className="text-xs text-rose-DEFAULT hover:underline">Ver todos →</Link>
          </div>
          {ativos.length === 0 ? (
            <p className="text-center text-muted text-sm py-10">Nenhum pedido ativo. <Link href="/pedidos" className="text-rose-DEFAULT hover:underline">Criar pedido</Link></p>
          ) : (
            <div className="divide-y divide-rose-light/40">
              {ativos.slice(0, 6).map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-dark truncate">{p.clienteNome}</p>
                    <p className="text-xs text-muted truncate">{p.itens.map(i => i.produtoNome).join(", ")}</p>
                    <p className="text-xs text-muted mt-0.5">Entrega: {p.dataEntrega}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                    <p className="text-sm font-semibold text-dark mt-1">{fmt(p.totalFinal)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
