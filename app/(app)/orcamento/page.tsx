"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getProdutos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Plus, Trash2, Copy, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { Produto } from "@/types";

interface ItemOrcamento {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
}

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function OrcamentoPage() {
  const { conta } = useConta();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [cliente, setCliente] = useState("");
  const [validade, setValidade] = useState("7");
  const [obs, setObs] = useState("");
  const [desconto, setDesconto] = useState(0);

  useEffect(() => {
    if (!conta) return;
    getProdutos(conta.id).then(ps => setProdutos(ps.filter(p => p.status !== "inativo")));
  }, [conta]);

  function addItem() {
    const p = produtos[0];
    if (!p) return;
    setItens(prev => [...prev, { produtoId: p.id, produtoNome: p.nome, quantidade: 1, precoUnit: p.precoVenda, subtotal: p.precoVenda }]);
  }

  function updateItem(idx: number, produtoId: string, quantidade: number) {
    const p = produtos.find(x => x.id === produtoId);
    if (!p) return;
    setItens(prev => prev.map((it, i) => i === idx
      ? { produtoId, produtoNome: p.nome, quantidade, precoUnit: p.precoVenda, subtotal: p.precoVenda * quantidade }
      : it
    ));
  }

  function removeItem(idx: number) { setItens(prev => prev.filter((_, i) => i !== idx)); }

  const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - desconto);

  function gerarTexto() {
    if (itens.length === 0) return "";
    const linhas = [
      `🎂 *Orçamento — ${conta?.nome}*`,
      ``,
      cliente ? `👤 *Para:* ${cliente}` : "",
      ``,
      `*Itens:*`,
      ...itens.map(i => `• ${i.quantidade}x ${i.produtoNome} — ${fmt(i.subtotal)}`),
      ``,
      desconto > 0 ? `Subtotal: ${fmt(subtotal)}` : "",
      desconto > 0 ? `Desconto: -${fmt(desconto)}` : "",
      `💰 *Total: ${fmt(total)}*`,
      ``,
      validade ? `⏳ Válido por ${validade} dias` : "",
      obs ? `📝 ${obs}` : "",
      ``,
      `Para confirmar seu pedido, responda esta mensagem! 😊`,
    ].filter(l => l !== undefined && (l as string).length > 0);
    return linhas.join("\n");
  }

  function copiar() {
    const texto = gerarTexto();
    if (!texto) { toast.error("Adicione pelo menos um item"); return; }
    navigator.clipboard.writeText(texto);
    toast.success("Orçamento copiado!");
  }

  function enviarWhatsApp() {
    const texto = gerarTexto();
    if (!texto) { toast.error("Adicione pelo menos um item"); return; }
    const tel = conta?.telefone?.replace(/\D/g, "");
    if (!tel) { toast.error("Configure o telefone nas Configurações"); return; }
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  const preview = gerarTexto();

  return (
    <>
      <Topbar title="Orçamento Rápido" />
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-5">

          {/* Formulário */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-rose-light/60 p-5 space-y-4">
              <h2 className="font-heading font-semibold text-dark text-sm">Dados do Orçamento</h2>

              <div>
                <label className="field-label">Nome do cliente (opcional)</label>
                <input className="field-input" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ex: Ana Paula" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="field-label mb-0">Itens *</label>
                  <button onClick={addItem} className="text-xs text-rose font-semibold flex items-center gap-1 hover:underline">
                    <Plus size={11} /> Adicionar
                  </button>
                </div>
                {itens.length === 0 ? (
                  <button onClick={addItem} className="w-full border-2 border-dashed border-rose-light hover:border-rose-mid rounded-xl py-5 text-xs text-muted hover:text-rose transition flex items-center justify-center gap-2">
                    <Plus size={14} /> Adicionar produto
                  </button>
                ) : (
                  <div className="space-y-2">
                    {itens.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_56px_60px_20px] gap-2 items-center">
                        <select className="field-input" value={item.produtoId} onChange={e => updateItem(i, e.target.value, item.quantidade)}>
                          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <input type="number" min="1" className="field-input text-center" value={item.quantidade}
                          onChange={e => updateItem(i, item.produtoId, Number(e.target.value))} />
                        <span className="text-xs font-semibold text-right text-dark">{fmt(item.subtotal)}</span>
                        <button onClick={() => removeItem(i)} className="text-muted hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Desconto (R$)</label>
                  <input type="number" min="0" step="0.01" className="field-input" value={desconto || ""} placeholder="0,00"
                    onChange={e => setDesconto(Number(e.target.value))} />
                </div>
                <div>
                  <label className="field-label">Validade (dias)</label>
                  <input type="number" min="1" className="field-input" value={validade}
                    onChange={e => setValidade(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="field-label">Observações</label>
                <textarea className="field-input resize-none h-14" value={obs} onChange={e => setObs(e.target.value)}
                  placeholder="Condições de pagamento, prazo de produção..." />
              </div>

              {itens.length > 0 && (
                <div className="bg-rose-light/30 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-dark">Total</span>
                  <span className="font-heading font-bold text-xl text-rose">{fmt(total)}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button onClick={copiar} className="flex-1 flex items-center justify-center gap-2 border-2 border-rose-light hover:border-rose text-rose font-semibold text-sm py-3 rounded-xl transition">
                <Copy size={15} /> Copiar texto
              </button>
              <button onClick={enviarWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-3 rounded-xl transition">
                <MessageCircle size={15} /> Enviar WhatsApp
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-rose-light/60 p-5">
            <h2 className="font-heading font-semibold text-dark text-sm mb-4">Preview da mensagem</h2>
            {preview ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <pre className="text-xs text-dark whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
              </div>
            ) : (
              <div className="border-2 border-dashed border-rose-light rounded-xl p-10 text-center text-xs text-muted">
                Adicione itens para ver a prévia da mensagem aqui
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#7A6860;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #FAEDEF;border-radius:10px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#E8A0AE;box-shadow:0 0 0 3px rgba(196,86,106,.08)}
      `}</style>
    </>
  );
}
