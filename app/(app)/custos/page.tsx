"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getProdutos, getPedidos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Produto, Pedido } from "@/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

function cmvCor(cmv: number) {
  if (cmv <= 25) return "text-emerald-600";
  if (cmv <= 35) return "text-amber-600";
  return "text-red-500";
}

const MESES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return format(d, "yyyy-MM");
}).reverse();

export default function CustosPage() {
  const { conta } = useConta();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesSel, setMesSel] = useState(MESES[MESES.length - 1]);

  useEffect(() => {
    if (!conta) return;
    getProdutos(conta.id).then(setProdutos);
    getPedidos(conta.id).then(setPedidos);
  }, [conta]);

  const pedidosMes = pedidos.filter(p =>
    p.status !== "cancelado" &&
    p.createdAt && format(new Date(p.createdAt), "yyyy-MM") === mesSel
  );

  const faturamentoMes = pedidosMes.reduce((s, p) => s + p.totalFinal, 0);

  const custoVariavel = pedidosMes.reduce((s, p) => {
    return s + p.itens.reduce((si, item) => {
      const prod = produtos.find(pr => pr.id === item.produtoId);
      return si + (prod?.custoProduto ?? 0) * item.quantidade;
    }, 0);
  }, 0);

  const custoFixoMensal = (conta?.custosFixos ?? []).reduce((s, c) => s + (c.valor || 0), 0);
  const custoMes = custoVariavel + custoFixoMensal;
  const cmvGeral = faturamentoMes > 0 ? (custoMes / faturamentoMes) * 100 : 0;
  const margemBruta = faturamentoMes - custoMes;

  const produtosAtivos = produtos.filter(p => p.status !== "inativo");

  const catCls: Record<string, string> = {
    Confeitaria: "bg-rose-light text-rose",
    Salgado: "bg-amber-50 text-amber-700",
    Panificado: "bg-slate-100 text-slate-600",
    Kit: "bg-blue-50 text-blue-700",
    Outro: "bg-slate-100 text-slate-500",
  };

  return (
    <>
      <Topbar title="Custos & CMV" />

      <div className="p-4 md:p-6 max-w-5xl space-y-6">

        {/* Seletor de mês */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Período:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {MESES.map(m => (
              <button key={m} onClick={() => setMesSel(m)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${mesSel === m ? "bg-[#C4566A] text-white border-rose" : "bg-white text-muted border-rose-light hover:border-rose-mid"}`}>
                {format(new Date(m + "-01"), "MMM/yy", { locale: ptBR })}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs do mês */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Faturamento", value: fmt(faturamentoMes), sub: `${pedidosMes.length} pedidos`, color: "text-emerald-600" },
            { label: "Custo Total", value: fmt(custoMes), sub: "soma dos custos dos itens", color: "text-rose" },
            { label: "Margem Bruta", value: fmt(margemBruta), sub: faturamentoMes > 0 ? `${pct(100 - cmvGeral)} da receita` : "—", color: margemBruta >= 0 ? "text-dark" : "text-red-500" },
            { label: "CMV Geral", value: pct(cmvGeral), sub: cmvGeral <= 35 ? "dentro do ideal" : "acima do ideal", color: cmvCor(cmvGeral) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-rose-light/60 p-4">
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`font-heading font-semibold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Breakdown de custos */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-4">
          <h2 className="font-heading font-semibold text-dark text-sm mb-3">Composição dos Custos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted">Custo variável (produtos vendidos)</span>
              <span className="font-semibold text-dark">{fmt(custoVariavel)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted">Custos fixos mensais</span>
                {custoFixoMensal === 0 && (
                  <a href="/configuracoes" className="text-[0.65rem] text-rose hover:underline">configurar →</a>
                )}
              </div>
              <span className="font-semibold text-dark">{fmt(custoFixoMensal)}</span>
            </div>
            {(conta?.custosFixos ?? []).length > 0 && (
              <div className="pl-3 space-y-1 border-l-2 border-rose-light">
                {(conta?.custosFixos ?? []).map(c => (
                  <div key={c.id} className="flex justify-between text-xs text-muted">
                    <span>{c.nome}</span>
                    <span>{fmt(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center border-t border-rose-light/40 pt-2 font-bold text-dark">
              <span>Custo Total</span>
              <span>{fmt(custoMes)}</span>
            </div>
          </div>
        </div>

        {/* Referência CMV */}
        <div className="flex gap-3 flex-wrap text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>CMV ≤ 25% — Excelente</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>26–35% — Aceitável</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>&gt; 35% — Revisar precificação</span>
        </div>

        {/* CMV por produto */}
        <div>
          <h2 className="font-heading font-semibold text-dark text-sm mb-3">CMV por Produto</h2>
          {produtosAtivos.length === 0 ? (
            <div className="bg-white rounded-xl border border-rose-light/60 p-8 text-center text-muted text-sm">
              Nenhum produto cadastrado ainda.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-5 py-2 border-b border-rose-light/40 text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                <span>Produto</span><span>Preço Venda</span><span>Custo</span><span>Margem</span><span>CMV</span>
              </div>
              <div className="divide-y divide-rose-light/40">
                {produtosAtivos
                  .sort((a, b) => b.cmvPercent - a.cmvPercent)
                  .map(p => (
                    <div key={p.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr_120px] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-cream/50 transition">
                      <div>
                        <p className="font-semibold text-dark text-sm">{p.nome}</p>
                        <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full ${catCls[p.categoria]}`}>{p.categoria}</span>
                      </div>
                      <span className="text-sm text-dark">{fmt(p.precoVenda)}</span>
                      <span className="text-sm text-muted">{fmt(p.custoProduto)}</span>
                      <span className="text-sm font-semibold text-dark">{fmt(p.precoVenda - p.custoProduto)}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-rose-light rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${p.cmvPercent <= 25 ? "bg-emerald-500" : p.cmvPercent <= 35 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(p.cmvPercent, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-10 text-right ${cmvCor(p.cmvPercent)}`}>{pct(p.cmvPercent)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Dica */}
        <div className="bg-rose-light/40 border border-rose-light rounded-xl px-4 py-3 text-xs text-muted">
          💡 <strong className="text-dark">Dica:</strong> O CMV ideal para confeitaria artesanal fica entre 20–30%. Para melhorar, vincule <strong>Receitas</strong> com fichas técnicas detalhadas a cada produto — o custo será calculado automaticamente.
        </div>
      </div>
    </>
  );
}
