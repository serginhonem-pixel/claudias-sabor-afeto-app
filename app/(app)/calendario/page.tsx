"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPedidos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pedido, StatusPedido } from "@/types";

const STATUS_CLS: Record<StatusPedido, string> = {
  aguardando: "bg-amber-400",
  producao:   "bg-blue-500",
  pronto:     "bg-emerald-500",
  entregue:   "bg-slate-400",
  cancelado:  "bg-red-400",
};
const STATUS_LABEL: Record<StatusPedido, string> = {
  aguardando: "Aguardando", producao: "Em Produção", pronto: "Pronto",
  entregue: "Entregue", cancelado: "Cancelado",
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function CalendarioPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mes, setMes] = useState(new Date());
  const [diaSel, setDiaSel] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!conta) return;
    getPedidos(conta.id).then(setPedidos);
  }, [conta]);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const inicio = startOfMonth(mes);
  const fim = endOfMonth(mes);
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  const offset = getDay(inicio); // domingo=0

  function pedidosDia(dia: Date) {
    const str = format(dia, "yyyy-MM-dd");
    return pedidos.filter(p => p.dataEntrega === str && p.status !== "cancelado");
  }

  const pedidosSelecionados = diaSel
    ? pedidos.filter(p => p.dataEntrega === diaSel && p.status !== "cancelado")
    : [];

  function prevMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  function nextMes() { setMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }

  const faturamentoMes = pedidos
    .filter(p => p.dataEntrega?.slice(0, 7) === format(mes, "yyyy-MM") && p.status !== "cancelado")
    .reduce((s, p) => s + p.totalFinal, 0);

  const totalMes = pedidos.filter(p => p.dataEntrega?.slice(0, 7) === format(mes, "yyyy-MM") && p.status !== "cancelado").length;

  return (
    <>
      <Topbar title="Calendário" />
      <div className="p-4 md:p-6 max-w-5xl space-y-4">

        {/* Header do mês */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-dark text-lg capitalize">
              {format(mes, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <p className="text-xs text-muted">{totalMes} entregas · {fmt(faturamentoMes)}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={prevMes} className="p-2 rounded-xl border border-rose-light hover:bg-rose-light/30 transition text-muted">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setMes(new Date())} className="px-3 py-1.5 rounded-xl border border-rose-light hover:bg-rose-light/30 text-xs font-semibold text-muted transition">
              Hoje
            </button>
            <button onClick={nextMes} className="p-2 rounded-xl border border-rose-light hover:bg-rose-light/30 transition text-muted">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
          {/* Calendário */}
          <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 border-b border-rose-light/40">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                <div key={d} className="text-center py-2 text-[0.65rem] font-semibold text-muted">{d}</div>
              ))}
            </div>
            {/* Grid de dias */}
            <div className="grid grid-cols-7">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-rose-light/20 min-h-[72px]" />
              ))}
              {dias.map(dia => {
                const str = format(dia, "yyyy-MM-dd");
                const ps = pedidosDia(dia);
                const selecionado = diaSel === str;
                const ehHoje = isToday(dia);
                return (
                  <button
                    key={str}
                    onClick={() => setDiaSel(selecionado ? null : str)}
                    className={`border-b border-r border-rose-light/20 min-h-[72px] p-1.5 text-left transition relative
                      ${selecionado ? "bg-rose-light/30 ring-2 ring-inset ring-rose-mid/40" : "hover:bg-cream/50"}
                      ${!isSameMonth(dia, mes) ? "opacity-30" : ""}
                    `}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${ehHoje ? "bg-[#C4566A] text-white" : "text-dark"}
                    `}>{format(dia, "d")}</span>
                    <div className="mt-1 space-y-0.5">
                      {ps.slice(0, 3).map(p => (
                        <div key={p.id} className={`text-[0.55rem] text-white font-medium px-1 py-0.5 rounded truncate ${STATUS_CLS[p.status]}`}>
                          {p.clienteNome.split(" ")[0]}
                        </div>
                      ))}
                      {ps.length > 3 && (
                        <div className="text-[0.55rem] text-muted font-medium px-1">+{ps.length - 3}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel lateral */}
          <div className="space-y-3">
            {/* Legenda */}
            <div className="bg-white rounded-xl border border-rose-light/60 p-3">
              <p className="text-xs font-semibold text-muted mb-2">Legenda</p>
              <div className="space-y-1.5">
                {(Object.keys(STATUS_CLS) as StatusPedido[]).filter(s => s !== "cancelado").map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${STATUS_CLS[s]}`} />
                    <span className="text-xs text-muted">{STATUS_LABEL[s]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pedidos do dia selecionado */}
            {diaSel && (
              <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-rose-light/40 bg-rose-light/20">
                  <p className="font-semibold text-dark text-sm">
                    {format(new Date(diaSel + "T12:00:00"), "d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted">{pedidosSelecionados.length} entrega{pedidosSelecionados.length !== 1 ? "s" : ""}</p>
                </div>
                {pedidosSelecionados.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">Nenhum pedido neste dia</p>
                ) : (
                  <div className="divide-y divide-rose-light/40">
                    {pedidosSelecionados.map(p => (
                      <div key={p.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-dark text-sm">{p.clienteNome}</p>
                            <p className="text-[0.65rem] text-muted truncate">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</p>
                            {p.personalizacao && <p className="text-[0.65rem] text-caramel-DEFAULT truncate">✏️ {p.personalizacao}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_CLS[p.status]} mb-1`} />
                            <p className="text-xs font-bold text-dark">{fmt(p.totalFinal)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[0.6rem] text-muted">{STATUS_LABEL[p.status]}</span>
                          <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-[0.65rem] text-emerald-600 font-semibold hover:underline">
                            WhatsApp →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Próximas entregas (se nenhum dia selecionado) */}
            {!diaSel && (
              <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-rose-light/40">
                  <p className="font-semibold text-dark text-sm">Próximas Entregas</p>
                </div>
                <div className="divide-y divide-rose-light/40 max-h-80 overflow-y-auto">
                  {pedidos
                    .filter(p => p.dataEntrega >= hoje && p.status !== "entregue" && p.status !== "cancelado")
                    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega))
                    .slice(0, 8)
                    .map(p => (
                      <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="text-center shrink-0">
                          <p className="text-[0.6rem] text-muted uppercase">{format(new Date(p.dataEntrega + "T12:00:00"), "MMM", { locale: ptBR })}</p>
                          <p className="font-bold text-dark text-lg leading-none">{format(new Date(p.dataEntrega + "T12:00:00"), "d")}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-dark text-xs">{p.clienteNome}</p>
                          <p className="text-[0.6rem] text-muted truncate">{p.itens.map(i => i.produtoNome).join(", ")}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CLS[p.status]}`} />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
