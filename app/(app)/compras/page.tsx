"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos, getProdutos, getReceitas, getInsumos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { ShoppingCart, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import type { Pedido, Produto, Receita, Insumo } from "@/types";

interface NecessidadeInsumo {
  insumoId: string;
  insumoNome: string;
  unidade: string;
  necessario: number;
  emEstoque: number;
  falta: number;
  ok: boolean;
}

function fmt(v: number, unidade: string) {
  if (unidade === "g" && v >= 1000) return `${(v / 1000).toFixed(2).replace(".", ",")} kg`;
  if (unidade === "ml" && v >= 1000) return `${(v / 1000).toFixed(2).replace(".", ",")} L`;
  return `${v % 1 === 0 ? v : v.toFixed(2).replace(".", ",")} ${unidade}`;
}

export default function ComprasPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarSoFalta, setMostrarSoFalta] = useState(true);

  useEffect(() => {
    if (!conta) return;
    Promise.all([
      getPedidos(conta.id),
      getProdutos(conta.id),
      getReceitas(conta.id),
      getInsumos(conta.id),
    ]).then(([ped, prod, rec, ins]) => {
      setPedidos(ped);
      setProdutos(prod);
      setReceitas(rec);
      setInsumos(ins);
      setLoading(false);
    });
  }, [conta]);

  // Pedidos ativos (aguardando + producao)
  const pedidosAtivos = pedidos.filter(p => p.status === "aguardando" || p.status === "producao");

  // Calcula necessidade total de insumos
  const necessidades: NecessidadeInsumo[] = (() => {
    const mapa: Record<string, { nome: string; unidade: string; necessario: number }> = {};

    for (const pedido of pedidosAtivos) {
      for (const item of pedido.itens) {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (!produto?.receitaId) continue;
        const receita = receitas.find(r => r.id === produto.receitaId);
        if (!receita) continue;

        const fator = item.quantidade / receita.rendimento;
        for (const ing of receita.ingredientes) {
          if (!mapa[ing.insumoId]) {
            mapa[ing.insumoId] = { nome: ing.insumoNome, unidade: ing.unidade, necessario: 0 };
          }
          mapa[ing.insumoId].necessario += ing.quantidade * fator;
        }
      }
    }

    return Object.entries(mapa).map(([id, v]) => {
      const insumo = insumos.find(i => i.id === id);
      const emEstoque = insumo?.estoque ?? 0;
      const falta = Math.max(0, v.necessario - emEstoque);
      return {
        insumoId: id,
        insumoNome: v.nome,
        unidade: v.unidade,
        necessario: v.necessario,
        emEstoque,
        falta,
        ok: falta === 0,
      };
    }).sort((a, b) => (a.ok ? 1 : 0) - (b.ok ? 1 : 0));
  })();

  const faltando = necessidades.filter(n => !n.ok);
  const ok = necessidades.filter(n => n.ok);
  const exibir = mostrarSoFalta ? faltando : necessidades;

  if (loading) return (
    <><Topbar title="Lista de Compras" /><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-rose-light border-t-rose rounded-full animate-spin" /></div></>
  );

  return (
    <>
      <Topbar title="Lista de Compras" />
      <div className="p-4 md:p-6 max-w-3xl space-y-5">

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-rose-light/60 p-4 text-center">
            <p className="text-2xl font-bold text-dark">{pedidosAtivos.length}</p>
            <p className="text-xs text-muted mt-0.5">Pedidos ativos</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${faltando.length > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
            <p className={`text-2xl font-bold ${faltando.length > 0 ? "text-red-600" : "text-emerald-600"}`}>{faltando.length}</p>
            <p className="text-xs text-muted mt-0.5">Faltam comprar</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{ok.length}</p>
            <p className="text-xs text-muted mt-0.5">Já no estoque</p>
          </div>
        </div>

        {pedidosAtivos.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-rose-light p-12 text-center">
            <ShoppingCart size={36} className="text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm">Nenhum pedido ativo no momento.</p>
            <p className="text-xs text-muted mt-1">A lista de compras é gerada automaticamente com base nos pedidos em Aguardando e Em Produção.</p>
          </div>
        ) : necessidades.length === 0 ? (
          <div className="bg-white rounded-xl border border-rose-light/60 p-10 text-center">
            <Package size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm">Nenhum insumo calculado.</p>
            <p className="text-xs text-muted mt-1">Vincule receitas aos produtos para calcular as necessidades automaticamente.</p>
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-dark">
                {mostrarSoFalta ? `${faltando.length} insumos para comprar` : `${necessidades.length} insumos no total`}
              </p>
              <button onClick={() => setMostrarSoFalta(v => !v)}
                className="text-xs text-rose font-semibold hover:underline">
                {mostrarSoFalta ? "Ver todos" : "Ver só o que falta"}
              </button>
            </div>

            {exibir.length === 0 && mostrarSoFalta ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700 text-sm">Estoque suficiente!</p>
                <p className="text-xs text-emerald-600 mt-1">Você tem tudo que precisa para os pedidos ativos.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-2 border-b border-rose-light/40 text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                  <span>Insumo</span><span className="text-right">Necessário</span><span className="text-right">Em Estoque</span><span className="text-right">Comprar</span>
                </div>
                <div className="divide-y divide-rose-light/40">
                  {exibir.map(n => (
                    <div key={n.insumoId} className={`flex items-center justify-between gap-3 px-4 py-3 ${n.ok ? "bg-emerald-50/30" : ""}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {n.ok
                          ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          : <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="font-medium text-dark text-sm truncate">{n.insumoNome}</p>
                          <p className="text-[0.65rem] text-muted">Necessário: {fmt(n.necessario, n.unidade)} · Estoque: <span className={n.emEstoque < n.necessario ? "text-red-500 font-semibold" : "text-emerald-600"}>{fmt(n.emEstoque, n.unidade)}</span></p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${n.ok ? "text-emerald-600" : "text-red-600"}`}>
                        {n.ok ? "✓ ok" : fmt(n.falta, n.unidade)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos considerados */}
            <div className="bg-rose-light/20 border border-rose-light rounded-xl p-4">
              <p className="text-xs font-semibold text-dark mb-2">Pedidos considerados no cálculo:</p>
              <div className="space-y-1">
                {pedidosAtivos.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-muted">
                    <span>#{p.numero} — {p.clienteNome}</span>
                    <span className="text-[0.65rem]">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
