"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getInsumos, saveInsumo, deleteInsumo } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { Insumo } from "@/types";

const CATS = ["Farinhas", "Açúcares", "Laticínios", "Ovos", "Gorduras", "Chocolates", "Frutas", "Embalagens", "Outros"];
const UNIDADES = ["g", "kg", "ml", "L", "un", "cx", "pct"];

const EMPTY: Omit<Insumo, "id" | "contaId"> = {
  nome: "", categoria: "Farinhas", unidade: "g", estoque: 0,
  estoqueMinimo: 0, custoPorUnidade: 0, fornecedor: "", ativo: true,
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EstoquePage() {
  const { conta } = useConta();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!conta) return;
    getInsumos(conta.id).then(setInsumos);
  }
  useEffect(load, [conta]);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY });
    setModal(true);
  }

  function openEdit(i: Insumo) {
    setEditando(i);
    setForm({ ...i });
    setModal(true);
  }

  async function handleSave() {
    if (!conta) return;
    if (!form.nome.trim()) { toast.error("Informe o nome do insumo"); return; }
    setSaving(true);
    try {
      await saveInsumo(conta.id, { ...form, nome: form.nome.trim() }, editando?.id);
      toast.success(editando ? "Insumo atualizado!" : "Insumo cadastrado!");
      setModal(false);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir insumo?")) return;
    await deleteInsumo(conta.id, id);
    toast.success("Insumo removido");
    load();
  }

  const filtrados = filtro === "todos" ? insumos : insumos.filter(i => i.categoria === filtro);
  const abaixoMinimo = insumos.filter(i => i.estoque <= i.estoqueMinimo && i.estoqueMinimo > 0);

  return (
    <>
      <Topbar title="Estoque de Insumos" actions={
        <button onClick={openNew} className="flex items-center gap-1.5 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Cadastrar
        </button>
      } />

      <div className="p-4 md:p-6 max-w-5xl">
        {abaixoMinimo.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">{abaixoMinimo.length} insumo{abaixoMinimo.length > 1 ? "s" : ""} abaixo do estoque mínimo</p>
              <p className="text-xs text-amber-700">{abaixoMinimo.map(i => i.nome).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {["todos", ...CATS].map(c => (
            <button key={c} onClick={() => setFiltro(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filtro === c ? "bg-rose-DEFAULT text-white border-rose-DEFAULT" : "bg-white text-muted border-rose-light hover:border-rose-mid"}`}>
              {c === "todos" ? "Todos" : c}
            </button>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-rose-light p-10 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-muted text-sm mb-4">
              {filtro === "todos" ? "Nenhum insumo cadastrado ainda." : `Nenhum insumo em "${filtro}".`}
            </p>
            <button onClick={openNew} className="inline-flex items-center gap-2 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              <Plus size={14} /> Cadastrar primeiro insumo
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-2 border-b border-rose-light/40 text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
              <span>Insumo</span><span>Estoque</span><span>Mínimo</span><span>Custo / un.</span><span>Fornecedor</span><span></span>
            </div>
            <div className="divide-y divide-rose-light/40">
              {filtrados.map(i => {
                const baixo = i.estoqueMinimo > 0 && i.estoque <= i.estoqueMinimo;
                return (
                  <div key={i.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-cream/50 transition">
                    <div>
                      <p className="font-semibold text-dark text-sm flex items-center gap-2">
                        {i.nome}
                        {baixo && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[0.65rem] text-muted">{i.categoria}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${baixo ? "text-amber-600" : "text-dark"}`}>
                        {i.estoque} {i.unidade}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted">{i.estoqueMinimo} {i.unidade}</span>
                    </div>
                    <div>
                      <span className="text-sm text-dark">{fmt(i.custoPorUnidade)}<span className="text-muted text-xs">/{i.unidade}</span></span>
                    </div>
                    <div>
                      <span className="text-xs text-muted truncate">{i.fornecedor || "—"}</span>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-rose-light text-muted hover:text-rose-DEFAULT transition">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button onClick={openNew} className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted hover:text-rose-DEFAULT hover:bg-cream/50 transition font-medium border-t border-dashed border-rose-light/60">
                <Plus size={13} /> Adicionar insumo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-[60] flex items-center gap-2 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition hover:scale-105 active:scale-95"
      >
        <Plus size={18} /> Novo Insumo
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Insumo" : "Cadastrar Insumo"}>
        <div className="space-y-3">
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Farinha de Trigo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Categoria</label>
              <select className="field-input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Unidade de medida</label>
              <select className="field-input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Custo por unidade (R$)</label>
              <input type="number" min="0" step="0.001" className="field-input" value={form.custoPorUnidade} onChange={e => setForm(f => ({ ...f, custoPorUnidade: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Estoque atual</label>
              <input type="number" min="0" step="0.01" className="field-input" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Estoque mínimo</label>
              <input type="number" min="0" step="0.01" className="field-input" value={form.estoqueMinimo} onChange={e => setForm(f => ({ ...f, estoqueMinimo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Fornecedor</label>
              <input className="field-input" value={form.fornecedor ?? ""} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Ex: Atacadão" />
            </div>
          </div>

          {form.custoPorUnidade > 0 && (
            <div className="bg-rose-light/40 rounded-xl px-4 py-2 text-xs text-muted">
              Custo por {form.unidade}: <strong className="text-dark">{fmt(form.custoPorUnidade)}</strong>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-rose-light/60">
            <button onClick={() => setModal(false)} className="flex-1 border border-rose-light text-muted text-sm py-2.5 rounded-xl hover:bg-rose-light/30 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
              {saving ? "Salvando..." : "Salvar"}
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
