"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getConta, getProdutos, getProximoNumeroPedido, savePedido } from "@/lib/firestore";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, CheckCircle2, ChevronRight, X, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { Conta, Produto } from "@/types";

// ── Splash Screen ────────────────────────────────────────────────────────────

function SplashCardapio({ nomeConta, onEnter }: { nomeConta: string; onEnter: () => void }) {
  const [step1, setStep1] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const pts = Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
    }));
    setParticles(pts);
    setTimeout(() => setStep1(true), 300);
  }, []);

  function enter() {
    setRevealed(true);
    setTimeout(onEnter, 1100);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#F6EFE1",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", overflow: "hidden",
        fontFamily: "'Lora', 'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital@0;1&family=Poppins:wght@300;400;600&display=swap');
        @keyframes particleFloat {
          0% { opacity:0; transform: translate(0,0); }
          40% { opacity: 0.5; }
          100% { opacity:0; transform: translate(var(--tx), var(--ty)); }
        }
      `}</style>

      {/* Fundo escuro que desliza para cima */}
      <div style={{
        position: "absolute", inset: 0, background: "#2A1F1A",
        transform: revealed ? "translateY(-100%)" : "translateY(0%)",
        transition: "transform 1.1s cubic-bezier(0.76,0,0.24,1)",
        zIndex: 0,
      }} />

      {/* Partículas douradas */}
      {particles.map((p, i) => (
        <div key={p.id} style={{
          position: "absolute", width: 3, height: 3, borderRadius: "50%",
          background: "#D8B974", left: `${p.x}%`, top: `${p.y}%`,
          opacity: 0, zIndex: 1,
          animation: step1 ? `particleFloat ${800 + i * 80}ms ease ${200 + i * 60}ms forwards` : "none",
          ["--tx" as string]: `${(Math.random() - 0.5) * 60}px`,
          ["--ty" as string]: `-${Math.random() * 80 + 30}px`,
        } as React.CSSProperties} />
      ))}

      {/* Conteúdo */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* Logo */}
        <div style={{
          opacity: step1 ? 1 : 0,
          transform: step1 ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          background: "#F6EFE1",
          borderRadius: 14,
          padding: "14px 22px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.35)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={nomeConta} width={190} style={{ display: "block" }} />
        </div>


        {/* Ornamento */}
        <div style={{
          marginTop: 22, display: "flex", alignItems: "center", gap: 6,
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.5s ease 0.45s",
        }}>
          <div style={{ width: 52, height: 0.6, background: "#D8B974" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 5, height: 5, background: "#D8B974", transform: "rotate(45deg)" }} />
          <div style={{ width: 52, height: 0.6, background: "#D8B974" }} />
        </div>

        {/* Subtítulo referência ao cardápio */}
        <div style={{
          marginTop: 18,
          fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 300,
          color: "#D8B974", letterSpacing: "0.12em", textTransform: "uppercase",
          opacity: step1 ? 1 : 0,
          transition: "opacity 0.5s ease 0.55s",
          textAlign: "center",
        }}>
          🎂 Confeitaria artesanal • Encomendas
        </div>

        {/* Botão */}
        <button
          onClick={enter}
          style={{
            marginTop: 32,
            fontFamily: "'Poppins', sans-serif", fontSize: 11.5, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#2A1F1A", background: "#D8B974", border: "none",
            padding: "11px 34px", cursor: "pointer",
            opacity: step1 ? 1 : 0,
            transform: step1 ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.5s ease 0.65s, transform 0.5s ease 0.65s",
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

      // Notifica a dona via email
      fetch("/api/notificar-pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId,
          numero,
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
        `🎂 *Novo Pedido #${numero} — ${conta?.nome}*`,
        ``,
        `👤 *Cliente:* ${nome.trim()}`,
        `📱 *WhatsApp:* ${whatsapp.trim()}`,
        enderecoCompleto ? `📍 *Endereço:* ${enderecoCompleto}` : "",
        `📅 *Entrega desejada:* ${new Date(dataEntrega + "T12:00:00").toLocaleDateString("pt-BR")}`,
        ``,
        `*Itens:*`,
        itensTexto,
        ``,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FAEDEF] border-t-[#C4566A] rounded-full animate-spin" />
      </div>
    );
  }

  if (showSplash && conta) {
    return <SplashCardapio nomeConta={conta.nome} onEnter={() => setShowSplash(false)} />;
  }

  if (!conta) {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center p-6 text-center">
        <div><p className="text-2xl mb-2">😕</p><p className="text-[#7A6860]">Confeitaria não encontrada.</p></div>
      </div>
    );
  }

  if (step === "confirmado") {
    return (
      <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2A1F1A] mb-2">Pedido enviado! 🎉</h1>
          <p className="text-[#7A6860] text-sm mb-6">
            Seu pedido foi registrado com sucesso. O WhatsApp da <strong>{conta.nome}</strong> foi aberto com todos os detalhes — confirme por lá para garantir sua encomenda!
          </p>
          <button
            onClick={() => { setStep("menu"); setCarrinho([]); setNome(""); setWhatsapp(""); setObs(""); setPersonalizacao(""); setDataEntrega(""); setEndereco(""); setNumEnd(""); setComplemento(""); setBairro(""); setCidade(""); }}
            className="w-full bg-[#C4566A] hover:bg-[#b04d60] text-white font-semibold py-3 rounded-2xl text-sm transition"
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  if (step === "dados") {
    return (
      <div className="min-h-screen bg-[#FDF8F4]">
        <Toaster position="top-center" />
        <div className="bg-white border-b border-[#FAEDEF] px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep("menu")} className="p-2 hover:bg-[#FAEDEF] rounded-full transition">
            <ArrowLeft size={18} className="text-[#7A6860]" />
          </button>
          <h2 className="font-semibold text-[#2A1F1A] text-sm">Seus dados</h2>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Seu nome *</label>
            <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado(a)?" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">WhatsApp *</label>
            <input type="tel" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(27) 99999-9999" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Data de entrega desejada *</label>
            <input type="date" className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Personalização (opcional)</label>
            <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={personalizacao} onChange={e => setPersonalizacao(e.target.value)} placeholder="Ex: Feliz Aniversário Maria! 🎉" />
          </div>

          {/* Endereço de entrega */}
          <div>
            <p className="text-xs font-semibold text-[#7A6860] mb-2">📍 Endereço de entrega (opcional)</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua / Avenida" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={numEnd} onChange={e => setNumEnd(e.target.value)} placeholder="Nº" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Complemento" />
                <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
              </div>
              <input className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A6860] mb-1.5">Observações (opcional)</label>
            <textarea className="w-full border border-[#FAEDEF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8A0AE] bg-white transition resize-none h-16" value={obs} onChange={e => setObs(e.target.value)} placeholder="Alguma observação para o pedido..." />
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-2xl border border-[#FAEDEF] p-4">
            <p className="font-semibold text-[#2A1F1A] text-sm mb-3">Resumo do pedido</p>
            <div className="space-y-2">
              {carrinho.map(i => (
                <div key={i.produto.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FAEDEF] text-[#C4566A] text-[0.6rem] font-bold w-5 h-5 rounded-full flex items-center justify-center">{i.quantidade}</span>
                    <span className="text-[#2A1F1A]">{i.produto.nome}</span>
                  </div>
                  <span className="font-semibold text-[#2A1F1A]">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#FAEDEF] mt-3 pt-3 flex justify-between font-bold text-[#2A1F1A]">
              <span>Total</span>
              <span className="text-[#B87444] text-lg">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#FAEDEF] shadow-lg">
          <button onClick={handleConfirmar} disabled={enviando}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition text-sm">
            {enviando ? "Enviando..." : "✅ Confirmar e abrir WhatsApp"}
          </button>
        </div>
      </div>
    );
  }

  // ── MENU ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF8F4]">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-[#FDF8F4] px-4 pt-8 pb-5 text-center border-b border-[#FAEDEF]">
        <div className="flex justify-center mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={conta.nome} width={200} style={{ mixBlendMode: "multiply", display: "block" }} />
        </div>
        <p className="text-[#7A6860] text-xs">Faça seu pedido direto com a gente 🎂</p>
        {conta.instagram && (
          <a href={`https://instagram.com/${conta.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-1.5 text-[0.65rem] text-[#C4566A] font-semibold">
            {conta.instagram}
          </a>
        )}
      </div>

      {/* Categorias sticky */}
      {catsComProdutos.length > 1 && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#FAEDEF] px-4 py-2.5 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCatAtiva("todas")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${catAtiva === "todas" ? "bg-[#C4566A] text-white" : "bg-[#FAEDEF] text-[#7A6860]"}`}
          >
            Todos
          </button>
          {catsComProdutos.map(c => (
            <button key={c} onClick={() => scrollToCategoria(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${catAtiva === c ? "bg-[#C4566A] text-white" : "bg-[#FAEDEF] text-[#7A6860]"}`}>
              {CAT_EMOJI[c]} {c}
            </button>
          ))}
        </div>
      )}

      {/* Produtos */}
      <div className="max-w-lg mx-auto pb-36">
        {catsComProdutos.length === 0 ? (
          <div className="text-center py-20 text-[#7A6860]">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          (catAtiva === "todas" ? catsComProdutos : catsComProdutos.filter(c => c === catAtiva)).map(cat => {
            const prods = produtos.filter(p => p.categoria === cat);
            if (!prods.length) return null;
            return (
              <div key={cat} ref={el => { catRefs.current[cat] = el; }}>
                {/* Cabeçalho da categoria */}
                <div className="px-4 pt-6 pb-3 flex items-center gap-2">
                  <span className="text-xl">{CAT_EMOJI[cat]}</span>
                  <h2 className="font-serif font-bold text-[#2A1F1A] text-lg">{cat}</h2>
                  <div className="flex-1 h-px bg-[#FAEDEF] ml-1" />
                </div>

                <div className="px-4 space-y-3">
                  {prods.map(p => {
                    const q = qtd(p.id);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[#FAEDEF] shadow-sm">
                        {/* Foto */}
                        {p.imagemUrl ? (
                          <div className="relative w-full h-44">
                            <Image src={toDirectImageUrl(p.imagemUrl)} alt={p.nome} fill className="object-cover" />
                            {p.status === "encomenda" && (
                              <span className="absolute top-2 left-2 text-[0.6rem] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">Sob encomenda</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-[#FAEDEF] to-[#FDF8F4] flex items-center justify-center">
                            <span className="text-5xl opacity-40">{CAT_EMOJI[cat]}</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-bold text-[#2A1F1A] text-base leading-snug">{p.nome}</h3>
                              {p.descricao && <p className="text-xs text-[#7A6860] mt-1 leading-relaxed">{p.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className="font-bold text-[#B87444] text-lg">{fmt(p.precoVenda)}</p>
                            <div className="flex items-center gap-2">
                              {q > 0 && (
                                <>
                                  <button onClick={() => removeItem(p.id)}
                                    className="w-9 h-9 rounded-full border-2 border-[#C4566A] text-[#C4566A] flex items-center justify-center hover:bg-[#FAEDEF] transition font-bold">
                                    <Minus size={15} />
                                  </button>
                                  <span className="w-6 text-center font-bold text-[#2A1F1A]">{q}</span>
                                </>
                              )}
                              <button onClick={() => addItem(p)}
                                className="w-9 h-9 rounded-full bg-[#C4566A] text-white flex items-center justify-center hover:bg-[#b04d60] transition shadow-sm">
                                <Plus size={15} />
                              </button>
                            </div>
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

      {/* Carrinho flutuante */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2">
          {carrinhoAberto && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#FAEDEF] shadow-xl mb-3 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[#2A1F1A] text-sm">Meu pedido</p>
                <button onClick={() => setCarrinhoAberto(false)} className="p-1 hover:bg-[#FAEDEF] rounded-full transition">
                  <X size={16} className="text-[#7A6860]" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {carrinho.map(i => (
                  <div key={i.produto.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeItem(i.produto.id)} className="w-6 h-6 rounded-full bg-[#FAEDEF] text-[#C4566A] flex items-center justify-center text-xs font-bold hover:bg-[#E8A0AE] transition">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs text-[#2A1F1A] font-medium">{i.quantidade}x {i.produto.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#2A1F1A]">{fmt(i.produto.precoVenda * i.quantidade)}</span>
                      <button onClick={() => addItem(i.produto)} className="w-6 h-6 rounded-full bg-[#C4566A] text-white flex items-center justify-center hover:bg-[#b04d60] transition">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#FAEDEF] mt-3 pt-2 flex justify-between text-sm font-bold text-[#2A1F1A]">
                <span>Total</span>
                <span className="text-[#B87444]">{fmt(total)}</span>
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto">
            <button
              onClick={() => carrinhoAberto ? setStep("dados") : setCarrinhoAberto(true)}
              className="w-full bg-[#C4566A] hover:bg-[#b04d60] text-white font-semibold px-5 py-4 rounded-2xl shadow-xl transition flex items-center justify-between"
            >
              <span className="bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full">
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                {carrinhoAberto ? "Finalizar pedido" : "Ver pedido"}
                <ChevronRight size={16} />
              </span>
              <span className="text-sm font-bold">{fmt(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
