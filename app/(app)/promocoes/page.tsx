"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPromocoesGrupo, savePromocaoGrupo, deletePromocaoGrupo, getProdutos } from "@/lib/firestore";
import type { GrupoPromocao } from "@/types";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PromocoesPage() {
  const { conta } = useConta();
  const [promos, setPromos] = useState<GrupoPromocao[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<GrupoPromocao | null>(null);
  const [form, setForm] = useState<Omit<GrupoPromocao, "id" | "contaId" | "createdAt">>({
    tipo: "", quantidade: 2, precoPorUnidade: 0, ativo: true,
  });

  function load() {
    if (!conta) return;
    Promise.all([getPromocoesGrupo(conta.id), getProdutos(conta.id)]).then(([ps, produtos]) => {
      setPromos(ps);
      setTipos(Array.from(new Set(produtos.map(p => p.tipo).filter(Boolean) as string[])));
    });
  }
  useEffect(load, [conta]);

  function openNew() {
    setEdit(null);
    setForm({ tipo: "", quantidade: 2, precoPorUnidade: 0, ativo: true });
    setModal(true);
  }
  function openEdit(p: GrupoPromocao) {
    setEdit(p);
    setForm({ tipo: p.tipo, quantidade: p.quantidade, precoPorUnidade: p.precoPorUnidade, ativo: p.ativo });
    setModal(true);
  }

  async function handleSave() {
    if (!conta) return;
    if (!form.tipo.trim()) { toast.error("Selecione o grupo"); return; }
    if (form.quantidade < 1) { toast.error("Quantidade mínima é 1"); return; }
    if (form.precoPorUnidade <= 0) { toast.error("Informe o preço promocional"); return; }
    try {
      await savePromocaoGrupo(conta.id, {
        tipo: form.tipo.trim(),
        quantidade: Math.max(1, Math.round(form.quantidade)),
        precoPorUnidade: Number(form.precoPorUnidade),
        ativo: Boolean(form.ativo),
      }, edit?.id);
      toast.success("Promoção salva!");
      setModal(false);
      load();
    } catch { toast.error("Erro ao salvar"); }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir esta promoção?")) return;
    await deletePromocaoGrupo(conta.id, id);
    toast.success("Promoção removida");
    load();
  }

  async function handleToggle(p: GrupoPromocao) {
    if (!conta || !p.id) return;
    await savePromocaoGrupo(conta.id, { tipo: p.tipo, quantidade: p.quantidade, precoPorUnidade: p.precoPorUnidade, ativo: !p.ativo }, p.id);
    load();
  }

  const previewOk = form.tipo && form.quantidade >= 1 && form.precoPorUnidade > 0;

  return (
    <>
      <Topbar title="Promoções" actions={
        <button onClick={openNew}
          className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#b04d60] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Nova promoção
        </button>
      } />

      <div className="p-4 md:p-6 max-w-2xl space-y-3">

        <p className="text-xs text-muted leading-relaxed">
          Defina descontos por grupo de produtos. A cada <strong className="text-dark">N unidades</strong> do mesmo grupo no carrinho, o preço unitário cai. Unidades além do múltiplo pagam o preço normal.
        </p>

        {promos.length === 0 ? (
          <button onClick={openNew}
            className="w-full border-2 border-dashed border-rose-light hover:border-rose-mid rounded-xl py-10 flex flex-col items-center gap-2 text-muted hover:text-rose transition text-xs font-medium">
            <Plus size={22} />
            Nenhuma promoção cadastrada ainda
          </button>
        ) : (
          <div className="space-y-2">
            {promos.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 transition ${p.ativo ? "border-rose-light/60" : "border-slate-100 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-dark tracking-wide uppercase">{p.tipo}</span>
                      <span className={`text-[0.6rem] font-semibold px-2 py-0.5 rounded-full ${p.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {p.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <p className="text-sm text-dark mt-1.5">
                      A cada <strong>{p.quantidade}</strong> unidades → <strong className="text-[#C4566A]">{fmt(p.precoPorUnidade)}/un</strong>
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Ex: {p.quantidade} un = {fmt(p.quantidade * p.precoPorUnidade)} · {p.quantidade + 1} un = {fmt(p.quantidade * p.precoPorUnidade)} + 1 no preço normal
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggle(p)} className="p-1.5 hover:bg-slate-50 rounded-lg text-muted transition" title={p.ativo ? "Desativar" : "Ativar"}>
                      {p.ativo ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-rose-light rounded-lg text-muted hover:text-rose transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => p.id && handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted hover:text-red-500 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? "Editar promoção" : "Nova promoção"}>
        <div className="space-y-4">

          <div>
            <label className="field-label">Grupo de produtos *</label>
            {tipos.length > 0 ? (
              <select className="field-input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Selecione o grupo...</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input className="field-input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Ex: FATIAS" />
            )}
            <p className="text-xs text-muted mt-1">Deve ser igual ao campo "Tipo / Grupo" dos produtos.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">A cada quantas unidades *</label>
              <input
                type="number" min="1" className="field-input"
                value={form.quantidade}
                onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted mt-1">O desconto ativa em múltiplos desse número.</p>
            </div>
            <div>
              <label className="field-label">Preço promocional / unidade *</label>
              <input
                type="number" min="0" step="0.01" className="field-input"
                value={form.precoPorUnidade || ""}
                placeholder="0,00"
                onChange={e => setForm(f => ({ ...f, precoPorUnidade: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted mt-1">Preço por unidade dentro do lote.</p>
            </div>
          </div>

          {previewOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-800">Como vai aparecer para o cliente</p>
              {[1, form.quantidade, form.quantidade + 1, form.quantidade * 2].map(q => {
                const lotes = Math.floor(q / form.quantidade);
                const resto = q % form.quantidade;
                const total = lotes * form.quantidade * form.precoPorUnidade;
                return (
                  <div key={q} className="flex justify-between text-xs text-amber-900">
                    <span>{q} un</span>
                    <span>
                      {lotes > 0 ? `${lotes * form.quantidade}×${fmt(form.precoPorUnidade)}` : ""}
                      {lotes > 0 && resto > 0 ? " + " : ""}
                      {resto > 0 ? `${resto}× preço normal` : ""}
                      {lotes === 0 ? "preço normal" : ""}
                    </span>
                    <strong>{lotes > 0 ? `${fmt(total)} + resto` : "—"}</strong>
                  </div>
                );
              })}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-dark cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
            Promoção ativa
          </label>

          <div className="flex gap-2 pt-2 border-t border-rose-light/60">
            <button onClick={() => setModal(false)}
              className="flex-1 border border-rose-light text-muted text-sm py-2.5 rounded-xl hover:bg-rose-light/30 transition font-medium">
              Cancelar
            </button>
            <button onClick={handleSave}
              className="flex-1 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm py-2.5 rounded-xl transition font-semibold">
              Salvar
            </button>
          </div>
        </div>

        <style jsx global>{`
          .field-label{display:block;font-size:.7rem;font-weight:600;color:#7A6860;margin-bottom:.35rem}
          .field-input{width:100%;border:1px solid #FAEDEF;border-radius:10px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
          .field-input:focus{border-color:#E8A0AE;box-shadow:0 0 0 3px rgba(196,86,106,.08)}
        `}</style>
      </Modal>
    </>
  );
}
