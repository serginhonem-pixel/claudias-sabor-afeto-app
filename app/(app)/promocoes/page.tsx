"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getPromocoesGrupo, savePromocaoGrupo, deletePromocaoGrupo } from "@/lib/firestore";
import type { GrupoPromocao } from "@/types";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";

export default function PromocoesPage() {
  const { conta } = useConta();
  const [promos, setPromos] = useState<GrupoPromocao[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<GrupoPromocao | null>(null);
  const [form, setForm] = useState<Omit<GrupoPromocao, "id" | "contaId" | "createdAt">>({ tipo: "", quantidade: 2, precoPorUnidade: 0, ativo: true });

  function load() { if (!conta) return; getPromocoesGrupo(conta.id).then(setPromos); }
  useEffect(load, [conta]);

  function openNew() { setEdit(null); setForm({ tipo: "", quantidade: 2, precoPorUnidade: 0, ativo: true }); setModal(true); }
  function openEdit(p: GrupoPromocao) { setEdit(p); setForm({ tipo: p.tipo, quantidade: p.quantidade, precoPorUnidade: p.precoPorUnidade, ativo: p.ativo }); setModal(true); }

  async function handleSave() {
    if (!conta) return;
    if (!form.tipo.trim()) { toast.error("Informe o tipo/grupo"); return; }
    try {
      await savePromocaoGrupo(conta.id, { tipo: form.tipo.trim(), quantidade: Math.max(1, Math.round(form.quantidade)), precoPorUnidade: Number(form.precoPorUnidade), ativo: Boolean(form.ativo) }, edit?.id);
      toast.success("Promoção salva"); setModal(false); load();
    } catch { toast.error("Erro ao salvar"); }
  }

  async function handleDelete(id: string) { if (!conta || !confirm("Excluir promoção?")) return; await deletePromocaoGrupo(conta.id, id); toast.success("Removido"); load(); }

  return (
    <>
      <Topbar title="Promoções por Grupo" actions={<button onClick={openNew} className="bg-[#C4566A] text-white px-3 py-1.5 rounded">Nova</button>} />
      <div className="p-4 max-w-3xl">
        <div className="space-y-2">
          {promos.map(p => (
            <div key={p.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{p.tipo} — {p.quantidade} por {p.precoPorUnidade.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                <div className="text-xs text-muted">{p.ativo ? 'Ativa' : 'Inativa'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-rose">Editar</button>
                <button onClick={() => p.id && handleDelete(p.id)} className="text-red-500">Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? 'Editar promoção' : 'Nova promoção'}>
        <div className="space-y-3">
          <div>
            <label className="field-label">Tipo / Grupo</label>
            <input className="field-input" value={form.tipo} onChange={e => setForm(f=>({...f,tipo:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Quantidade</label>
              <input type="number" min="1" className="field-input" value={form.quantidade} onChange={e => setForm(f=>({...f,quantidade:Number(e.target.value)}))} />
            </div>
            <div>
              <label className="field-label">Preço por unidade (R$)</label>
              <input type="number" min="0" step="0.01" className="field-input" value={form.precoPorUnidade} onChange={e => setForm(f=>({...f,precoPorUnidade:Number(e.target.value)}))} />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.ativo} onChange={e => setForm(f=>({...f,ativo:e.target.checked}))} /> Ativa</label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModal(false)} className="border px-3 py-2 rounded">Cancelar</button>
            <button onClick={handleSave} className="bg-[#C4566A] text-white px-3 py-2 rounded">Salvar</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
