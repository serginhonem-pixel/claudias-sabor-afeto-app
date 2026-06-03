"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { updateConta } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Save, Link2, Copy, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import type { CustoFixo } from "@/types";

export default function ConfigPage() {
  const { conta } = useConta();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [savingCustos, setSavingCustos] = useState(false);

  useEffect(() => {
    if (!conta) return;
    setNome(conta.nome ?? "");
    setTelefone(conta.telefone ?? "");
    setInstagram(conta.instagram ?? "");
    setCustosFixos(conta.custosFixos ?? []);
  }, [conta]);

  function addCustoFixo() {
    setCustosFixos(prev => [...prev, { id: crypto.randomUUID(), nome: "", valor: 0 }]);
  }

  function updateCustoFixo(id: string, field: "nome" | "valor", value: string | number) {
    setCustosFixos(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function removeCustoFixo(id: string) {
    setCustosFixos(prev => prev.filter(c => c.id !== id));
  }

  async function handleSaveCustos() {
    if (!conta) { toast.error("Conta não carregada"); return; }
    const validos = custosFixos.filter(c => c.nome.trim());
    setSavingCustos(true);
    try {
      await updateConta(conta.id, { custosFixos: validos });
      toast.success("Custos fixos salvos!");
    } catch (e) {
      console.error("Erro ao salvar custos fixos:", e);
      toast.error("Erro ao salvar: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSavingCustos(false); }
  }

  async function handleSave() {
    if (!conta) return;
    if (!nome.trim()) { toast.error("Informe o nome do negócio"); return; }
    setSaving(true);
    try {
      await updateConta(conta.id, { nome: nome.trim(), telefone, instagram });
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Topbar title="Configurações" />

      <div className="p-4 md:p-6 max-w-xl space-y-6">

        {/* Dados do negócio */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-4">Dados do Negócio</h2>
          <div className="space-y-3">
            <div>
              <label className="field-label">Nome do negócio</label>
              <input className="field-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Claudia's Sabor e Afeto" />
            </div>
            <div>
              <label className="field-label">WhatsApp / Telefone</label>
              <input className="field-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="field-label">Instagram</label>
              <input className="field-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@claudias.sabor" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        {/* Custos Fixos */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-heading font-semibold text-dark text-sm">Custos Fixos Mensais</h2>
            <button onClick={addCustoFixo} className="flex items-center gap-1 text-xs text-rose font-semibold hover:underline">
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <p className="text-xs text-muted mb-4">Aluguel, luz, gás, internet, mão de obra... Serão somados ao custo total na página de Custos & CMV.</p>

          {custosFixos.length === 0 ? (
            <button onClick={addCustoFixo}
              className="w-full border-2 border-dashed border-rose-light hover:border-rose-mid rounded-xl py-6 flex flex-col items-center gap-1.5 text-muted hover:text-rose transition text-xs font-medium">
              <Plus size={20} />
              Nenhum custo fixo cadastrado ainda
            </button>
          ) : (
            <div className="space-y-2 mb-4">
              {custosFixos.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    className="field-input min-w-0 flex-1"
                    style={{ width: "auto" }}
                    value={c.nome}
                    onChange={e => updateCustoFixo(c.id, "nome", e.target.value)}
                    placeholder="Ex: Aluguel, Luz, Gás..."
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="field-input shrink-0 w-28 text-right"
                    style={{ width: "7rem" }}
                    value={c.valor || ""}
                    placeholder="0,00"
                    onChange={e => updateCustoFixo(c.id, "valor", Number(e.target.value))}
                  />
                  <button onClick={() => removeCustoFixo(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted hover:text-red-500 transition shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-rose-light/40 text-xs">
                <span className="text-muted font-medium">Total mensal</span>
                <span className="font-bold text-dark">
                  {custosFixos.reduce((s, c) => s + (c.valor || 0), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
          )}

          {custosFixos.length > 0 && (
            <button onClick={handleSaveCustos} disabled={savingCustos}
              className="w-full flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
              <Save size={14} />
              {savingCustos ? "Salvando..." : "Salvar Custos Fixos"}
            </button>
          )}
        </div>

        {/* Link de pedidos para clientes */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <Link2 size={18} className="text-rose mt-0.5 shrink-0" />
            <div>
              <h2 className="font-heading font-semibold text-dark text-sm">Link de Pedidos</h2>
              <p className="text-xs text-muted mt-1">
                Compartilhe esse link com seus clientes para que eles façam pedidos direto pelo celular.
              </p>
            </div>
          </div>
          {conta && (
            <>
              <div className="bg-rose-light/30 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
                <span className="text-xs text-dark font-mono flex-1 truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://claudias-sabor-afeto-app.vercel.app"}/c/{conta.id}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/c/${conta.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copiado!");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 border border-rose-light hover:bg-rose-light/30 text-muted text-sm font-medium py-2 rounded-xl transition"
                >
                  <Copy size={13} /> Copiar link
                </button>
                <a
                  href={`/c/${conta.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold py-2 rounded-xl transition"
                >
                  <Link2 size={13} /> Ver cardápio
                </a>
              </div>
            </>
          )}
        </div>


        {/* Sobre o app */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-3">Sobre o App</h2>
          <div className="space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Versão</span><span className="font-medium text-dark">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Banco de dados</span><span className="font-medium text-dark">Firebase Firestore</span>
            </div>
            <div className="flex justify-between">
              <span>ID da conta</span><span className="font-mono text-[0.65rem] text-dark">{conta?.id ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Guia de CMV */}
        <div className="bg-rose-light/30 rounded-xl border border-rose-light p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-2">📊 Referência de CMV</h2>
          <div className="space-y-1.5 text-xs text-muted">
            <p><strong className="text-emerald-600">≤ 25%</strong> — Excelente. Alta margem de contribuição.</p>
            <p><strong className="text-amber-600">26–35%</strong> — Aceitável para confeitaria artesanal.</p>
            <p><strong className="text-red-500">&gt; 35%</strong> — Atenção! Revise o preço ou reduza custos.</p>
          </div>
          <p className="text-xs text-muted mt-3">
            Para melhorar a precisão dos custos, cadastre os insumos em <strong className="text-dark">Estoque</strong>,
            crie as fichas técnicas em <strong className="text-dark">Receitas</strong> e vincule aos produtos.
          </p>
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
