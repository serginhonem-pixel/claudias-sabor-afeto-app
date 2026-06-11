"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getConta, getProdutos, getProximoNumeroPedido, savePedido, getClienteByWhatsapp, getPedidosByWhatsapp } from "@/lib/firestore";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, CheckCircle2, ChevronRight, X, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { Conta, Produto, Cliente, Pedido } from "@/types";

// ── Splash Screen ────────────────────────────────────────────────────────────

function SplashCardapio({ nomeConta, onEnter }: { nomeConta: string; onEnter: () => void }) {
  const [step1, setStep1] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const pts = Array.from({ length: 28 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
    }));
    setParticles(pts);
    setTimeout(() => setStep1(true), 180);
  }, []);

  function enter() {
    setRevealed(true);
    setTimeout(onEnter, 1100);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg, #FDF5EC 0%, #FAE8E0 50%, #F5DFE8 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", overflow: "hidden",
      fontFamily: "'Lora', 'Georgia', serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital@0;1&family=Poppins:wght@300;400;600&display=swap');
        @keyframes particleFloat {
          0% { opacity:0; transform: translate(0,0) scale(0); }
          35% { opacity: 0.8; transform: translate(calc(var(--tx)*0.4), calc(var(--ty)*0.4)) scale(1); }
          100% { opacity:0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
        }
        @keyframes splashPulse {
          0%, 100% { box-shadow: 0 8px 40px rgba(196,86,106,0.25), 0 0 0 0 rgba(196,86,106,0.3); }
          50% { box-shadow: 0 8px 40px rgba(196,86,106,0.4), 0 0 0 12px rgba(196,86,106,0); }
        }
        .splash-btn:hover { transform: scale(1.03); }
        .splash-btn { transition: transform 0.2s ease; }
      `}</style>

      {/* Dark curtain that slides up on reveal */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, #1A0D08 0%, #2A1F1A 55%, #3D1528 100%)",
        transform: revealed ? "translateY(-100%)" : "translateY(0%)",
        transition: "transform 1.1s cubic-bezier(0.76,0,0.24,1)",
        zIndex: 0, willChange: "transform",
      }} />

      {/* Particles */}
      {particles.map((p, i) => {
        const size = i % 4 === 0 ? 5 : i % 4 === 1 ? 3 : i % 4 === 2 ? 4 : 2;
        const colors = ["#C4566A", "#D8B974", "#E8A0AE", "#F5C6CB", "#D8B974", "#C4566A"];
        return (
          <div key={p.id} style={{
            position: "absolute", width: size, height: size,
            borderRadius: i % 6 === 0 ? 1 : "50%",
            background: colors[i % colors.length],
            left: `${p.x}%`, top: `${p.y}%`,
            opacity: 0, zIndex: 1,
            animation: step1 ? `particleFloat ${850 + i * 65}ms ease ${120 + i * 45}ms forwards` : "none",
            ["--tx" as string]: `${(Math.random() - 0.5) * 90}px`,
            ["--ty" as string]: `-${Math.random() * 110 + 30}px`,
          } as React.CSSProperties} />
        );
      })}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo card */}
        <div style={{
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0) scale(1)" : "translateY(24px) scale(0.93)",
          transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          background: "#FFFAF6",
          borderRadius: 20,
          padding: "20px 32px",
          boxShadow: "0 10px 50px rgba(0,0,0,0.28), 0 0 0 1px rgba(216,185,116,0.4)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={nomeConta} width={200} style={{ display: "block" }} />
        </div>

        {/* Ornament */}
        <div style={{
          marginTop: 26, display: "flex", alignItems: "center", gap: 8,
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.6s ease 0.5s",
        }}>
          <div style={{ width: 52, height: 0.7, background: "linear-gradient(to right, transparent, #C4566A)" }} />
          <div style={{ width: 5, height: 5, background: "#C4566A", transform: "rotate(45deg)", borderRadius: 1 }} />
          <div style={{ width: 7, height: 7, background: "#D8B974", transform: "rotate(45deg)", borderRadius: 1 }} />
          <div style={{ width: 5, height: 5, background: "#C4566A", transform: "rotate(45deg)", borderRadius: 1 }} />
          <div style={{ width: 52, height: 0.7, background: "linear-gradient(to left, transparent, #C4566A)" }} />
        </div>

        {/* Subtitle */}
        <div style={{
          marginTop: 16,
          fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 400,
          color: "#9B6B7B", letterSpacing: "0.22em", textTransform: "uppercase",
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.5s ease 0.62s",
          textAlign: "center",
        }}>
          Confeitaria artesanal · Encomendas
        </div>

        {/* CTA Button */}
        <button
          onClick={enter}
          className="splash-btn"
          style={{
            marginTop: 38,
            fontFamily: "'Poppins', sans-serif", fontSize: 10.5, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#FFFAF6",
            background: "linear-gradient(135deg, #C4566A 0%, #A8394E 100%)",
            border: "none",
            padding: "14px 46px",
            cursor: "pointer", borderRadius: 50,
            opacity: step1 ? 1 : 0,
            transform: step1 ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.78s, transform 0.5s ease 0.78s",
            animation: step1 ? "splashPulse 2.5s ease-in-out 1.5s infinite" : "none",
          }}
        >
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

const CAT_EMOJI: Record<string, string> = {
  Confeitaria: "🎂", Salgado: "🥐", Panificado: "🍞", Kit: "🎁", Outro: "✨",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #FDF5EC 0%, #FAE8E0 50%, #F5DFE8 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#FAEDEF] border-t-[#C4566A] rounded-full animate-spin" />
          <p className="text-[#9B6B7B] text-xs font-medium tracking-widest uppercase">Carregando</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: "linear-gradient(160deg, #FDF5EC 0%, #FAE8E0 60%, #F5DFE8 100%)" }}>
        <Toaster position="top-center" />

        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={conta?.nome} width={150} className="mx-auto mb-7" style={{ mixBlendMode: "multiply" }} />
            <h2 className="font-serif text-2xl font-bold text-[#2A1F1A] mb-2">Bem-vindo(a)! 🩷</h2>
            <p className="text-[#9B6B7B] text-sm leading-relaxed">Informe seu WhatsApp para carregar<br />seus dados automaticamente</p>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-5 space-y-3" style={{ boxShadow: "0 8px 32px rgba(196,86,106,0.12), 0 1px 0 rgba(255,255,255,0.8)" }}>
            <input
              type="tel"
              className="w-full border border-[#FAEDEF] rounded-2xl px-4 py-4 text-base outline-none focus:border-[#E8A0AE] bg-white/70 transition text-center tracking-wider text-[#2A1F1A] placeholder:text-[#C4B0B5]"
              placeholder="(27) 99999-9999"
              value={wppInput}
              onChange={e => { setWppInput(e.target.value); if (naoEncontrado) setIdentificacao("entrada"); }}
              onKeyDown={e => e.key === "Enter" && buscarCliente()}
              disabled={buscando}
            />

            {naoEncontrado && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm text-amber-700 font-medium">Número não encontrado.</p>
                <p className="text-xs text-amber-600 mt-0.5">Continue para fazer seu pedido!</p>
              </div>
            )}

            <button
              onClick={naoEncontrado ? pularIdentificacao : buscarCliente}
              disabled={buscando || (!naoEncontrado && !wppInput.trim())}
              className="w-full text-white font-semibold py-4 rounded-2xl transition text-sm disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C4566A 0%, #A8394E 100%)", boxShadow: "0 4px 16px rgba(196,86,106,0.35)" }}
            >
              {buscando ? "Buscando..." : naoEncontrado ? "Continuar assim mesmo" : "Continuar →"}
            </button>
          </div>

          <button onClick={pularIdentificacao} className="w-full text-[#9B6B7B] text-sm py-3 mt-2 hover:text-[#2A1F1A] transition text-center">
            Pular identificação
          </button>
        </div>
      </div>
    );
  }

  // ── Cliente encontrado ───────────────────────────────────────────────────────
  if (identificacao === "encontrado" && clienteEncontrado) {
    const fmt2 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: "linear-gradient(160deg, #FDF5EC 0%, #FAE8E0 60%, #F5DFE8 100%)" }}>
        <Toaster position="top-center" />
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={conta?.nome} width={130} className="mx-auto mb-6" style={{ mixBlendMode: "multiply" }} />
            <div className="w-18 h-18 mx-auto mb-4 relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FAEDEF] to-[#F5D5DE] rounded-full flex items-center justify-center mx-auto text-3xl shadow-md">
                🎂
              </div>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#2A1F1A]">
              Oi, {clienteEncontrado.nome.split(" ")[0]}!
            </h2>
            <p className="text-[#9B6B7B] text-sm mt-1">Que bom te ver por aqui 🩷</p>
          </div>

          {/* Pedidos anteriores */}
          {pedidosAnteriores.length > 0 && (
            <div className="mb-5">
              <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-2.5 text-center">
                Seus últimos pedidos
              </p>
              <div className="space-y-2">
                {pedidosAnteriores.map(p => (
                  <div key={p.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 px-4 py-3 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2A1F1A]">Pedido #{p.numero}</p>
                        <p className="text-[0.65rem] text-[#9B6B7B] truncate mt-0.5">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#B87444]">{fmt2(p.totalFinal)}</p>
                        <p className="text-[0.6rem] text-[#9B6B7B]">{new Date(p.dataEntrega + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setIdentificacao("pulado")}
            className="w-full text-white font-semibold py-4 rounded-2xl transition text-sm active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C4566A 0%, #A8394E 100%)", boxShadow: "0 4px 16px rgba(196,86,106,0.35)" }}
          >
            Ver Cardápio 🎂
          </button>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!conta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: "linear-gradient(160deg, #FDF5EC 0%, #F5DFE8 100%)" }}>
        <div>
          <p className="text-3xl mb-3">😕</p>
          <p className="text-[#9B6B7B]">Confeitaria não encontrada.</p>
        </div>
      </div>
    );
  }

  // ── Confirmado ───────────────────────────────────────────────────────────────
  if (step === "confirmado") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(160deg, #FDF5EC 0%, #FAE8E0 60%, #F5DFE8 100%)" }}>
        <Toaster position="top-center" />
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-30" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2A1F1A] mb-2">Pedido enviado! 🎉</h1>
          <p className="text-[#9B6B7B] text-sm mb-8 leading-relaxed">
            Seu pedido foi registrado. O WhatsApp da <strong className="text-[#2A1F1A]">{conta.nome}</strong> foi aberto com todos os detalhes — confirme por lá para garantir sua encomenda!
          </p>
          <button
            onClick={() => {
              setStep("menu"); setCarrinho([]); setNome(""); setWhatsapp("");
              setObs(""); setPersonalizacao(""); setDataEntrega("");
              setEndereco(""); setNumEnd(""); setComplemento(""); setBairro(""); setCidade("");
            }}
            className="w-full text-white font-semibold py-4 rounded-2xl text-sm transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C4566A 0%, #A8394E 100%)", boxShadow: "0 4px 16px rgba(196,86,106,0.35)" }}
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  // ── Dados / Formulário ───────────────────────────────────────────────────────
  if (step === "dados") {
    return (
      <div className="min-h-screen bg-[#FDF8F4]">
        <Toaster position="top-center" />

        {/* Header */}
        <div className="bg-white border-b border-[#FAEDEF] px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setStep("menu")} className="w-9 h-9 bg-[#FAEDEF] hover:bg-[#F0D0D8] rounded-full flex items-center justify-center transition">
            <ArrowLeft size={16} className="text-[#7A6860]" />
          </button>
          <div>
            <h2 className="font-bold text-[#2A1F1A] text-sm">Finalizar pedido</h2>
            <p className="text-[0.65rem] text-[#9B6B7B]">{totalItens} {totalItens === 1 ? "item" : "itens"} · {fmt(total)}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-5">

          {/* Seção: Informações pessoais */}
          <div>
            <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-[#C4566A] to-[#E8A0AE] rounded-lg flex items-center justify-center text-white text-[0.55rem]">👤</span>
              Suas informações
            </p>
            <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4 space-y-3 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Nome *</label>
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado(a)?" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">WhatsApp *</label>
                <input type="tel" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(27) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Seção: Entrega */}
          <div>
            <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-[#C4566A] to-[#E8A0AE] rounded-lg flex items-center justify-center text-white text-[0.55rem]">📅</span>
              Entrega
            </p>
            <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4 space-y-3 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Data desejada *</label>
                <input type="date" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Personalização</label>
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={personalizacao} onChange={e => setPersonalizacao(e.target.value)} placeholder="Ex: Feliz Aniversário Maria! 🎉" />
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div>
            <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-[#C4566A] to-[#E8A0AE] rounded-lg flex items-center justify-center text-white text-[0.55rem]">📍</span>
              Endereço de entrega <span className="normal-case font-normal text-[#C4B0B5]">(opcional)</span>
            </p>
            <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua / Avenida" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={numEnd} onChange={e => setNumEnd(e.target.value)} placeholder="Nº" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Complemento" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
              </div>
              <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-[#FFFAF8] transition placeholder:text-[#C4B0B5]" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          {/* Seção: Observações */}
          <div>
            <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-[#C4566A] to-[#E8A0AE] rounded-lg flex items-center justify-center text-white text-[0.55rem]">📝</span>
              Observações <span className="normal-case font-normal text-[#C4B0B5]">(opcional)</span>
            </p>
            <textarea
              className="w-full border border-[#FAEDEF] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition resize-none h-20 shadow-sm placeholder:text-[#C4B0B5]"
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Alguma observação para o pedido..."
            />
          </div>

          {/* Resumo do pedido */}
          <div>
            <p className="text-[0.65rem] font-bold text-[#9B6B7B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-[#C4566A] to-[#E8A0AE] rounded-lg flex items-center justify-center text-white text-[0.55rem]">🛍</span>
              Resumo do pedido
            </p>
            <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4 shadow-sm">
              <div className="space-y-2.5">
                {carrinho.map(i => (
                  <div key={i.produto.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="bg-gradient-to-br from-[#FAEDEF] to-[#F5D5DE] text-[#C4566A] text-[0.6rem] font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        {i.quantidade}
                      </span>
                      <span className="text-xs text-[#2A1F1A] font-medium truncate">{i.produto.nome}</span>
                    </div>
                    <span className="text-xs font-bold text-[#2A1F1A] shrink-0">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#FAEDEF] mt-4 pt-3 flex justify-between items-center">
                <span className="font-bold text-[#2A1F1A] text-sm">Total</span>
                <span className="font-black text-[#B87444] text-xl">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#FAEDEF] shadow-2xl">
          <button onClick={handleConfirmar} disabled={enviando}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-2xl transition text-sm disabled:opacity-60 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C4566A 0%, #A8394E 100%)", boxShadow: "0 4px 20px rgba(196,86,106,0.4)", display: "flex" }}>
            {enviando ? "Enviando..." : "✅ Confirmar e abrir WhatsApp"}
          </button>
        </div>
      </div>
    );
  }

  // ── MENU ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF8F4]">
      <Toaster position="top-center" />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #FFFAF6 0%, #FDF5F0 45%, #FAE8EF 100%)" }} />
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-60" style={{ background: "radial-gradient(circle, #FAEDEF, transparent)" }} />
        <div className="absolute top-4 -left-4 w-20 h-20 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #E8A0AE, transparent)" }} />
        <div className="absolute -bottom-4 right-1/3 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C4566A, transparent)" }} />

        <div className="relative px-4 pt-10 pb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={conta.nome} width={190} className="mx-auto" style={{ mixBlendMode: "multiply", display: "block" }} />
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px flex-1 max-w-14 bg-gradient-to-r from-transparent to-[#E8A0AE]" />
            <p className="text-[#9B6B7B] text-[0.6rem] font-medium tracking-[0.2em] uppercase">Confeitaria artesanal</p>
            <div className="h-px flex-1 max-w-14 bg-gradient-to-l from-transparent to-[#E8A0AE]" />
          </div>
          {conta.instagram && (
            <a
              href={`https://instagram.com/${conta.instagram.replace("@", "")}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-xs text-white font-medium px-4 py-2 rounded-full shadow-md hover:opacity-90 transition active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #C4566A 0%, #D4667A 100%)" }}
            >
              📸 {conta.instagram}
            </a>
          )}
        </div>
      </div>

      {/* Category sticky tabs */}
      {catsComProdutos.length > 1 && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#F0E5E8] shadow-sm">
          <div className="flex gap-2 px-3 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setCatAtiva("todas")}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${catAtiva === "todas"
                ? "text-white shadow-md"
                : "bg-[#FAF0F3] text-[#9B6B7B] hover:bg-[#FAEDEF]"}`}
              style={catAtiva === "todas" ? { background: "linear-gradient(135deg, #C4566A 0%, #D4667A 100%)" } : {}}
            >
              ✨ Todos
            </button>
            {catsComProdutos.map(c => (
              <button
                key={c} onClick={() => scrollToCategoria(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${catAtiva === c
                  ? "text-white shadow-md"
                  : "bg-[#FAF0F3] text-[#9B6B7B] hover:bg-[#FAEDEF]"}`}
                style={catAtiva === c ? { background: "linear-gradient(135deg, #C4566A 0%, #D4667A 100%)" } : {}}
              >
                {CAT_EMOJI[c]} {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="max-w-lg mx-auto pb-36">
        {catsComProdutos.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FAEDEF, #FAF0E8)" }}>
              <ShoppingBag size={30} className="text-[#E8A0AE]" />
            </div>
            <p className="text-[#9B6B7B] text-sm">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          (catAtiva === "todas" ? catsComProdutos : catsComProdutos.filter(c => c === catAtiva)).map(cat => {
            const prods = produtos.filter(p => p.categoria === cat);
            if (!prods.length) return null;
            return (
              <div key={cat} ref={el => { catRefs.current[cat] = el; }}>
                {/* Category header */}
                <div className="px-4 pt-8 pb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shadow-sm"
                    style={{ background: "linear-gradient(135deg, #C4566A 0%, #E8A0AE 100%)" }}>
                    {CAT_EMOJI[cat]}
                  </div>
                  <h2 className="font-bold text-[#2A1F1A] text-base tracking-tight">{cat}</h2>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #FAEDEF, transparent)" }} />
                </div>

                {/* Product grid */}
                <div className="px-4 grid grid-cols-2 gap-3">
                  {prods.map(p => {
                    const q = qtd(p.id);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-rose-50 flex flex-col group" style={{ boxShadow: "0 2px 12px rgba(196,86,106,0.08)" }}>
                        {/* Image / Placeholder */}
                        {p.imagemUrl ? (
                          <div className="relative w-full aspect-square overflow-hidden">
                            <Image
                              src={toDirectImageUrl(p.imagemUrl)}
                              alt={p.nome} fill
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 45%, transparent 100%)" }} />

                            {p.status === "encomenda" && (
                              <span className="absolute top-2 left-2 text-[0.5rem] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full tracking-wide uppercase">
                                Encomenda
                              </span>
                            )}
                            {q > 0 && (
                              <span className="absolute top-2 right-2 w-5 h-5 text-white text-[0.6rem] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-lg"
                                style={{ background: "linear-gradient(135deg, #C4566A, #A8394E)" }}>
                                {q}
                              </span>
                            )}
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-white/95 backdrop-blur-sm text-[#B87444] font-black text-xs px-2 py-0.5 rounded-lg shadow-sm">
                                {fmt(p.precoVenda)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full aspect-square flex flex-col items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #FAEDEF 0%, #FAF0F3 50%, #FDF8F4 100%)" }}>
                            <span className="text-4xl opacity-40">{CAT_EMOJI[cat]}</span>
                            {p.status === "encomenda" && (
                              <span className="absolute top-2 left-2 text-[0.5rem] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full tracking-wide uppercase">
                                Encomenda
                              </span>
                            )}
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-white/90 text-[#B87444] font-black text-xs px-2 py-0.5 rounded-lg shadow-sm">
                                {fmt(p.precoVenda)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Card footer */}
                        <div className="p-2.5 flex-1 flex flex-col">
                          <h3 className="font-bold text-[#2A1F1A] text-[0.72rem] leading-snug line-clamp-2 flex-1 mb-0.5">
                            {p.nome}
                          </h3>
                          {p.descricao && (
                            <p className="text-[0.58rem] text-[#9B6B7B] line-clamp-1 mb-1.5">{p.descricao}</p>
                          )}
                          <div className="mt-auto">
                            {q === 0 ? (
                              <button
                                onClick={() => addItem(p)}
                                className="w-full text-white text-[0.62rem] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 transition active:scale-95"
                                style={{ background: "linear-gradient(135deg, #C4566A 0%, #D4667A 100%)", boxShadow: "0 2px 8px rgba(196,86,106,0.3)" }}
                              >
                                <Plus size={9} strokeWidth={3} />
                                Adicionar
                              </button>
                            ) : (
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => removeItem(p.id)}
                                  className="w-7 h-7 rounded-full border-2 border-[#C4566A] text-[#C4566A] flex items-center justify-center hover:bg-rose-50 transition active:scale-95"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-black text-[#2A1F1A] text-sm">{q}</span>
                                <button
                                  onClick={() => addItem(p)}
                                  className="w-7 h-7 rounded-full text-white flex items-center justify-center transition active:scale-95"
                                  style={{ background: "linear-gradient(135deg, #C4566A 0%, #D4667A 100%)", boxShadow: "0 2px 8px rgba(196,86,106,0.3)" }}
                                >
                                  <Plus size={11} />
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
      </div>

      {/* Floating cart */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2">
          {carrinhoAberto && (
            <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-3xl border border-rose-100 mb-3 p-4"
              style={{ boxShadow: "0 -4px 40px rgba(196,86,106,0.15), 0 20px 40px rgba(0,0,0,0.12)" }}>
              <div className="flex items-center justify-between mb-3.5">
                <p className="font-bold text-[#2A1F1A] text-sm">Meu pedido</p>
                <button onClick={() => setCarrinhoAberto(false)} className="w-7 h-7 bg-[#FAEDEF] hover:bg-[#F0D0D8] rounded-full flex items-center justify-center transition">
                  <X size={13} className="text-[#7A6860]" />
                </button>
              </div>
              <div className="space-y-3 max-h-52 overflow-y-auto">
                {carrinho.map(i => (
                  <div key={i.produto.id} className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => removeItem(i.produto.id)} className="w-6 h-6 rounded-full bg-[#FAEDEF] text-[#C4566A] flex items-center justify-center hover:bg-[#F0D0D8] transition">
                        <Minus size={9} />
                      </button>
                      <span className="text-xs font-black text-[#2A1F1A] w-4 text-center">{i.quantidade}×</span>
                      <button onClick={() => addItem(i.produto)} className="w-6 h-6 rounded-full text-white flex items-center justify-center transition"
                        style={{ background: "linear-gradient(135deg, #C4566A, #D4667A)" }}>
                        <Plus size={9} />
                      </button>
                    </div>
                    <span className="flex-1 text-xs text-[#2A1F1A] font-medium truncate">{i.produto.nome}</span>
                    <span className="text-xs font-bold text-[#B87444] shrink-0">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#FAEDEF] mt-3.5 pt-3 flex justify-between items-center">
                <span className="font-bold text-[#2A1F1A] text-sm">Total</span>
                <span className="font-black text-[#B87444] text-lg">{fmt(total)}</span>
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto">
            <button
              onClick={() => carrinhoAberto ? setStep("dados") : setCarrinhoAberto(true)}
              className="w-full text-white font-semibold px-5 py-4 rounded-2xl transition-all flex items-center justify-between active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #C4566A 0%, #B04060 100%)",
                boxShadow: "0 8px 28px rgba(196,86,106,0.45)",
              }}
            >
              <span className="bg-white/25 text-xs font-bold px-3 py-1.5 rounded-xl">
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {carrinhoAberto ? "Finalizar pedido" : "Ver pedido"}
                <ChevronRight size={16} />
              </span>
              <span className="text-sm font-black">{fmt(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
