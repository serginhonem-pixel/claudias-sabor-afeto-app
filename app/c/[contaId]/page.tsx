"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getConta, getProdutos, getProximoNumeroPedido, savePedido, getClienteByWhatsapp, getPedidosByWhatsapp } from "@/lib/firestore";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, ChevronRight, X, ArrowLeft, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { Conta, Produto, Cliente, Pedido } from "@/types";

// ── Paleta "Patisserie Noir" ─────────────────────────────────────────────────
const C = {
  bg: "#170D08",          // espresso profundo
  surface: "#231710",     // card escuro
  surface2: "#2C1D13",    // card hover / inputs
  gold: "#D8B974",
  goldSoft: "rgba(216,185,116,0.35)",
  goldFaint: "rgba(216,185,116,0.14)",
  cream: "#F6EFE1",
  muted: "#A8917A",
  rose: "#C4566A",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Poppins:wght@300;400;500;600&display=swap');`;

// ── Música ambiente (caixinha de música gerada via Web Audio) ────────────────

const BEAT = 0.5;          // segundos por tempo
const LOOP_BEATS = 16;
const LOOP_DUR = BEAT * LOOP_BEATS;

// [tempo, frequência, volume] — valsa suave em C → Am → F → G
const MELODY: [number, number, number][] = [
  // C maj
  [0, 659.25, 0.5], [0.5, 783.99, 0.4], [1, 1046.5, 0.55], [2, 987.77, 0.45], [2.5, 783.99, 0.35], [3, 659.25, 0.4],
  // A min
  [4, 1046.5, 0.5], [5, 880, 0.45], [5.5, 659.25, 0.35], [6, 880, 0.4],
  // F maj
  [8, 698.46, 0.45], [8.5, 880, 0.4], [9, 1046.5, 0.5], [10, 1318.5, 0.55], [11, 1046.5, 0.4],
  // G maj
  [12, 987.77, 0.5], [12.5, 783.99, 0.35], [13, 1174.66, 0.5], [14, 987.77, 0.4], [15, 783.99, 0.35],
];
const BASS: [number, number, number][] = [
  [0, 261.63, 0.35], [4, 220, 0.35], [8, 174.61, 0.35], [12, 196, 0.35],
  [2, 392, 0.18], [6, 329.63, 0.18], [10, 440, 0.18], [14, 293.66, 0.18],
];

const music = {
  ctx: null as AudioContext | null,
  master: null as GainNode | null,
  delaySend: null as GainNode | null,
  timer: 0,
  nextLoop: 0,
  started: false,
  muted: false,

  start() {
    if (this.started || typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.13;
      master.connect(ctx.destination);

      // eco suave para som de caixinha de música
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.42;
      const feedback = ctx.createGain(); feedback.gain.value = 0.3;
      const wet = ctx.createGain(); wet.gain.value = 0.38;
      delay.connect(feedback); feedback.connect(delay);
      delay.connect(wet); wet.connect(master);
      const delaySend = ctx.createGain();
      delaySend.gain.value = 1;
      delaySend.connect(delay);

      this.ctx = ctx; this.master = master; this.delaySend = delaySend;
      this.started = true;
      this.nextLoop = ctx.currentTime + 0.15;
      const tick = () => this.scheduler();
      this.timer = window.setInterval(tick, 400);
      tick();
    } catch { /* áudio indisponível — segue sem música */ }
  },

  scheduler() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextLoop < ctx.currentTime + 1.2) {
      const t0 = this.nextLoop;
      MELODY.forEach(([b, f, v]) => this.note(t0 + b * BEAT, f, v));
      BASS.forEach(([b, f, v]) => this.note(t0 + b * BEAT, f, v, 2.2));
      this.nextLoop += LOOP_DUR;
    }
  },

  note(t: number, freq: number, vel: number, decay = 1.4) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.delaySend) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(this.master);
    g.connect(this.delaySend);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t); osc.stop(t + decay + 0.1);

    // brilho de sininho duas oitavas acima
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(vel * 0.18, t + 0.008);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.5);
    g2.connect(this.master);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 4;
    osc2.connect(g2);
    osc2.start(t); osc2.stop(t + decay);
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.13, this.ctx.currentTime, 0.15);
    }
    return this.muted;
  },
};

function SoundButton() {
  const [muted, setMuted] = useState(music.muted);
  if (!music.started) return null;
  return (
    <button
      onClick={() => setMuted(music.toggleMute())}
      aria-label={muted ? "Ativar música" : "Silenciar música"}
      style={{
        position: "fixed", right: 14, bottom: 96, zIndex: 35,
        width: 44, height: 44, borderRadius: "50%",
        background: "rgba(35,23,16,0.92)", backdropFilter: "blur(10px)",
        border: `1px solid ${C.goldSoft}`, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 2.5,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <style>{`
        @keyframes eqBar { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
      `}</style>
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        [0, 1, 2].map(i => (
          <span key={i} style={{
            width: 3, height: 14, background: C.gold, borderRadius: 2,
            transformOrigin: "bottom",
            animation: `eqBar ${0.9 + i * 0.25}s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))
      )}
    </button>
  );
}

// ── Poeira dourada ambiente ──────────────────────────────────────────────────

function GoldDust() {
  const [specks, setSpecks] = useState<{ id: number; x: number; d: number; s: number; dur: number }[]>([]);
  useEffect(() => {
    setSpecks(Array.from({ length: 16 }, (_, i) => ({
      id: i, x: Math.random() * 100, d: Math.random() * 14,
      s: Math.random() * 2 + 1.5, dur: Math.random() * 10 + 12,
    })));
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5, overflow: "hidden" }}>
      <style>{`
        @keyframes dustRise {
          0% { transform: translateY(105vh) translateX(0); opacity: 0; }
          12% { opacity: 0.55; }
          88% { opacity: 0.35; }
          100% { transform: translateY(-6vh) translateX(26px); opacity: 0; }
        }
      `}</style>
      {specks.map(p => (
        <span key={p.id} style={{
          position: "absolute", left: `${p.x}%`, bottom: 0,
          width: p.s, height: p.s, borderRadius: "50%", background: C.gold,
          boxShadow: `0 0 ${p.s * 2.5}px rgba(216,185,116,0.7)`,
          animation: `dustRise ${p.dur}s linear ${p.d}s infinite`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans = "'Poppins', sans-serif";

function InstagramIcon({ size = 13, color = "#D8B974" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function GoldOrnament({ width = 52 }: { width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center" }}>
      <div style={{ width, height: 1, background: `linear-gradient(to right, transparent, ${C.gold})` }} />
      <div style={{ width: 4, height: 4, background: C.gold, transform: "rotate(45deg)" }} />
      <div style={{ width: 6, height: 6, border: `1px solid ${C.gold}`, transform: "rotate(45deg)" }} />
      <div style={{ width: 4, height: 4, background: C.gold, transform: "rotate(45deg)" }} />
      <div style={{ width, height: 1, background: `linear-gradient(to left, transparent, ${C.gold})` }} />
    </div>
  );
}

// ── Splash Screen ────────────────────────────────────────────────────────────

function SplashCardapio({ nomeConta, onEnter }: { nomeConta: string; onEnter: () => void }) {
  const [step1, setStep1] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 26 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100 })));
    setTimeout(() => setStep1(true), 200);
  }, []);

  function enter() {
    music.start(); // gesto do usuário libera o áudio
    setLeaving(true);
    setTimeout(onEnter, 700);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: `radial-gradient(ellipse at 50% 30%, #2A1A0E 0%, ${C.bg} 65%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", fontFamily: serif,
      opacity: leaving ? 0 : 1, transition: "opacity 0.7s ease",
    }}>
      <style>{`
        ${FONTS}
        @keyframes pFloat {
          0% { opacity:0; transform: translate(0,0) scale(0); }
          35% { opacity: 0.9; transform: translate(calc(var(--tx)*0.4), calc(var(--ty)*0.4)) scale(1); }
          100% { opacity:0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
        }
        @keyframes goldGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(216,185,116,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(216,185,116,0); }
        }
      `}</style>

      {particles.map((p, i) => (
        <div key={p.id} style={{
          position: "absolute",
          width: i % 3 === 0 ? 4 : 2.5, height: i % 3 === 0 ? 4 : 2.5,
          borderRadius: i % 5 === 0 ? 0 : "50%",
          background: i % 4 === 0 ? C.cream : C.gold,
          left: `${p.x}%`, top: `${p.y}%`, opacity: 0,
          animation: step1 ? `pFloat ${900 + i * 70}ms ease ${150 + i * 50}ms forwards` : "none",
          ["--tx" as string]: `${(Math.random() - 0.5) * 80}px`,
          ["--ty" as string]: `-${Math.random() * 100 + 30}px`,
        } as React.CSSProperties} />
      ))}

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0) scale(1)" : "translateY(22px) scale(0.94)",
          transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          background: C.cream, borderRadius: 4, padding: "22px 34px",
          boxShadow: `0 12px 60px rgba(0,0,0,0.6), 0 0 0 1px ${C.goldSoft}, 0 0 0 7px ${C.bg}, 0 0 0 8px ${C.goldFaint}`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={nomeConta} width={200} style={{ display: "block" }} />
        </div>

        <div style={{ marginTop: 30, opacity: step1 ? 1 : 0, transition: "opacity 0.6s ease 0.5s" }}>
          <GoldOrnament />
        </div>

        <div style={{
          marginTop: 18, fontFamily: sans, fontSize: 10, fontWeight: 300,
          color: C.gold, letterSpacing: "0.32em", textTransform: "uppercase",
          opacity: step1 ? 1 : 0, transition: "opacity 0.5s ease 0.65s", textAlign: "center",
        }}>
          Confeitaria Artesanal
        </div>

        <button onClick={enter} style={{
          marginTop: 42, fontFamily: sans, fontSize: 10.5, fontWeight: 500,
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: C.bg, background: `linear-gradient(135deg, ${C.gold} 0%, #C9A55C 100%)`,
          border: "none", padding: "15px 48px", cursor: "pointer", borderRadius: 2,
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s",
          animation: step1 ? "goldGlow 2.6s ease-in-out 1.6s infinite" : "none",
        }}>
          Ver Cardápio
        </button>
      </div>
    </div>
  );
}

interface ItemCarrinho { produto: Produto; quantidade: number; }

const CATS = ["Confeitaria", "Salgado", "Panificado", "Kit", "Outro"] as const;

function toDirectImageUrl(url: string): string {
  const matchFile = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (matchFile) return `https://drive.google.com/thumbnail?id=${matchFile[1]}&sz=w800`;
  const matchOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (matchOpen) return `https://drive.google.com/thumbnail?id=${matchOpen[1]}&sz=w800`;
  const matchUc = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (matchUc) return `https://drive.google.com/thumbnail?id=${matchUc[1]}&sz=w800`;
  return url;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Estilos compartilhados ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", background: C.surface2, border: `1px solid ${C.goldFaint}`,
  borderRadius: 8, padding: "13px 16px", fontSize: 14, color: C.cream,
  outline: "none", fontFamily: sans, colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 500, color: C.muted,
  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7, fontFamily: sans,
};

const goldBtnStyle: React.CSSProperties = {
  width: "100%", background: `linear-gradient(135deg, ${C.gold} 0%, #C9A55C 100%)`,
  color: C.bg, border: "none", borderRadius: 4, padding: "16px",
  fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase",
  cursor: "pointer", fontFamily: sans,
};

const toasterStyle = {
  style: { background: C.surface, color: C.cream, border: `1px solid ${C.goldFaint}` },
};

export default function PedidoClientePage() {
  const { contaId } = useParams<{ contaId: string }>();
  const [conta, setConta] = useState<Conta | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [identificacao, setIdentificacao] = useState<"entrada" | "buscando" | "encontrado" | "nao_encontrado" | "pulado">("entrada");
  const [wppInput, setWppInput] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [pedidosAnteriores, setPedidosAnteriores] = useState<Pedido[]>([]);
  const [step, setStep] = useState<"menu" | "dados" | "confirmado">("menu");
  const [enviando, setEnviando] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [catAtiva, setCatAtiva] = useState<string>("todas");
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [personalizacao, setPersonalizacao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numEnd, setNumEnd] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");

  useEffect(() => {
    if (!contaId) return;
    Promise.all([getConta(contaId), getProdutos(contaId)]).then(([c, ps]) => {
      setConta(c);
      setProdutos(ps.filter(p => p.status === "ativo" || p.status === "encomenda"));
      setLoading(false);
    });
  }, [contaId]);

  async function buscarCliente() {
    if (!wppInput.trim() || !contaId) return;
    setIdentificacao("buscando");
    const cliente = await getClienteByWhatsapp(contaId, wppInput.trim());
    if (cliente) {
      const pedidos = await getPedidosByWhatsapp(contaId, wppInput.trim());
      setClienteEncontrado(cliente);
      setPedidosAnteriores(pedidos);
      setNome(cliente.nome);
      setWhatsapp(cliente.whatsapp || wppInput.trim());
      setEndereco(cliente.endereco ?? "");
      setNumEnd(cliente.numero ?? "");
      setComplemento(cliente.complemento ?? "");
      setBairro(cliente.bairro ?? "");
      setCidade(cliente.cidade ?? "");
      setIdentificacao("encontrado");
    } else {
      setIdentificacao("nao_encontrado");
    }
  }

  function pularIdentificacao() { setIdentificacao("pulado"); }

  function addItem(produto: Produto) {
    setCarrinho(prev => {
      const ex = prev.find(i => i.produto.id === produto.id);
      if (ex) return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  function removeItem(produtoId: string) {
    setCarrinho(prev => {
      const ex = prev.find(i => i.produto.id === produtoId);
      if (!ex) return prev;
      if (ex.quantidade === 1) return prev.filter(i => i.produto.id !== produtoId);
      return prev.map(i => i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  }

  function qtd(produtoId: string) {
    return carrinho.find(i => i.produto.id === produtoId)?.quantidade ?? 0;
  }

  const total = carrinho.reduce((s, i) => s + i.produto.precoVenda * i.quantidade, 0);
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const catsComProdutos = CATS.filter(c => produtos.some(p => p.categoria === c));

  function scrollToCategoria(cat: string) {
    setCatAtiva(cat);
    catRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleConfirmar() {
    if (!nome.trim()) { toast.error("Informe seu nome"); return; }
    if (!whatsapp.trim()) { toast.error("Informe seu WhatsApp"); return; }
    if (!dataEntrega) { toast.error("Informe a data de entrega desejada"); return; }
    if (carrinho.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    setEnviando(true);
    try {
      const numero = await getProximoNumeroPedido(contaId);
      const itens = carrinho.map(i => ({
        produtoId: i.produto.id,
        produtoNome: i.produto.nome,
        quantidade: i.quantidade,
        precoUnit: i.produto.precoVenda,
        subtotal: i.produto.precoVenda * i.quantidade,
      }));
      const enderecoEntrega = [endereco.trim(), numEnd.trim(), complemento.trim(), bairro.trim(), cidade.trim()].filter(Boolean).join(", ");
      await savePedido(contaId, {
        numero,
        clienteId: "",
        clienteNome: nome.trim(),
        clienteWhatsapp: whatsapp.trim(),
        itens,
        total,
        desconto: 0,
        totalFinal: total,
        formaPagamento: "a_definir",
        dataEntrega,
        status: "aguardando",
        obs: obs.trim(),
        personalizacao: personalizacao.trim(),
        enderecoEntrega: enderecoEntrega || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      fetch("/api/notificar-pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId, numero,
          clienteNome: nome.trim(),
          clienteWhatsapp: whatsapp.trim(),
          dataEntrega,
          itens: carrinho.map(i => ({
            quantidade: i.quantidade,
            produtoNome: i.produto.nome,
            subtotal: i.produto.precoVenda * i.quantidade,
          })),
          total,
          obs: obs.trim(),
          personalizacao: personalizacao.trim(),
        }),
      }).catch(e => console.error("Erro ao notificar:", e));

      const enderecoCompleto = [endereco.trim(), numEnd.trim(), complemento.trim(), bairro.trim(), cidade.trim()].filter(Boolean).join(", ");
      const itensTexto = carrinho.map(i => `• ${i.quantidade}x ${i.produto.nome} — ${fmt(i.produto.precoVenda * i.quantidade)}`).join("\n");
      const msg = [
        `🎂 *Novo Pedido #${numero} — ${conta?.nome}*`, ``,
        `👤 *Cliente:* ${nome.trim()}`,
        `📱 *WhatsApp:* ${whatsapp.trim()}`,
        enderecoCompleto ? `📍 *Endereço:* ${enderecoCompleto}` : "",
        `📅 *Entrega desejada:* ${new Date(dataEntrega + "T12:00:00").toLocaleDateString("pt-BR")}`, ``,
        `*Itens:*`, itensTexto, ``,
        `💰 *Total: ${fmt(total)}*`,
        personalizacao.trim() ? `✏️ *Personalização:* ${personalizacao.trim()}` : "",
        obs.trim() ? `📝 *Obs:* ${obs.trim()}` : "",
      ].filter(Boolean).join("\n");

      const telefone = conta?.telefone?.replace(/\D/g, "") ?? "";
      if (telefone) window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, "_blank");

      setStep("confirmado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            border: `1.5px solid ${C.goldFaint}`, borderTopColor: C.gold,
            animation: "spin 0.9s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: C.gold, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: sans, fontWeight: 300 }}>
            Carregando
          </p>
        </div>
      </div>
    );
  }

  // ── Splash ──────────────────────────────────────────────────────────────────
  if (showSplash && conta) {
    return <SplashCardapio nomeConta={conta.nome} onEnter={() => setShowSplash(false)} />;
  }

  // ── Identificação ────────────────────────────────────────────────────────────
  if (!showSplash && identificacao !== "pulado" && identificacao !== "encontrado") {
    const buscando = identificacao === "buscando";
    const naoEncontrado = identificacao === "nao_encontrado";
    return (
      <div style={{
        minHeight: "100vh", background: `radial-gradient(ellipse at 50% 20%, #2A1A0E 0%, ${C.bg} 70%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: sans,
      }}>
        <style>{FONTS}</style>
        <Toaster position="top-center" toastOptions={toasterStyle} />
        <SoundButton />

        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <div style={{
              display: "inline-block", background: C.cream, borderRadius: 4,
              padding: "14px 24px", marginBottom: 30,
              boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${C.goldSoft}`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={conta?.nome} width={150} style={{ display: "block" }} />
            </div>

            <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, color: C.cream, marginBottom: 6, fontStyle: "italic" }}>
              Bem-vindo(a)
            </h2>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, fontWeight: 300 }}>
              Informe seu WhatsApp para carregarmos<br />seus dados automaticamente
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="tel"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.08em", fontSize: 16, padding: "16px" }}
              placeholder="(27) 99999-9999"
              value={wppInput}
              onChange={e => { setWppInput(e.target.value); if (naoEncontrado) setIdentificacao("entrada"); }}
              onKeyDown={e => e.key === "Enter" && buscarCliente()}
              disabled={buscando}
            />

            {naoEncontrado && (
              <div style={{
                background: "rgba(216,185,116,0.08)", border: `1px solid ${C.goldSoft}`,
                borderRadius: 8, padding: "12px 16px", textAlign: "center",
              }}>
                <p style={{ fontSize: 13, color: C.gold, fontWeight: 400 }}>Número não encontrado.</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Continue para fazer seu pedido normalmente.</p>
              </div>
            )}

            <button
              onClick={naoEncontrado ? pularIdentificacao : buscarCliente}
              disabled={buscando || (!naoEncontrado && !wppInput.trim())}
              style={{
                ...goldBtnStyle,
                opacity: buscando || (!naoEncontrado && !wppInput.trim()) ? 0.45 : 1,
              }}
            >
              {buscando ? "Buscando..." : naoEncontrado ? "Continuar assim mesmo" : "Continuar"}
            </button>

            <button onClick={pularIdentificacao} style={{
              background: "none", border: "none", color: C.muted, fontSize: 12,
              padding: "10px", cursor: "pointer", fontFamily: sans, fontWeight: 300,
              letterSpacing: "0.06em",
            }}>
              Pular identificação
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cliente encontrado ───────────────────────────────────────────────────────
  if (identificacao === "encontrado" && clienteEncontrado) {
    return (
      <div style={{
        minHeight: "100vh", background: `radial-gradient(ellipse at 50% 20%, #2A1A0E 0%, ${C.bg} 70%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: sans,
      }}>
        <style>{FONTS}</style>
        <Toaster position="top-center" toastOptions={toasterStyle} />
        <SoundButton />
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{
              display: "inline-block", background: C.cream, borderRadius: 4,
              padding: "12px 20px", marginBottom: 26,
              boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${C.goldSoft}`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={conta?.nome} width={130} style={{ display: "block" }} />
            </div>

            <GoldOrnament width={40} />

            <h2 style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: C.cream, marginTop: 18, fontStyle: "italic" }}>
              Olá, {clienteEncontrado.nome.split(" ")[0]}
            </h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4, fontWeight: 300 }}>Que bom te ver por aqui novamente</p>
          </div>

          {pedidosAnteriores.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: 9.5, fontWeight: 500, color: C.gold, textTransform: "uppercase",
                letterSpacing: "0.25em", marginBottom: 12, textAlign: "center",
              }}>
                Seus últimos pedidos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pedidosAnteriores.map(p => (
                  <div key={p.id} style={{
                    background: C.surface, border: `1px solid ${C.goldFaint}`,
                    borderRadius: 10, padding: "12px 16px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: C.cream }}>Pedido #{p.numero}</p>
                        <p style={{ fontSize: 10.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                          {p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.gold }}>{fmt(p.totalFinal)}</p>
                        <p style={{ fontSize: 9.5, color: C.muted, marginTop: 2 }}>
                          {new Date(p.dataEntrega + "T12:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setIdentificacao("pulado")} style={goldBtnStyle}>
            Ver Cardápio
          </button>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!conta) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <style>{FONTS}</style>
        <p style={{ color: C.muted, fontFamily: sans, fontSize: 14 }}>Confeitaria não encontrada.</p>
      </div>
    );
  }

  // ── Confirmado ───────────────────────────────────────────────────────────────
  if (step === "confirmado") {
    return (
      <div style={{
        minHeight: "100vh", background: `radial-gradient(ellipse at 50% 25%, #2A1A0E 0%, ${C.bg} 70%)`,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: sans,
      }}>
        <style>{FONTS}</style>
        <Toaster position="top-center" toastOptions={toasterStyle} />
        <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
          <div style={{
            width: 84, height: 84, margin: "0 auto 26px", borderRadius: "50%",
            border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 50px rgba(216,185,116,0.25)`,
          }}>
            <Check size={36} color={C.gold} strokeWidth={1.5} />
          </div>

          <GoldOrnament width={40} />

          <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, color: C.cream, margin: "20px 0 10px", fontStyle: "italic" }}>
            Pedido enviado
          </h1>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 36, fontWeight: 300 }}>
            Seu pedido foi registrado. O WhatsApp da <strong style={{ color: C.cream, fontWeight: 500 }}>{conta.nome}</strong> foi
            aberto com todos os detalhes — confirme por lá para garantir sua encomenda.
          </p>
          <button
            onClick={() => {
              setStep("menu"); setCarrinho([]); setNome(""); setWhatsapp("");
              setObs(""); setPersonalizacao(""); setDataEntrega("");
              setEndereco(""); setNumEnd(""); setComplemento(""); setBairro(""); setCidade("");
            }}
            style={goldBtnStyle}
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  // ── Dados / Formulário ───────────────────────────────────────────────────────
  if (step === "dados") {
    const sectionTitle = (txt: string) => (
      <p style={{
        fontSize: 9.5, fontWeight: 500, color: C.gold, textTransform: "uppercase",
        letterSpacing: "0.25em", marginBottom: 12,
      }}>
        {txt}
      </p>
    );
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <style>{FONTS}</style>
        <Toaster position="top-center" toastOptions={toasterStyle} />
        <SoundButton />

        {/* Header */}
        <div style={{
          background: "rgba(23,13,8,0.92)", backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.goldFaint}`, padding: "16px 18px",
          display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 10,
        }}>
          <button onClick={() => setStep("menu")} style={{
            width: 36, height: 36, borderRadius: "50%", background: "none",
            border: `1px solid ${C.goldSoft}`, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
          }}>
            <ArrowLeft size={15} color={C.gold} />
          </button>
          <div>
            <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, color: C.cream, fontStyle: "italic" }}>Finalizar pedido</h2>
            <p style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{totalItens} {totalItens === 1 ? "item" : "itens"} · {fmt(total)}</p>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 18px 140px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Suas informações */}
          <div>
            {sectionTitle("Suas informações")}
            <div style={{ background: C.surface, border: `1px solid ${C.goldFaint}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado(a)?" />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp *</label>
                <input type="tel" style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(27) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Entrega */}
          <div>
            {sectionTitle("Entrega")}
            <div style={{ background: C.surface, border: `1px solid ${C.goldFaint}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Data desejada *</label>
                <input type="date" style={inputStyle} value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <label style={labelStyle}>Personalização</label>
                <input style={inputStyle} value={personalizacao} onChange={e => setPersonalizacao(e.target.value)} placeholder="Ex: Feliz Aniversário Maria!" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            {sectionTitle("Endereço de entrega — opcional")}
            <div style={{ background: C.surface, border: `1px solid ${C.goldFaint}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
                <input style={inputStyle} value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua / Avenida" />
                <input style={inputStyle} value={numEnd} onChange={e => setNumEnd(e.target.value)} placeholder="Nº" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Complemento" />
                <input style={inputStyle} value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
              </div>
              <input style={inputStyle} value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          {/* Observações */}
          <div>
            {sectionTitle("Observações — opcional")}
            <textarea
              style={{ ...inputStyle, resize: "none", height: 80 }}
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Alguma observação para o pedido..."
            />
          </div>

          {/* Resumo */}
          <div>
            {sectionTitle("Resumo do pedido")}
            <div style={{ background: C.surface, border: `1px solid ${C.goldSoft}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {carrinho.map(i => (
                  <div key={i.produto.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, flexShrink: 0 }}>{i.quantidade}×</span>
                    <span style={{ fontFamily: serif, fontSize: 16, color: C.cream, flexShrink: 0 }}>{i.produto.nome}</span>
                    <span style={{ flex: 1, borderBottom: `1px dotted ${C.goldSoft}`, margin: "0 4px", minWidth: 10 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, flexShrink: 0 }}>{fmt(i.produto.precoVenda * i.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div style={{
                borderTop: `1px solid ${C.goldFaint}`, marginTop: 16, paddingTop: 14,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: serif, fontSize: 19, color: C.cream, fontStyle: "italic" }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: C.gold }}>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: 16,
          background: "rgba(23,13,8,0.95)", backdropFilter: "blur(12px)",
          borderTop: `1px solid ${C.goldFaint}`,
        }}>
          <button onClick={handleConfirmar} disabled={enviando}
            style={{ ...goldBtnStyle, maxWidth: 520, margin: "0 auto", display: "block", opacity: enviando ? 0.6 : 1 }}>
            {enviando ? "Enviando..." : "Confirmar e abrir WhatsApp"}
          </button>
        </div>
      </div>
    );
  }

  // ── MENU ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
      <style>{`
        ${FONTS}
        .cat-tab { transition: color 0.25s ease, border-color 0.25s ease; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .prod-img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
        .prod-card:hover .prod-img { transform: scale(1.045); }
      `}</style>
      <Toaster position="top-center" toastOptions={toasterStyle} />
      <GoldDust />
      <SoundButton />

      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden", textAlign: "center",
        padding: "44px 20px 36px",
        background: `radial-gradient(ellipse at 50% 0%, #2E1C0F 0%, ${C.bg} 75%)`,
      }}>
        <div style={{
          display: "inline-block", background: C.cream, borderRadius: 4,
          padding: "16px 28px",
          boxShadow: `0 10px 50px rgba(0,0,0,0.55), 0 0 0 1px ${C.goldSoft}`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={conta.nome} width={180} style={{ display: "block" }} />
        </div>

        <div style={{ marginTop: 26 }}>
          <GoldOrnament />
        </div>

        <p style={{
          marginTop: 16, fontSize: 9.5, fontWeight: 300, color: C.gold,
          letterSpacing: "0.32em", textTransform: "uppercase",
        }}>
          Confeitaria Artesanal · Encomendas
        </p>

        {conta.instagram && (
          <a
            href={`https://instagram.com/${conta.instagram.replace("@", "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20,
              fontSize: 11.5, color: C.cream, textDecoration: "none",
              border: `1px solid ${C.goldSoft}`, borderRadius: 2,
              padding: "9px 20px", letterSpacing: "0.08em", fontWeight: 300,
            }}
          >
            <InstagramIcon size={13} color={C.gold} />
            {conta.instagram}
          </a>
        )}
      </div>

      {/* Category tabs */}
      {catsComProdutos.length > 1 && (
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(23,13,8,0.93)", backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.goldFaint}`,
        }}>
          <div className="hide-scroll" style={{
            display: "flex", gap: 4, padding: "0 12px", overflowX: "auto",
            maxWidth: 560, margin: "0 auto", scrollbarWidth: "none",
          }}>
            <button
              onClick={() => setCatAtiva("todas")}
              className="cat-tab"
              style={{
                flexShrink: 0, background: "none", border: "none", cursor: "pointer",
                padding: "16px 14px 14px", fontSize: 10.5, fontWeight: 500,
                letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: sans,
                color: catAtiva === "todas" ? C.gold : C.muted,
                borderBottom: catAtiva === "todas" ? `2px solid ${C.gold}` : "2px solid transparent",
              }}
            >
              Todos
            </button>
            {catsComProdutos.map(c => (
              <button
                key={c} onClick={() => scrollToCategoria(c)}
                className="cat-tab"
                style={{
                  flexShrink: 0, background: "none", border: "none", cursor: "pointer",
                  padding: "16px 14px 14px", fontSize: 10.5, fontWeight: 500,
                  letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: sans,
                  color: catAtiva === c ? C.gold : C.muted,
                  borderBottom: catAtiva === c ? `2px solid ${C.gold}` : "2px solid transparent",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 150 }}>
        {catsComProdutos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 24px" }}>
            <ShoppingBag size={36} color={C.goldSoft} style={{ margin: "0 auto 16px" }} />
            <p style={{ color: C.muted, fontSize: 13.5 }}>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          (catAtiva === "todas" ? catsComProdutos : catsComProdutos.filter(c => c === catAtiva)).map(cat => {
            const prods = produtos.filter(p => p.categoria === cat);
            if (!prods.length) return null;
            return (
              <div key={cat} ref={el => { catRefs.current[cat] = el; }}>
                {/* Category header */}
                <div style={{ textAlign: "center", padding: "44px 20px 26px" }}>
                  <GoldOrnament width={34} />
                  <h2 style={{
                    fontFamily: serif, fontSize: 30, fontWeight: 500, color: C.cream,
                    fontStyle: "italic", marginTop: 12,
                  }}>
                    {cat}
                  </h2>
                </div>

                {/* Product cards */}
                <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 22 }}>
                  {prods.map(p => {
                    const q = qtd(p.id);
                    return (
                      <div key={p.id} className="prod-card" style={{
                        background: C.surface, borderRadius: 14, overflow: "hidden",
                        border: `1px solid ${q > 0 ? C.goldSoft : C.goldFaint}`,
                        boxShadow: q > 0 ? `0 0 30px rgba(216,185,116,0.12)` : "0 8px 30px rgba(0,0,0,0.35)",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                      }}>
                        {/* Image */}
                        {p.imagemUrl ? (
                          <div style={{ position: "relative", width: "100%", height: 210, overflow: "hidden" }}>
                            <Image
                              src={toDirectImageUrl(p.imagemUrl)} alt={p.nome} fill
                              className="prod-img" style={{ objectFit: "cover" }}
                            />
                            <div style={{
                              position: "absolute", inset: 0,
                              background: `linear-gradient(to top, ${C.surface} 0%, transparent 38%)`,
                            }} />
                            {p.status === "encomenda" && (
                              <span style={{
                                position: "absolute", top: 12, left: 12,
                                fontSize: 8.5, fontWeight: 600, letterSpacing: "0.18em",
                                textTransform: "uppercase", color: C.bg,
                                background: C.gold, padding: "5px 10px", borderRadius: 2,
                              }}>
                                Sob encomenda
                              </span>
                            )}
                            {q > 0 && (
                              <span style={{
                                position: "absolute", top: 12, right: 12,
                                width: 26, height: 26, borderRadius: "50%",
                                background: C.gold, color: C.bg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 600,
                                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                              }}>
                                {q}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            position: "relative", width: "100%", height: 120,
                            background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontFamily: serif, fontStyle: "italic", color: C.goldSoft, fontSize: 15 }}>
                              {conta.nome}
                            </span>
                            {p.status === "encomenda" && (
                              <span style={{
                                position: "absolute", top: 12, left: 12,
                                fontSize: 8.5, fontWeight: 600, letterSpacing: "0.18em",
                                textTransform: "uppercase", color: C.bg,
                                background: C.gold, padding: "5px 10px", borderRadius: 2,
                              }}>
                                Sob encomenda
                              </span>
                            )}
                          </div>
                        )}

                        {/* Body */}
                        <div style={{ padding: "16px 18px 18px" }}>
                          {/* Nome ..... preço */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <h3 style={{
                              fontFamily: serif, fontSize: 21, fontWeight: 500,
                              color: C.cream, lineHeight: 1.25, flexShrink: 1,
                            }}>
                              {p.nome}
                            </h3>
                            <span style={{ flex: 1, borderBottom: `1px dotted ${C.goldSoft}`, minWidth: 14, transform: "translateY(-4px)" }} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: C.gold, flexShrink: 0 }}>
                              {fmt(p.precoVenda)}
                            </span>
                          </div>

                          {p.descricao && (
                            <p style={{
                              fontFamily: serif, fontStyle: "italic", fontSize: 14.5,
                              color: C.muted, marginTop: 6, lineHeight: 1.5,
                            }}>
                              {p.descricao}
                            </p>
                          )}

                          {/* Controls */}
                          <div style={{ marginTop: 14 }}>
                            {q === 0 ? (
                              <button
                                onClick={() => addItem(p)}
                                style={{
                                  width: "100%", background: "none",
                                  border: `1px solid ${C.goldSoft}`, borderRadius: 3,
                                  color: C.gold, padding: "11px", cursor: "pointer",
                                  fontSize: 10, fontWeight: 500, letterSpacing: "0.22em",
                                  textTransform: "uppercase", fontFamily: sans,
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                  transition: "background 0.25s ease",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = C.goldFaint)}
                                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                              >
                                <Plus size={11} strokeWidth={2.5} />
                                Adicionar
                              </button>
                            ) : (
                              <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                border: `1px solid ${C.goldSoft}`, borderRadius: 3, padding: 4,
                              }}>
                                <button onClick={() => removeItem(p.id)} style={{
                                  width: 38, height: 38, background: "none", border: "none",
                                  color: C.gold, cursor: "pointer", display: "flex",
                                  alignItems: "center", justifyContent: "center",
                                }}>
                                  <Minus size={15} />
                                </button>
                                <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.cream }}>{q}</span>
                                <button onClick={() => addItem(p)} style={{
                                  width: 38, height: 38,
                                  background: `linear-gradient(135deg, ${C.gold} 0%, #C9A55C 100%)`,
                                  border: "none", borderRadius: 2, color: C.bg, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <Plus size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Rodapé do menu */}
        {catsComProdutos.length > 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px 0" }}>
            <GoldOrnament width={40} />
            <p style={{
              marginTop: 14, fontFamily: serif, fontStyle: "italic",
              color: C.muted, fontSize: 15,
            }}>
              Feito com afeto, um doce de cada vez.
            </p>
          </div>
        )}
      </div>

      {/* Floating cart */}
      {totalItens > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 16px 22px", zIndex: 30 }}>
          {carrinhoAberto && (
            <div style={{
              maxWidth: 520, margin: "0 auto 12px",
              background: "rgba(35,23,16,0.97)", backdropFilter: "blur(16px)",
              border: `1px solid ${C.goldSoft}`, borderRadius: 14, padding: 18,
              boxShadow: "0 -8px 60px rgba(0,0,0,0.6)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 19, color: C.cream }}>Meu pedido</p>
                <button onClick={() => setCarrinhoAberto(false)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: "none",
                  border: `1px solid ${C.goldFaint}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={12} color={C.muted} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13, maxHeight: 210, overflowY: "auto" }}>
                {carrinho.map(i => (
                  <div key={i.produto.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => removeItem(i.produto.id)} style={{
                        width: 25, height: 25, borderRadius: "50%", background: "none",
                        border: `1px solid ${C.goldSoft}`, color: C.gold, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Minus size={10} />
                      </button>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.cream, width: 18, textAlign: "center" }}>{i.quantidade}</span>
                      <button onClick={() => addItem(i.produto)} style={{
                        width: 25, height: 25, borderRadius: "50%",
                        background: C.gold, border: "none", color: C.bg, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Plus size={10} />
                      </button>
                    </div>
                    <span style={{
                      flex: 1, fontFamily: serif, fontSize: 15.5, color: C.cream,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {i.produto.nome}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, flexShrink: 0 }}>
                      {fmt(i.produto.precoVenda * i.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                borderTop: `1px solid ${C.goldFaint}`, marginTop: 16, paddingTop: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 17, color: C.cream }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: C.gold }}>{fmt(total)}</span>
              </div>
            </div>
          )}

          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <button
              onClick={() => carrinhoAberto ? setStep("dados") : setCarrinhoAberto(true)}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${C.gold} 0%, #C9A55C 100%)`,
                color: C.bg, border: "none", borderRadius: 4,
                padding: "16px 20px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 10px 40px rgba(216,185,116,0.3), 0 4px 14px rgba(0,0,0,0.4)",
                fontFamily: sans,
              }}
            >
              <span style={{
                fontSize: 10.5, fontWeight: 600, background: "rgba(23,13,8,0.15)",
                padding: "6px 12px", borderRadius: 3, letterSpacing: "0.05em",
              }}>
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
              }}>
                {carrinhoAberto ? "Finalizar pedido" : "Ver pedido"}
                <ChevronRight size={15} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{fmt(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
