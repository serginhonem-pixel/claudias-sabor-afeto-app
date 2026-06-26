"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPedidoById, getConta } from "@/lib/firestore";
import type { Pedido, Conta } from "@/types";

const C = {
  bg: "#170D08",
  surface: "#231710",
  gold: "#D8B974",
  goldSoft: "rgba(216,185,116,0.35)",
  goldFaint: "rgba(216,185,116,0.14)",
  cream: "#F6EFE1",
  muted: "#A8917A",
  green: "#4ac482",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Poppins:wght@300;400;500;600&display=swap');`;
const serif = "'Cormorant Garamond', Georgia, serif";
const sans = "'Poppins', sans-serif";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Status = "aguardando" | "producao" | "pronto" | "entregue" | "cancelado";

const STEPS: { key: Status; label: string; desc: string }[] = [
  { key: "aguardando", label: "Pedido recebido",    desc: "Aguardando confirmação" },
  { key: "producao",   label: "Em produção",        desc: "Seu pedido está sendo preparado" },
  { key: "pronto",     label: "Pronto!",            desc: "Pode retirar ou aguarde a entrega" },
  { key: "entregue",   label: "Entregue",           desc: "Pedido concluído, obrigada!" },
];

function stepIndex(status: Status) {
  if (status === "cancelado") return -1;
  return STEPS.findIndex(s => s.key === status);
}

export default function PedidoStatusPage() {
  const { contaId, pedidoId } = useParams<{ contaId: string; pedidoId: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contaId || !pedidoId) return;
    Promise.all([getPedidoById(contaId, pedidoId), getConta(contaId)]).then(([p, c]) => {
      setPedido(p);
      setConta(c);
      setLoading(false);
    });
  }, [contaId, pedidoId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.goldFaint}`, borderTopColor: C.gold, animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!pedido || !conta) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{FONTS}</style>
        <p style={{ color: C.muted, fontFamily: sans, fontSize: 14 }}>Pedido não encontrado.</p>
      </div>
    );
  }

  const idx = stepIndex(pedido.status);
  const cancelado = pedido.status === "cancelado";
  const dataEntrega = new Date(pedido.dataEntrega + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, padding: "0 0 60px" }}>
      <style>{`${FONTS} @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        background: `radial-gradient(ellipse at 50% 0%, #2E1C0F 0%, ${C.bg} 75%)`,
        padding: "36px 20px 28px", textAlign: "center",
      }}>
        <div style={{ display: "inline-block", background: C.cream, borderRadius: 4, padding: "12px 22px", boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${C.goldSoft}`, marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={conta.nome} width={130} style={{ display: "block" }} />
        </div>
        <p style={{ fontFamily: sans, fontSize: 10, color: C.gold, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 300 }}>
          Acompanhamento de pedido
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: C.cream, fontStyle: "italic", margin: "10px 0 4px" }}>
          Pedido #{pedido.numero}
        </h1>
        <p style={{ color: C.muted, fontSize: 12, fontWeight: 300 }}>{pedido.clienteNome}</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 18px" }}>

        {/* Status cancelado */}
        {cancelado && (
          <div style={{ margin: "24px 0", background: "rgba(196,86,106,0.12)", border: "1px solid rgba(196,86,106,0.35)", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#C4566A", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pedido cancelado</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Entre em contato pelo WhatsApp para mais informações.</p>
          </div>
        )}

        {/* Timeline */}
        {!cancelado && (
          <div style={{ margin: "28px 0" }}>
            {STEPS.map((step, i) => {
              const done = i <= idx;
              const active = i === idx;
              return (
                <div key={step.key} style={{ display: "flex", gap: 14, marginBottom: i < STEPS.length - 1 ? 0 : 0 }}>
                  {/* Linha + bolinha */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: done ? (active ? C.gold : C.green) : "transparent",
                      border: `2px solid ${done ? (active ? C.gold : C.green) : C.goldFaint}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: active ? `0 0 16px rgba(216,185,116,0.4)` : "none",
                      transition: "all 0.3s ease",
                    }}>
                      {done && !active && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke={C.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.bg }} />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, width: 2, background: i < idx ? C.green : C.goldFaint, minHeight: 32, margin: "4px 0", borderRadius: 1, transition: "background 0.3s ease" }} />
                    )}
                  </div>
                  {/* Texto */}
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 24 : 0, paddingTop: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: done ? C.cream : C.muted, transition: "color 0.3s" }}>
                      {step.label}
                    </p>
                    {active && (
                      <p style={{ fontSize: 11.5, color: C.gold, marginTop: 2, fontWeight: 300 }}>{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Linha divisória */}
        <div style={{ height: 1, background: C.goldFaint, margin: "4px 0 24px" }} />

        {/* Detalhes */}
        <div style={{ background: C.surface, border: `1px solid ${C.goldFaint}`, borderRadius: 14, padding: "18px 18px", marginBottom: 16 }}>
          <p style={{ fontSize: 9.5, fontWeight: 600, color: C.gold, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14 }}>Detalhes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.muted }}>Entrega desejada</span>
              <span style={{ color: C.cream, fontWeight: 500, textAlign: "right", maxWidth: "55%" }}>{dataEntrega}</span>
            </div>
            {pedido.personalizacao && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Personalização</span>
                <span style={{ color: C.cream, textAlign: "right", maxWidth: "55%" }}>{pedido.personalizacao}</span>
              </div>
            )}
            {pedido.enderecoEntrega && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Endereço</span>
                <span style={{ color: C.cream, textAlign: "right", maxWidth: "60%" }}>{pedido.enderecoEntrega}</span>
              </div>
            )}
            {pedido.obs && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Observação</span>
                <span style={{ color: C.cream, textAlign: "right", maxWidth: "55%" }}>{pedido.obs}</span>
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div style={{ background: C.surface, border: `1px solid ${C.goldFaint}`, borderRadius: 14, padding: "18px 18px" }}>
          <p style={{ fontSize: 9.5, fontWeight: 600, color: C.gold, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14 }}>Itens do pedido</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pedido.itens.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, flexShrink: 0 }}>{item.quantidade}×</span>
                <span style={{ fontFamily: serif, fontSize: 16, color: C.cream, flex: 1 }}>{item.produtoNome}</span>
                <span style={{ flex: 1, borderBottom: `1px dotted ${C.goldFaint}`, minWidth: 10 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, flexShrink: 0 }}>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.goldFaint}`, marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, color: C.cream }}>Total</span>
            <span style={{ fontSize: 19, fontWeight: 600, color: C.gold }}>{fmt(pedido.totalFinal)}</span>
          </div>
        </div>

        {/* Botão WhatsApp */}
        {conta.telefone && (
          <a
            href={`https://wa.me/55${conta.telefone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 20, padding: "15px", borderRadius: 4,
              background: "none", border: `1px solid ${C.goldSoft}`,
              color: C.gold, fontFamily: sans, fontSize: 11, fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={C.gold}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.853L.073 23.927l6.22-1.632A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 01-5.003-1.368l-.359-.213-3.714.975.995-3.636-.234-.374A9.823 9.823 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
            Falar com {conta.nome}
          </a>
        )}

        <p style={{ textAlign: "center", color: C.muted, fontSize: 10, marginTop: 32, fontWeight: 300, letterSpacing: "0.06em" }}>
          Feito com afeto, um doce de cada vez.
        </p>
      </div>
    </div>
  );
}
