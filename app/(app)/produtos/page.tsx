"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getProdutos, saveProduto, deleteProduto, getReceitas } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Produto, Receita } from "@/types";

const CATS = ["Confeitaria","Salgado","Panificado","Kit","Outro"] as const;
const EMPTY: Omit<Produto,"id"|"contaId"> = {
  nome:"", categoria:"Confeitaria", unidadeVenda:"Unidade", precoVenda:0,
  custoProduto:0, cmvPercent:0, descricao:"", prazoProduzDias:1, status:"ativo", createdAt: new Date(),
};

function fmt(v: number) { return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function ProdutosPage() {
  const { conta } = useConta();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [saving, setSaving] = useState(false);

  function load() { if (!conta) return; getProdutos(conta.id).then(setProdutos); }
  useEffect(load, [conta]);
  useEffect(() => { if (!conta) return; getReceitas(conta.id).then(setReceitas); }, [conta]);

  function openNew() { setEditando(null); setForm({...EMPTY, createdAt: new Date()}); setModal(true); }
  function openEdit(p: Produto) { setEditando(p); setForm({...p}); setModal(true); }

  function calcCmv(preco: number, custo: number) { return preco > 0 ? Math.round((custo/preco)*100) : 0; }

  function converterCusto(custoPorUnidade: number, unidadeReceita: string, unidadeVenda: string): number {
    const un = unidadeReceita.toLowerCase();
    const venda = unidadeVenda.toLowerCase();
    if (un === "g" && venda === "kg") return custoPorUnidade * 1000;
    if (un === "ml" && venda === "l") return custoPorUnidade * 1000;
    if (un === "kg" && venda === "g") return custoPorUnidade / 1000;
    return custoPorUnidade;
  }

  function arredondar(v: number) { return Math.round(v * 100) / 100; }

  async function handleSave() {
    if (!conta) return;
    if (!form.nome.trim()) { toast.error("Informe o nome"); return; }
    setSaving(true);
    try {
      const cmv = calcCmv(form.precoVenda, form.custoProduto);
      await saveProduto(conta.id, { ...form, nome: form.nome.trim(), cmvPercent: cmv }, editando?.id);
      toast.success(editando ? "Produto atualizado!" : "Produto criado!");
      setModal(false); load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir produto?")) return;
    await deleteProduto(conta.id, id); toast.success("Removido"); load();
  }

  const filtrados = filtro === "todos" ? produtos : produtos.filter(p => p.categoria === filtro);

  const catCls: Record<string,string> = {
    Confeitaria:"bg-rose-light text-rose", Salgado:"bg-amber-50 text-amber-700",
    Panificado:"bg-slate-100 text-slate-600", Kit:"bg-blue-50 text-blue-700", Outro:"bg-slate-100 text-slate-500",
  };

  return (
    <>
      <Topbar title="Produtos" actions={
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#C4566A]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13}/> Cadastrar
        </button>
      }/>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {["todos",...CATS].map(c => (
            <button key={c} onClick={() => setFiltro(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filtro===c?"bg-[#C4566A] text-white border-rose":"bg-white text-muted border-rose-light hover:border-rose-mid"}`}>
              {c === "todos" ? "Todos" : c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-rose-light/60 p-4 hover:border-rose-mid/40 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-dark text-sm">{p.nome}</p>
                  <span className={`text-[0.6rem] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${catCls[p.categoria]}`}>{p.categoria}</span>
                </div>
                <p className="font-heading font-semibold text-lg text-caramel-DEFAULT">{fmt(p.precoVenda)}</p>
              </div>
              {p.descricao && <p className="text-xs text-muted mb-2 truncate">{p.descricao}</p>}
              <div className="flex items-center justify-between text-xs text-muted border-t border-rose-light/40 pt-2 mt-2">
                <span>CMV: <strong className={p.cmvPercent > 35 ? "text-amber-600" : "text-emerald-600"}>{p.cmvPercent}%</strong></span>
                <span>Prazo: {p.prazoProduzDias}d</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1 hover:bg-rose-light rounded text-muted hover:text-rose transition"><Pencil size={12}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded text-muted hover:text-red-500 transition"><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={openNew} className="bg-white rounded-xl border-2 border-dashed border-rose-light hover:border-rose-mid flex flex-col items-center justify-center gap-2 p-6 min-h-[120px] transition text-muted hover:text-rose">
            <Plus size={24}/><span className="text-xs font-medium">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-[60] flex items-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition hover:scale-105 active:scale-95"
      >
        <Plus size={18} /> Novo Produto
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Produto" : "Cadastrar Produto"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Bolo de Brigadeiro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Categoria</label>
              <select className="field-input" value={form.categoria} onChange={e => setForm(f=>({...f,categoria:e.target.value as Produto["categoria"]}))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Unidade de Venda</label>
              <select className="field-input" value={form.unidadeVenda} onChange={e => {
                const novaUnidade = e.target.value;
                const receitaVinculada = receitas.find(r => r.id === form.receitaId);
                const novoCusto = receitaVinculada
                  ? arredondar(converterCusto(receitaVinculada.custoPorUnidade, receitaVinculada.unidadeRendimento, novaUnidade))
                  : form.custoProduto;
                setForm(f => ({ ...f, unidadeVenda: novaUnidade, custoProduto: novoCusto }));
              }}>
                {["Unidade","Kit 10un","Kit 20un","Kit 30un","Kit 50un","Caixa","Porção","Kg"].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Preço de Venda (R$)</label>
              <input type="number" min="0" step="0.01" className="field-input" value={form.precoVenda} onChange={e => setForm(f=>({...f,precoVenda:Number(e.target.value)}))} />
            </div>
            <div>
              <label className="field-label">Custo do Produto (R$)</label>
              <input type="number" min="0" step="0.01" className="field-input" value={arredondar(form.custoProduto)} onChange={e => setForm(f=>({...f,custoProduto:Number(e.target.value)}))} />
              {form.receitaId && (() => {
                const r = receitas.find(r => r.id === form.receitaId);
                if (!r) return null;
                return <p className="text-[0.65rem] text-muted mt-1">Calculado da receita · {fmt(r.custoPorUnidade)}/{r.unidadeRendimento}</p>;
              })()}
            </div>
          </div>
          {form.precoVenda > 0 && (
            <div className={`rounded-xl px-4 py-2 text-xs font-semibold flex justify-between ${calcCmv(form.precoVenda,form.custoProduto) > 35 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              <span>CMV</span><span>{calcCmv(form.precoVenda,form.custoProduto)}% — Margem: {fmt(form.precoVenda - form.custoProduto)}</span>
            </div>
          )}
          <div>
            <label className="field-label">Receita Vinculada</label>
            <select className="field-input" value={form.receitaId ?? ""} onChange={e => {
              const r = receitas.find(r => r.id === e.target.value);
              const custo = r ? arredondar(converterCusto(r.custoPorUnidade, r.unidadeRendimento, form.unidadeVenda)) : form.custoProduto;
              setForm(f => ({ ...f, receitaId: e.target.value || undefined, receitaNome: r?.nome, custoProduto: custo }));
            }}>
              <option value="">— Selecione —</option>
              {receitas.map(r => <option key={r.id} value={r.id}>{r.nome} (custo: {fmt(r.custoPorUnidade)}/{r.unidadeRendimento})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Prazo de Produção (dias)</label>
              <input type="number" min="0" className="field-input" value={form.prazoProduzDias} onChange={e => setForm(f=>({...f,prazoProduzDias:Number(e.target.value)}))} />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as Produto["status"]}))}>
                <option value="ativo">Ativo</option><option value="encomenda">Sob Encomenda</option><option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Descrição para catálogo</label>
            <textarea className="field-input resize-none h-14" value={form.descricao} onChange={e => setForm(f=>({...f,descricao:e.target.value}))} placeholder="Descrição para o catálogo..." />
          </div>
          <div>
            <label className="field-label">URL da foto (opcional)</label>
            <input className="field-input" value={form.imagemUrl ?? ""} onChange={e => setForm(f=>({...f,imagemUrl:e.target.value}))} placeholder="https://..." />
            {form.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imagemUrl} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl border border-rose-light" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-rose-light/60">
            <button onClick={() => setModal(false)} className="flex-1 border border-rose-light text-muted text-sm py-2.5 rounded-xl hover:bg-rose-light/30 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#C4566A] hover:bg-[#C4566A]/90 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
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
