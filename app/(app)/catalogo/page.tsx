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

const STORY_W = 1080;
const STORY_H = 1920;

async function imagemParaDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function CatalogoPage() {
  const { conta } = useConta();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [gerando, setGerando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conta) return;
    getProdutos(conta.id).then(setProdutos);
  }, [conta]);

  const disponiveis = produtos
    .filter(p => p.status === "ativo" && p.estoque !== undefined && p.estoque > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  useEffect(() => {
    const urls = disponiveis.slice(0, 6).map(p => p.imagemUrl).filter((u): u is string => !!u);
    const faltando = urls.filter(u => !(u in fotos));
    if (faltando.length === 0) return;
    Promise.all(faltando.map(async u => [u, await imagemParaDataUrl(toDirectImageUrl(u))] as const)).then(pares => {
      setFotos(prev => {
        const next = { ...prev };
        for (const [u, dataUrl] of pares) if (dataUrl) next[u] = dataUrl;
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponiveis.map(p => p.imagemUrl).join(",")]);

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  function esperarImagens(container: HTMLElement): Promise<void> {
    const imgs = Array.from(container.querySelectorAll("img"));
    return Promise.all(
      imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      })
    ).then(() => undefined);
  }

  async function gerarCanvas() {
    if (!storyRef.current) return null;
    await esperarImagens(storyRef.current);
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
  }, [produtos, conta?.instagram, fotos]);

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

                {/* Grid de produtos */}
                <div style={{
                  flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
                  gridAutoRows: "1fr", gap: 20, overflow: "hidden",
                }}>
                  {disponiveis.slice(0, 6).map(p => (
                    <div key={p.id} style={{
                      position: "relative", borderRadius: 28, overflow: "hidden",
                      background: "#FAEDEF", boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    }}>
                      {p.imagemUrl && fotos[p.imagemUrl] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fotos[p.imagemUrl]}
                          alt={p.nome}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
                        }}>🍰</div>
                      )}
                      <div style={{
                        position: "absolute", left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 85%)",
                        padding: "60px 20px 20px",
                      }}>
                        <p style={{
                          fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.15,
                          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                        }}>{p.nome}</p>
                        <p style={{ fontSize: 24, color: "#FFD9E1", fontWeight: 700, margin: "4px 0 0" }}>{fmt(p.precoVenda)}</p>
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
