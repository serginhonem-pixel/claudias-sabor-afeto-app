"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos, getInsumos, getReceitas, getProdutos, getClientes } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Circle, ArrowRight, ChevronDown, ChevronUp, Map } from "lucide-react";
import type { Pedido } from "@/types";

const STATUS = {
  aguardando: { label: "Aguardando",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  producao:   { label: "Em Produção", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  pronto:     { label: "Pronto",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  entregue:   { label: "Entregue",    cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  cancelado:  { label: "Cancelado",   cls: "bg-red-50 text-red-500 border border-red-200" },
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

const PASSOS = [
  {
    num: 1,
    emoji: "📦",
    titulo: "Cadastre seus insumos no Estoque",
    descricao: "São os ingredientes que você compra: farinha, chocolate, manteiga, embalagens... Informe o custo por unidade de cada um.",
    href: "/estoque",
    cta: "Ir para Estoque",
    detalhe: "Cada insumo precisa ter: nome, unidade de medida (g, kg, ml…) e custo. Esses valores são usados para calcular o custo das receitas automaticamente.",
  },
  {
    num: 2,
    emoji: "📖",
    titulo: "Monte as fichas técnicas em Receitas",
    descricao: "Para cada produto que você faz, crie uma receita com os ingredientes e quantidades. O custo é calculado automaticamente.",
    href: "/receitas",
    cta: "Ir para Receitas",
    detalhe: "Exemplo: Bolo de Brigadeiro 1kg usa 200g de farinha + 100g de chocolate + 3 ovos. Com os custos do estoque, o sistema calcula quanto custa fazer esse bolo.",
  },
  {
    num: 3,
    emoji: "🎂",
    titulo: "Crie seu cardápio em Produtos",
    descricao: "Cadastre o que você vende com o preço de venda. Vincule cada produto a uma receita para o CMV ser preenchido automaticamente.",
    href: "/produtos",
    cta: "Ir para Produtos",
    detalhe: "O CMV (Custo da Mercadoria Vendida) mostra se seu preço está bom. Ideal: abaixo de 35%. Se estiver alto, você precisa aumentar o preço ou reduzir o custo.",
  },
  {
    num: 4,
    emoji: "👥",
    titulo: "Cadastre seus clientes",
    descricao: "Adicione nome, WhatsApp e informações como bairro, restrições alimentares e como encontrou você.",
    href: "/clientes",
    cta: "Ir para Clientes",
    detalhe: "Com os clientes cadastrados, ao criar um pedido basta selecionar o nome e todos os dados já estão preenchidos. O botão do WhatsApp abre a conversa direto.",
  },
  {
    num: 5,
    emoji: "🛍️",
    titulo: "Registre seus pedidos",
    descricao: "Com clientes e produtos cadastrados, criar um pedido é rápido. Acompanhe o status: Aguardando → Em Produção → Pronto → Entregue.",
    href: "/pedidos",
    cta: "Ir para Pedidos",
    detalhe: "O dashboard mostra automaticamente pedidos ativos, entregas do dia e pedidos em atraso. O faturamento do mês é calculado em tempo real com base nos pedidos.",
  },
];

export default function DashboardPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [counts, setCounts] = useState({ insumos: -1, receitas: -1, produtos: -1, clientes: -1 });
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [passoAberto, setPassoAberto] = useState<number | null>(null);

  useEffect(() => {
    if (!conta) return;
    getPedidos(conta.id).then(setPedidos);
    Promise.all([
      getInsumos(conta.id),
      getReceitas(conta.id),
      getProdutos(conta.id),
      getClientes(conta.id),
    ]).then(([ins, rec, prod, cli]) => {
      setCounts({ insumos: ins.length, receitas: rec.length, produtos: prod.length, clientes: cli.length });
    });
  }, [conta]);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const mesAtual = format(new Date(), "yyyy-MM");

  const ativos = pedidos.filter(p => p.status !== "entregue" && p.status !== "cancelado");
  const entregaHoje = pedidos.filter(p => p.dataEntrega === hoje && p.status !== "cancelado");
  const faturamentoMes = pedidos
    .filter(p => p.createdAt && format(new Date(p.createdAt), "yyyy-MM") === mesAtual && p.status !== "cancelado")
    .reduce((s, p) => s + p.totalFinal, 0);
  const atrasados = pedidos.filter(p => p.dataEntrega < hoje && p.status !== "entregue" && p.status !== "cancelado");

  const concluidos = [
    counts.insumos > 0,
    counts.receitas > 0,
    counts.produtos > 0,
    counts.clientes > 0,
    pedidos.length > 0,
  ];
  const totalConcluidos = concluidos.filter(Boolean).length;
  const tudoPronto = totalConcluidos === 5;
  const carregando = counts.insumos === -1;

  return (
    <>
      <Topbar title="Dashboard" actions={
        <>
          <button
            onClick={() => setGuiaAberto(v => !v)}
            className="flex items-center gap-1.5 border border-rose-light hover:border-rose-mid text-muted hover:text-rose-DEFAULT text-xs font-semibold px-3 py-1.5 rounded-lg transition bg-white"
            title="Primeiros passos"
          >
            <Map size={13} /> Guia
          </button>
          <Link href="/pedidos" className="flex items-center gap-1.5 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
            + Novo Pedido
          </Link>
        </>
      } />
      <div className="p-4 md:p-6 max-w-5xl space-y-5">

        {/* Alert atrasados */}
        {atrasados.length > 0 && (
          <div className="bg-rose-light border border-rose-mid/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-rose-DEFAULT text-lg">⚠️</span>
            <p className="text-sm text-rose-DEFAULT font-medium">
              {atrasados.length} pedido{atrasados.length > 1 ? "s" : ""} em atraso — verifique a aba de pedidos
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pedidos Ativos",  value: ativos.length,       sub: `${entregaHoje.length} entregam hoje`, color: "text-rose-DEFAULT" },
            { label: "Faturamento Mês", value: fmt(faturamentoMes), sub: format(new Date(), "MMMM yyyy", { locale: ptBR }), color: "text-emerald-600" },
            { label: "Entrega Hoje",    value: entregaHoje.length,  sub: "pedidos para hoje", color: "text-caramel-DEFAULT" },
            { label: "Em Atraso",       value: atrasados.length,    sub: atrasados.length > 0 ? "atenção necessária" : "tudo em dia ✓", color: atrasados.length > 0 ? "text-rose-DEFAULT" : "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-rose-light/60 p-4">
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`font-heading font-semibold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Guia de primeiros passos */}
        {!carregando && (
          <div className={`rounded-xl border overflow-hidden ${tudoPronto ? "border-emerald-200 bg-emerald-50" : "border-rose-light/60 bg-white"}`}>
            <button
              onClick={() => setGuiaAberto(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-black/[0.02] transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{tudoPronto ? "🎉" : "🗺️"}</span>
                <div className="text-left">
                  <p className="font-semibold text-dark text-sm">
                    {tudoPronto ? "App configurado com sucesso!" : "Primeiros passos — como tudo se conecta"}
                  </p>
                  <p className="text-xs text-muted">
                    {tudoPronto
                      ? "Todos os módulos estão prontos para uso."
                      : `${totalConcluidos} de 5 etapas concluídas`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!tudoPronto && (
                  <div className="hidden sm:flex gap-0.5">
                    {concluidos.map((ok, i) => (
                      <div key={i} className={`w-5 h-1.5 rounded-full ${ok ? "bg-rose-DEFAULT" : "bg-rose-light"}`} />
                    ))}
                  </div>
                )}
                {guiaAberto ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
              </div>
            </button>

            {guiaAberto && (
              <div className="border-t border-rose-light/40 divide-y divide-rose-light/40">
                {PASSOS.map((passo, i) => {
                  const ok = concluidos[i];
                  const aberto = passoAberto === passo.num;
                  const contagem = [counts.insumos, counts.receitas, counts.produtos, counts.clientes, pedidos.length][i];

                  return (
                    <div key={passo.num} className={`transition ${ok ? "bg-emerald-50/50" : "bg-white"}`}>
                      <button
                        onClick={() => setPassoAberto(aberto ? null : passo.num)}
                        className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition text-left"
                      >
                        <div className="shrink-0 mt-0.5">
                          {ok
                            ? <CheckCircle2 size={18} className="text-emerald-500" />
                            : <Circle size={18} className="text-rose-light" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{passo.emoji}</span>
                            <p className={`font-semibold text-sm ${ok ? "text-emerald-700" : "text-dark"}`}>
                              {passo.num}. {passo.titulo}
                            </p>
                            {ok && contagem >= 0 && (
                              <span className="text-[0.6rem] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                {contagem} cadastrado{contagem !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{passo.descricao}</p>
                        </div>
                        <div className="shrink-0 mt-1">
                          {aberto ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                        </div>
                      </button>

                      {aberto && (
                        <div className="px-5 pb-4 ml-9">
                          <div className="bg-rose-light/30 border border-rose-light rounded-xl p-3 mb-3">
                            <p className="text-xs text-dark leading-relaxed">💡 {passo.detalhe}</p>
                          </div>
                          <Link
                            href={passo.href}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-DEFAULT hover:underline"
                          >
                            {passo.cta} <ArrowRight size={12} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pedidos recentes */}
        <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-light/40 flex items-center justify-between">
            <p className="font-semibold text-sm text-dark">Pedidos Recentes</p>
            <Link href="/pedidos" className="text-xs text-rose-DEFAULT hover:underline">Ver todos →</Link>
          </div>
          {ativos.length === 0 ? (
            <p className="text-center text-muted text-sm py-10">
              Nenhum pedido ativo.{" "}
              <Link href="/pedidos" className="text-rose-DEFAULT hover:underline">Criar pedido</Link>
            </p>
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
