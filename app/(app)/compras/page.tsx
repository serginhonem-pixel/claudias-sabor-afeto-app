"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos, getProdutos, getReceitas, getInsumos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { ShoppingCart, AlertTriangle, CheckCircle2, Package, Printer } from "lucide-react";
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

function fmtQtd(v: number, unidade: string) {
  if (unidade === "g" && v >= 1000) return `${(v / 1000).toFixed(2).replace(".", ",")} kg`;
  if (unidade === "ml" && v >= 1000) return `${(v / 1000).toFixed(2).replace(".", ",")} L`;
  return `${v % 1 === 0 ? v : v.toFixed(2).replace(".", ",")} ${unidade}`;
}

const CATS = ["Farinhas", "Açúcares", "Laticínios", "Ovos", "Gorduras", "Chocolates", "Frutas", "Embalagens", "Outros"];

export default function ComprasPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"automatica" | "manual">("automatica");
  const [mostrarSoFalta, setMostrarSoFalta] = useState(true);

  // Lista manual: mapa insumoId → quantidade a comprar (undefined = não selecionado)
  const [selecionados, setSelecionados] = useState<Record<string, number>>({});

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
      // Pré-selecionar insumos abaixo do mínimo
      const presel: Record<string, number> = {};
      ins.forEach(i => {
        if (i.estoqueMinimo > 0 && i.estoque <= i.estoqueMinimo) {
          presel[i.id] = Math.max(1, Math.ceil(i.estoqueMinimo - i.estoque));
        }
      });
      setSelecionados(presel);
      setLoading(false);
    });
  }, [conta]);

  // ── Aba automática ────────────────────────────────────────────────────────
  const pedidosAtivos = pedidos.filter(p => p.status === "aguardando" || p.status === "producao");

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
      return { insumoId: id, insumoNome: v.nome, unidade: v.unidade, necessario: v.necessario, emEstoque, falta, ok: falta === 0 };
    }).sort((a, b) => (a.ok ? 1 : 0) - (b.ok ? 1 : 0));
  })();

  const faltando = necessidades.filter(n => !n.ok);
  const ok = necessidades.filter(n => n.ok);
  const exibir = mostrarSoFalta ? faltando : necessidades;

  // ── Aba manual ────────────────────────────────────────────────────────────
  function toggleInsumo(id: string) {
    setSelecionados(prev => {
      if (id in prev) {
        const rest = Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id));
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  }

  function setQtd(id: string, qtd: number) {
    setSelecionados(prev => ({ ...prev, [id]: qtd }));
  }

  const itensSelecionados = insumos.filter(i => i.id in selecionados);
  const insumosPorCategoria = CATS.map(cat => ({
    cat,
    items: insumos.filter(i => i.categoria === cat),
  })).filter(g => g.items.length > 0);

  if (loading) return (
    <><Topbar title="Lista de Compras" /><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-rose-light border-t-rose rounded-full animate-spin" /></div></>
  );

  return (
    <>
      <Topbar title="Lista de Compras" />
      <div className="p-4 md:p-6 max-w-3xl space-y-5">

        {/* Abas */}
        <div className="flex gap-1 bg-rose-light/30 rounded-xl p-1">
          {([["automatica", "Por Pedidos"], ["manual", "Manual"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${aba === key ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Aba: Por Pedidos ── */}
        {aba === "automatica" && (
          <>
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
                <p className="text-xs text-muted mt-1">A lista é gerada com base nos pedidos em Aguardando e Em Produção.</p>
              </div>
            ) : necessidades.length === 0 ? (
              <div className="bg-white rounded-xl border border-rose-light/60 p-10 text-center">
                <Package size={32} className="text-muted/30 mx-auto mb-3" />
                <p className="text-muted text-sm">Nenhum insumo calculado.</p>
                <p className="text-xs text-muted mt-1">Vincule receitas aos produtos para calcular as necessidades.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-dark">
                    {mostrarSoFalta ? `${faltando.length} insumos para comprar` : `${necessidades.length} insumos no total`}
                  </p>
                  <button onClick={() => setMostrarSoFalta(v => !v)} className="text-xs text-rose font-semibold hover:underline">
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
                            {n.ok ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-medium text-dark text-sm truncate">{n.insumoNome}</p>
                              <p className="text-[0.65rem] text-muted">Necessário: {fmtQtd(n.necessario, n.unidade)} · Estoque: <span className={n.emEstoque < n.necessario ? "text-red-500 font-semibold" : "text-emerald-600"}>{fmtQtd(n.emEstoque, n.unidade)}</span></p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${n.ok ? "text-emerald-600" : "text-red-600"}`}>
                            {n.ok ? "✓ ok" : fmtQtd(n.falta, n.unidade)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-rose-light/20 border border-rose-light rounded-xl p-4">
                  <p className="text-xs font-semibold text-dark mb-2">Pedidos considerados:</p>
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
          </>
        )}

        {/* ── Aba: Manual ── */}
        {aba === "manual" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                <strong className="text-dark">{itensSelecionados.length}</strong> {itensSelecionados.length === 1 ? "item selecionado" : "itens selecionados"}
                {insumos.some(i => i.estoqueMinimo > 0 && i.estoque <= i.estoqueMinimo) && (
                  <span className="ml-2 text-amber-600 text-xs">· itens abaixo do mínimo já marcados</span>
                )}
              </p>
              <button
                onClick={() => window.print()}
                disabled={itensSelecionados.length === 0}
                className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#C4566A]/90 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                <Printer size={13} /> Imprimir lista
              </button>
            </div>

            <div className="space-y-4 no-print">
              {insumosPorCategoria.map(({ cat, items }) => (
                <div key={cat} className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
                  <p className="px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest text-muted border-b border-rose-light/40 bg-cream/30">{cat}</p>
                  <div className="divide-y divide-rose-light/30">
                    {items.map(i => {
                      const selecionado = i.id in selecionados;
                      const abaixoMinimo = i.estoqueMinimo > 0 && i.estoque <= i.estoqueMinimo;
                      return (
                        <div key={i.id} className={`flex items-center gap-3 px-4 py-2.5 transition ${selecionado ? "bg-rose-light/20" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => toggleInsumo(i.id)}
                            className="w-4 h-4 accent-[#C4566A] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selecionado ? "text-dark" : "text-muted"}`}>
                              {i.nome}
                              {abaixoMinimo && <span className="ml-1.5 text-[0.6rem] text-amber-600 font-semibold">estoque baixo</span>}
                            </p>
                            <p className="text-[0.65rem] text-muted">Estoque: {i.estoque} {i.unidade}</p>
                          </div>
                          {selecionado && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number" min="0.01" step="0.01"
                                className="w-20 border border-rose-light rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-rose-mid"
                                value={selecionados[i.id]}
                                onChange={e => setQtd(i.id, Number(e.target.value))}
                              />
                              <span className="text-xs text-muted">{i.unidade}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Área de impressão — oculta na tela, visível só ao imprimir */}
            <div id="lista-compras-print" style={{ position: "absolute", left: "-9999px", top: 0 }}>
              <div style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "600px", margin: "0 auto" }}>
                <p style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Claudia&apos;s Sabor &amp; Afeto</p>
                <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "4px" }}>Lista de Compras</h1>
                <p style={{ fontSize: "11px", color: "#888", marginBottom: "24px" }}>
                  {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #C4566A" }}>
                      <th style={{ textAlign: "left", paddingBottom: "8px", color: "#555" }}>Produto</th>
                      <th style={{ textAlign: "right", paddingBottom: "8px", color: "#555" }}>Qtd</th>
                      <th style={{ textAlign: "right", paddingBottom: "8px", color: "#555" }}>Comprado ✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensSelecionados.map((i, idx) => (
                      <tr key={i.id} style={{ borderBottom: "1px solid #f0e0e3", background: idx % 2 === 0 ? "#fff" : "#fdf8f9" }}>
                        <td style={{ padding: "8px 0" }}>{i.nome}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "600" }}>{selecionados[i.id]} {i.unidade}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#ccc" }}>______</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: "10px", color: "#aaa", marginTop: "32px", textAlign: "center" }}>
                  {itensSelecionados.length} {itensSelecionados.length === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #lista-compras-print, #lista-compras-print * { visibility: visible !important; }
          #lista-compras-print { position: fixed; top: 0; left: 0; width: 100%; background: white; }
        }
      `}</style>
    </>
  );
}
