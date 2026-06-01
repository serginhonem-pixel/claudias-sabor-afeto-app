"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getReceitas, saveReceita, deleteReceita, getInsumos } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Receita, Insumo, IngredienteReceita } from "@/types";

const CATS = ["Confeitaria", "Salgado", "Panificado", "Outro"] as const;

const EMPTY_RECEITA: Omit<Receita, "id" | "contaId"> = {
  nome: "",
  categoria: "Confeitaria",
  rendimento: 1,
  unidadeRendimento: "Unidade",
  tempoPreparo: "",
  modoPreparo: "",
  ingredientes: [],
  custoTotal: 0,
  custoPorUnidade: 0,
  ativo: true,
  createdAt: new Date(),
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface IngredienteComCusto extends IngredienteReceita {
  custoPorUnidade: number;
}

export default function ReceitasPage() {
  const { conta } = useConta();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_RECEITA });
  const [ingredientes, setIngredientes] = useState<IngredienteComCusto[]>([]);
  const [insumoSel, setInsumoSel] = useState("");
  const [qtdSel, setQtdSel] = useState(1);

  function load() {
    if (!conta) return;
    getReceitas(conta.id).then(setReceitas);
  }
  useEffect(load, [conta]);
  useEffect(() => {
    if (!conta) return;
    getInsumos(conta.id).then(setInsumos);
  }, [conta]);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY_RECEITA, createdAt: new Date() });
    setIngredientes([]);
    setInsumoSel("");
    setQtdSel(1);
    setModal(true);
  }

  function openEdit(r: Receita) {
    setEditando(r);
    setForm({ ...r });
    const ings: IngredienteComCusto[] = r.ingredientes.map(i => {
      const ins = insumos.find(ins => ins.id === i.insumoId);
      return { ...i, custoPorUnidade: ins?.custoPorUnidade ?? 0 };
    });
    setIngredientes(ings);
    setInsumoSel("");
    setQtdSel(1);
    setModal(true);
  }

  function addIngrediente() {
    const ins = insumos.find(i => i.id === insumoSel);
    if (!ins) { toast.error("Selecione um insumo"); return; }
    if (qtdSel <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }
    if (ingredientes.find(i => i.insumoId === ins.id)) {
      toast.error("Insumo já adicionado"); return;
    }
    setIngredientes(prev => [...prev, {
      insumoId: ins.id,
      insumoNome: ins.nome,
      quantidade: qtdSel,
      unidade: ins.unidade,
      custoPorUnidade: ins.custoPorUnidade,
    }]);
    setInsumoSel("");
    setQtdSel(1);
  }

  function removeIngrediente(insumoId: string) {
    setIngredientes(prev => prev.filter(i => i.insumoId !== insumoId));
  }

  function updateQtd(insumoId: string, qtd: number) {
    setIngredientes(prev => prev.map(i => i.insumoId === insumoId ? { ...i, quantidade: qtd } : i));
  }

  const custoTotal = ingredientes.reduce((s, i) => s + i.quantidade * i.custoPorUnidade, 0);
  const custoPorUnidade = form.rendimento > 0 ? custoTotal / form.rendimento : 0;

  async function handleSave() {
    if (!conta) return;
    if (!form.nome.trim()) { toast.error("Informe o nome da receita"); return; }
    if (ingredientes.length === 0) { toast.error("Adicione pelo menos um ingrediente"); return; }
    setSaving(true);
    try {
      const payload: Omit<Receita, "id" | "contaId"> = {
        ...form,
        nome: form.nome.trim(),
        ingredientes: ingredientes.map(({ insumoId, insumoNome, quantidade, unidade }) => ({
          insumoId, insumoNome, quantidade, unidade,
        })),
        custoTotal,
        custoPorUnidade,
      };
      await saveReceita(conta.id, payload, editando?.id);
      toast.success(editando ? "Receita atualizada!" : "Receita criada!");
      setModal(false);
      load();
    } catch { toast.error("Erro ao salvar receita"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir receita?")) return;
    await deleteReceita(conta.id, id);
    toast.success("Receita removida");
    load();
  }

  const filtradas = filtro === "todos" ? receitas : receitas.filter(r => r.categoria === filtro);

  const catCls: Record<string, string> = {
    Confeitaria: "bg-rose-light text-rose",
    Salgado: "bg-amber-50 text-amber-700",
    Panificado: "bg-slate-100 text-slate-600",
    Outro: "bg-slate-100 text-slate-500",
  };

  const insumosDisponiveis = insumos.filter(i => !ingredientes.find(ing => ing.insumoId === i.id));

  return (
    <>
      <Topbar title="Receitas" actions={
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#C4566A]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Nova Receita
        </button>
      } />

      <div className="p-4 md:p-6 max-w-5xl">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {["todos", ...CATS].map(c => (
            <button key={c} onClick={() => setFiltro(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filtro === c ? "bg-[#C4566A] text-white border-rose" : "bg-white text-muted border-rose-light hover:border-rose-mid"}`}>
              {c === "todos" ? "Todas" : c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-rose-light/60 p-4 hover:border-rose-mid/40 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-dark text-sm truncate">{r.nome}</p>
                  <span className={`text-[0.6rem] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${catCls[r.categoria]}`}>{r.categoria}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-semibold text-base text-caramel-DEFAULT">{fmt(r.custoPorUnidade)}</p>
                  <p className="text-[0.6rem] text-muted">por unidade</p>
                </div>
              </div>

              <div className="text-xs text-muted space-y-0.5 mb-3">
                <p>{r.ingredientes.length} ingrediente{r.ingredientes.length !== 1 ? "s" : ""} · Rendimento: {r.rendimento} {r.unidadeRendimento}</p>
                <p>Custo total: <strong className="text-dark">{fmt(r.custoTotal)}</strong></p>
                {r.tempoPreparo && <p>Tempo: {r.tempoPreparo}</p>}
              </div>

              <div className="flex items-center justify-between border-t border-rose-light/40 pt-2">
                <div className="flex gap-1 flex-wrap">
                  {r.ingredientes.slice(0, 3).map(i => (
                    <span key={i.insumoId} className="text-[0.6rem] bg-rose-light text-rose px-1.5 py-0.5 rounded-full">{i.insumoNome}</span>
                  ))}
                  {r.ingredientes.length > 3 && (
                    <span className="text-[0.6rem] text-muted px-1.5 py-0.5">+{r.ingredientes.length - 3}</span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(r)} className="p-1 hover:bg-rose-light rounded text-muted hover:text-rose transition"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-red-50 rounded text-muted hover:text-red-500 transition"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={openNew} className="bg-white rounded-xl border-2 border-dashed border-rose-light hover:border-rose-mid flex flex-col items-center justify-center gap-2 p-6 min-h-[140px] transition text-muted hover:text-rose">
            <Plus size={24} /><span className="text-xs font-medium">Nova Receita</span>
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-[60] flex items-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition hover:scale-105 active:scale-95"
      >
        <Plus size={18} /> Nova Receita
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Receita" : "Nova Receita"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="field-label">Nome da Receita *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Bolo de Brigadeiro 1kg" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Categoria</label>
              <select className="field-input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Receita["categoria"] }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Tempo de Preparo</label>
              <input className="field-input" value={form.tempoPreparo ?? ""} onChange={e => setForm(f => ({ ...f, tempoPreparo: e.target.value }))} placeholder="Ex: 2h30min" />
            </div>
            <div>
              <label className="field-label">Rendimento</label>
              <input type="number" min="1" className="field-input" value={form.rendimento} onChange={e => setForm(f => ({ ...f, rendimento: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Unidade do Rendimento</label>
              <select className="field-input" value={form.unidadeRendimento} onChange={e => setForm(f => ({ ...f, unidadeRendimento: e.target.value }))}>
                {["Unidade", "Porção", "Fatia", "Kg", "g", "L", "ml"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <label className="field-label">Ingredientes *</label>
            <div className="border border-rose-light/60 rounded-xl overflow-hidden">
              {ingredientes.length > 0 && (
                <div className="divide-y divide-rose-light/40">
                  {ingredientes.map(ing => (
                    <div key={ing.insumoId} className="flex items-center gap-2 px-3 py-2">
                      <span className="flex-1 text-xs text-dark font-medium truncate">{ing.insumoNome}</span>
                      <input
                        type="number" min="0.01" step="0.01"
                        className="w-20 border border-rose-light rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-rose-mid"
                        value={ing.quantidade}
                        onChange={e => updateQtd(ing.insumoId, Number(e.target.value))}
                      />
                      <span className="text-xs text-muted w-8">{ing.unidade}</span>
                      <span className="text-xs text-muted w-16 text-right">{fmt(ing.quantidade * ing.custoPorUnidade)}</span>
                      <button onClick={() => removeIngrediente(ing.insumoId)} className="p-0.5 hover:bg-red-50 rounded text-muted hover:text-red-500 transition">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-cream/50 border-t border-rose-light/40">
                <select
                  className="flex-1 border border-rose-light rounded-lg px-2 py-1.5 text-xs outline-none focus:border-rose-mid bg-white"
                  value={insumoSel}
                  onChange={e => setInsumoSel(e.target.value)}
                >
                  <option value="">Selecione o insumo...</option>
                  {insumosDisponiveis.map(i => (
                    <option key={i.id} value={i.id}>{i.nome} ({i.unidade}) — {fmt(i.custoPorUnidade)}/{i.unidade}</option>
                  ))}
                </select>
                <input
                  type="number" min="0.01" step="0.01"
                  className="w-20 border border-rose-light rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-rose-mid bg-white"
                  value={qtdSel}
                  onChange={e => setQtdSel(Number(e.target.value))}
                />
                <button onClick={addIngrediente} className="bg-[#C4566A] hover:bg-[#C4566A]/90 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0">
                  + Add
                </button>
              </div>

              {insumos.length === 0 && (
                <p className="text-xs text-muted text-center py-3 px-4">Nenhum insumo cadastrado. Cadastre insumos em <strong>Estoque</strong> primeiro.</p>
              )}
            </div>
          </div>

          {/* Custo calculado */}
          {ingredientes.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-700">Custo total da receita</span>
                <strong className="text-emerald-800">{fmt(custoTotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Custo por {form.unidadeRendimento.toLowerCase()} (rendimento: {form.rendimento})</span>
                <strong className="text-emerald-800">{fmt(custoPorUnidade)}</strong>
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Modo de Preparo</label>
            <textarea className="field-input resize-none h-20" value={form.modoPreparo ?? ""} onChange={e => setForm(f => ({ ...f, modoPreparo: e.target.value }))} placeholder="Descreva o passo a passo..." />
          </div>

          <div className="flex gap-2 pt-2 border-t border-rose-light/60">
            <button onClick={() => setModal(false)} className="flex-1 border border-rose-light text-muted text-sm py-2.5 rounded-xl hover:bg-rose-light/30 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#C4566A] hover:bg-[#C4566A]/90 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
              {saving ? "Salvando..." : "Salvar Receita"}
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
