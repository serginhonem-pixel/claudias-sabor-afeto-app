"use client";
import { useEffect, useRef, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getProdutos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import type { Produto } from "@/types";

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

function disponibilidade(p: Produto): string {
  if (p.fatiasPorBolo && p.estoque !== undefined) {
    const fatias = Math.round(p.estoque * p.fatiasPorBolo);
    return `${fatias} fatia${fatias !== 1 ? "s" : ""} disponível${fatias !== 1 ? "eis" : ""}`;
  }
  return `${p.estoque} ${p.unidadeVenda}${(p.estoque ?? 0) !== 1 ? "s" : ""} disponí${(p.estoque ?? 0) !== 1 ? "veis" : "vel"}`;
}

const STORY_W = 1080;
const STORY_H = 1920;

export default function CatalogoPage() {
  const { conta } = useConta();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [gerando, setGerando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conta) return;
    getProdutos(conta.id).then(setProdutos);
  }, [conta]);

  const disponiveis = produtos
    .filter(p => p.status === "ativo" && p.estoque !== undefined && p.estoque > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  async function gerarCanvas() {
    if (!storyRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(storyRef.current, {
      width: STORY_W,
      height: STORY_H,
      windowWidth: STORY_W,
      windowHeight: STORY_H,
      scale: 1,
      useCORS: true,
      backgroundColor: null,
    });
  }

  useEffect(() => {
    if (disponiveis.length === 0) { setPreviewUrl(null); return; }
    setGerando(true);
    gerarCanvas()
      .then(canvas => setPreviewUrl(canvas ? canvas.toDataURL("image/png") : null))
      .catch(() => toast.error("Erro ao gerar a pré-visualização"))
      .finally(() => setGerando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos, conta?.instagram]);

  async function handleDownload() {
    setGerando(true);
    try {
      const canvas = await gerarCanvas();
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      setPreviewUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `disponiveis-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      toast.success("Imagem baixada!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar a imagem");
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <Topbar title="Stories" actions={
        <button
          onClick={handleDownload}
          disabled={gerando || disponiveis.length === 0}
          className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#C4566A]/90 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
        >
          <Download size={13} /> {gerando ? "Gerando..." : "Baixar imagem"}
        </button>
      } />

      <div className="p-4 md:p-6">
        <p className="text-sm text-muted mb-4">
          Gera automaticamente uma imagem de Story (1080x1920) com os produtos que estão com estoque disponível agora, pra postar no Instagram.
        </p>

        <div className="w-full flex justify-center">
          {disponiveis.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-rose-light p-10 text-center max-w-md">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-muted text-sm">Nenhum produto com estoque disponível agora.</p>
              <p className="text-muted text-xs mt-1">Cadastre o estoque na tela <strong>Estoque</strong>, aba Produtos, pra ele aparecer aqui.</p>
            </div>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Prévia do story"
              style={{ width: 340, maxWidth: "100%", aspectRatio: `${STORY_W} / ${STORY_H}`, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", objectFit: "contain" }}
            />
          ) : (
            <div style={{ width: 340, aspectRatio: `${STORY_W} / ${STORY_H}` }} className="bg-white rounded-2xl border border-rose-light/60 flex items-center justify-center">
              <p className="text-xs text-muted">Gerando pré-visualização...</p>
            </div>
          )}
        </div>

        {/* Nó real (fora da tela) usado pelo html2canvas para gerar a imagem em resolução cheia */}
        <div style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }} aria-hidden>
              <div
                ref={storyRef}
                style={{
                  width: STORY_W,
                  height: STORY_H,
                  background: "linear-gradient(160deg, #FAEDEF 0%, #FFF8F3 50%, #FAEDEF 100%)",
                  fontFamily: "system-ui, sans-serif",
                  display: "flex",
                  flexDirection: "column",
                  padding: "70px 64px",
                  boxSizing: "border-box",
                }}
              >
                {/* Cabeçalho */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <div style={{
                    display: "inline-flex", background: "#fff", borderRadius: 20,
                    padding: "16px 28px", boxShadow: "0 6px 24px rgba(196,86,106,0.12)",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="logo" style={{ height: 64, objectFit: "contain" }} />
                  </div>
                  <p style={{ fontSize: 44, fontWeight: 800, color: "#3a2a26", marginTop: 28, marginBottom: 6 }}>
                    Disponível para pronta entrega 🍰
                  </p>
                  <p style={{ fontSize: 26, color: "#C4566A", fontWeight: 600, textTransform: "capitalize" }}>{hoje}</p>
                </div>

                {/* Lista de produtos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22, overflow: "hidden" }}>
                  {disponiveis.slice(0, 6).map(p => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 24,
                      background: "#fff", borderRadius: 24, padding: 20,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                    }}>
                      {p.imagemUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toDirectImageUrl(p.imagemUrl)}
                          alt={p.nome}
                          crossOrigin="anonymous"
                          style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 18, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 140, height: 140, borderRadius: 18, flexShrink: 0,
                          background: "#FAEDEF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
                        }}>🍰</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 32, fontWeight: 700, color: "#3a2a26", margin: 0, lineHeight: 1.15 }}>{p.nome}</p>
                        <p style={{ fontSize: 24, color: "#C4566A", fontWeight: 700, margin: "6px 0" }}>{fmt(p.precoVenda)}</p>
                        <p style={{ fontSize: 20, color: "#8a7a72", margin: 0 }}>{disponibilidade(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rodapé */}
                <div style={{ textAlign: "center", marginTop: 32 }}>
                  <p style={{ fontSize: 30, fontWeight: 700, color: "#3a2a26", margin: 0 }}>Chama no WhatsApp! 💌</p>
                  {conta?.instagram && (
                    <p style={{ fontSize: 24, color: "#C4566A", fontWeight: 600, marginTop: 8 }}>@{conta.instagram.replace(/^@/, "")}</p>
                  )}
                </div>
              </div>
        </div>
      </div>
    </>
  );
}
