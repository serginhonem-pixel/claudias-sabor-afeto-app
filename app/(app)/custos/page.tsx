"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getProdutos, getPedidos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format, getDaysInMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Produto, Pedido } from "@/types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtShort(v: number) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1).replace(".", ",") + "k";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function pct(v: number) { return `${v.toFixed(1)}%`; }
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
  const [vistaAtiva, setVistaAtiva] = useState<"mensal" | "diaria">("mensal");

  useEffect(() => {
    if (!conta) return;
    getProdutos(conta.id).then(setProdutos);
    getPedidos(conta.id).then(setPedidos);
  }, [conta]);

  // ── Cálculos mensais ───────────────────────────────────────────────────────
  const pedidosMes = pedidos.filter(p =>
    p.status !== "cancelado" &&
    p.dataEntrega && p.dataEntrega.slice(0, 7) === mesSel
  );

  const faturamentoMes = pedidosMes.reduce((s, p) => s + p.totalFinal, 0);
  const custoVariavel = pedidosMes.reduce((s, p) =>
    s + p.itens.reduce((si, item) => {
      const prod = produtos.find(pr => pr.id === item.produtoId);
      return si + (prod?.custoProduto ?? 0) * item.quantidade;
    }, 0), 0);

  const custoFixoMensal = (conta?.custosFixos ?? []).reduce((s, c) => s + (c.valor || 0), 0);
  const custoMes = custoVariavel + custoFixoMensal;
  const cmvGeral = faturamentoMes > 0 ? (custoMes / faturamentoMes) * 100 : 0;
  const margemBruta = faturamentoMes - custoMes;

  // ── Visão diária ───────────────────────────────────────────────────────────
  const hoje = format(new Date(), "yyyy-MM-dd");
  const [anoStr, mesStr] = mesSel.split("-");
  const diasNoMes = getDaysInMonth(new Date(Number(anoStr), Number(mesStr) - 1));
  const custoFixoDia = custoFixoMensal / diasNoMes;

  const diasData = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = String(i + 1).padStart(2, "0");
    const dataStr = `${mesSel}-${dia}`;
    const isPast = dataStr <= hoje;
    const isHoje = dataStr === hoje;

    const pedidosDia = pedidosMes.filter(p => p.dataEntrega === dataStr);
    const fatDia = pedidosDia.reduce((s, p) => s + p.totalFinal, 0);
    const custVarDia = pedidosDia.reduce((s, p) =>
      s + p.itens.reduce((si, item) => {
        const prod = produtos.find(pr => pr.id === item.produtoId);
        return si + (prod?.custoProduto ?? 0) * item.quantidade;
      }, 0), 0);
    const custTotalDia = custVarDia + custoFixoDia;
    const resultadoDia = fatDia - custTotalDia;

    return { dataStr, dia: i + 1, isPast, isHoje, pedidosDia, fatDia, custVarDia, custFixoDia: custoFixoDia, custTotalDia, resultadoDia };
  });

  // Acumulado até hoje no mês selecionado
  const diasAteHoje = diasData.filter(d => d.isPast);
  const fatAcum = diasAteHoje.reduce((s, d) => s + d.fatDia, 0);
  const custoFixoAcum = diasAteHoje.length * custoFixoDia;
  const custoVarAcum = diasAteHoje.reduce((s, d) => s + d.custVarDia, 0);
  const resultadoAcum = fatAcum - custoVarAcum - custoFixoAcum;

  // Projeção: média diária de faturamento × dias restantes
  const diasComFat = diasAteHoje.filter(d => d.fatDia > 0);
  const mediaDia = diasComFat.length > 0 ? fatAcum / diasComFat.length : 0;
  const diasRestantes = diasData.filter(d => !d.isPast).length;
  const projecaoMes = fatAcum + mediaDia * diasRestantes;

  const produtosAtivos = produtos.filter(p => p.status !== "inativo");
  const catCls: Record<string, string> = {
    Confeitaria: "bg-rose-light text-rose", Salgado: "bg-amber-50 text-amber-700",
    Panificado: "bg-slate-100 text-slate-600", Kit: "bg-blue-50 text-blue-700", Outro: "bg-slate-100 text-slate-500",
  };

  return (
    <>
      <Topbar title="Custos & CMV" />
      <div className="p-4 md:p-6 max-w-5xl space-y-6">

        {/* Seletor de mês */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Período:</span>
          <select
            value={mesSel}
            onChange={e => setMesSel(e.target.value)}
            className="border border-rose-light rounded-xl px-3 py-1.5 text-sm text-dark bg-white outline-none focus:border-rose-mid transition cursor-pointer"
          >
            {MESES.map(m => (
              <option key={m} value={m}>
                {format(parseISO(m + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle vista */}
        <div className="flex bg-rose-light/30 rounded-xl p-1 w-fit gap-1">
          {(["mensal", "diaria"] as const).map(v => (
            <button key={v} onClick={() => setVistaAtiva(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${vistaAtiva === v ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"}`}>
              {v === "mensal" ? "📊 Resumo do Mês" : "📅 Dia a Dia"}
            </button>
          ))}
        </div>

        {/* ── VISTA MENSAL ──────────────────────────────────────────────────── */}
        {vistaAtiva === "mensal" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Faturamento", value: fmt(faturamentoMes), sub: `${pedidosMes.length} pedidos`, color: "text-emerald-600" },
                { label: "Custo Total", value: fmt(custoMes), sub: "variável + fixos", color: "text-rose" },
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

            <div className="bg-white rounded-xl border border-rose-light/60 p-4">
              <h2 className="font-heading font-semibold text-dark text-sm mb-3">Composição dos Custos</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Custo variável (produtos)</span>
                  <span className="font-semibold text-dark">{fmt(custoVariavel)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Custos fixos mensais</span>
                    {custoFixoMensal === 0 && <a href="/configuracoes" className="text-[0.65rem] text-rose hover:underline">configurar →</a>}
                  </div>
                  <span className="font-semibold text-dark">{fmt(custoFixoMensal)}</span>
                </div>
                {(conta?.custosFixos ?? []).length > 0 && (
                  <div className="pl-3 space-y-1 border-l-2 border-rose-light">
                    {(conta?.custosFixos ?? []).map(c => (
                      <div key={c.id} className="flex justify-between text-xs text-muted">
                        <span>{c.nome}</span><span>{fmt(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-rose-light/40 pt-2 font-bold text-dark">
                  <span>Custo Total</span><span>{fmt(custoMes)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />CMV ≤ 25% — Excelente</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />26–35% — Aceitável</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />&gt; 35% — Revisar precificação</span>
            </div>

            <div>
              <h2 className="font-heading font-semibold text-dark text-sm mb-3">CMV por Produto</h2>
              {produtosAtivos.length === 0 ? (
                <div className="bg-white rounded-xl border border-rose-light/60 p-8 text-center text-muted text-sm">Nenhum produto cadastrado ainda.</div>
              ) : (
                <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-5 py-2 border-b border-rose-light/40 text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                    <span>Produto</span><span>Preço Venda</span><span>Custo</span><span>Margem</span><span>CMV</span>
                  </div>
                  <div className="divide-y divide-rose-light/40">
                    {produtosAtivos.sort((a, b) => b.cmvPercent - a.cmvPercent).map(p => (
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
                            <div className={`h-full rounded-full ${p.cmvPercent <= 25 ? "bg-emerald-500" : p.cmvPercent <= 35 ? "bg-amber-500" : "bg-red-500"}`}
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
            <div className="bg-rose-light/40 border border-rose-light rounded-xl px-4 py-3 text-xs text-muted">
              💡 <strong className="text-dark">Dica:</strong> O CMV ideal para confeitaria artesanal fica entre 20–30%. Vincule <strong>Receitas</strong> com fichas técnicas detalhadas a cada produto.
            </div>
          </>
        )}

        {/* ── VISTA DIÁRIA ──────────────────────────────────────────────────── */}
        {vistaAtiva === "diaria" && (
          <>
            {/* Cards de acumulado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Faturado até agora", value: fmt(fatAcum), sub: `${diasAteHoje.length} dias`, color: "text-emerald-600" },
                { label: "Custo acumulado", value: fmt(custoVarAcum + custoFixoAcum), sub: `fixo: ${fmt(custoFixoAcum)}`, color: "text-rose" },
                { label: "Resultado parcial", value: fmt(resultadoAcum), sub: resultadoAcum >= 0 ? "no azul 👍" : "no vermelho ⚠️", color: resultadoAcum >= 0 ? "text-emerald-600" : "text-red-500" },
                { label: "Projeção do mês", value: fmt(projecaoMes), sub: `média ${fmt(mediaDia)}/dia`, color: "text-dark" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-rose-light/60 p-4">
                  <p className="text-xs text-muted mb-1">{s.label}</p>
                  <p className={`font-heading font-semibold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Info custo fixo diário */}
            {custoFixoMensal > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2">
                <span>📌</span>
                <span>Custo fixo rateado: <strong>{fmt(custoFixoDia)}/dia</strong> ({fmt(custoFixoMensal)}/mês ÷ {diasNoMes} dias)</span>
              </div>
            )}

            {/* Tabela dia a dia */}
            <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-rose-light/40 text-[0.6rem] font-semibold text-muted uppercase tracking-wide">
                <span>Dia</span><span>Faturamento</span><span>Custo Var.</span><span>Custo Fixo</span><span className="text-right">Resultado</span>
              </div>
              <div className="divide-y divide-rose-light/30 max-h-[480px] overflow-y-auto">
                {diasData.map(d => (
                  <div key={d.dataStr}
                    className={`grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 items-center text-xs transition
                      ${d.isHoje ? "bg-rose-light/20 font-semibold" : ""}
                      ${!d.isPast && d.fatDia === 0 ? "opacity-40" : "hover:bg-cream/40"}
                    `}>
                    <div className="text-center">
                      <p className={`font-bold text-sm ${d.isHoje ? "text-rose" : "text-dark"}`}>{d.dia}</p>
                      <p className="text-[0.55rem] text-muted">{format(parseISO(d.dataStr), "EEE", { locale: ptBR })}</p>
                    </div>
                    <div>
                      {d.fatDia > 0
                        ? <span className="text-emerald-700 font-semibold">{fmtShort(d.fatDia)}</span>
                        : <span className="text-muted/40">{d.isPast ? "—" : "previsto"}</span>
                      }
                      {d.pedidosDia.length > 0 && (
                        <p className="text-[0.55rem] text-muted">{d.pedidosDia.length} pedido{d.pedidosDia.length > 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <span className={d.custVarDia > 0 ? "text-rose" : "text-muted/40"}>
                      {d.custVarDia > 0 ? fmtShort(d.custVarDia) : "—"}
                    </span>
                    <span className="text-amber-600">{fmtShort(d.custFixoDia)}</span>
                    <div className="text-right">
                      {d.isPast || d.fatDia > 0 ? (
                        <span className={`font-semibold ${d.resultadoDia >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {fmtShort(d.resultadoDia)}
                        </span>
                      ) : (
                        <span className="text-muted/40 text-[0.6rem]">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-t-2 border-rose-light bg-cream/50 text-xs font-bold text-dark">
                <span className="text-muted text-[0.6rem] self-center">Total</span>
                <span className="text-emerald-700">{fmt(faturamentoMes)}</span>
                <span className="text-rose">{fmt(custoVariavel)}</span>
                <span className="text-amber-600">{fmt(custoFixoMensal)}</span>
                <span className={`text-right ${margemBruta >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(margemBruta)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
