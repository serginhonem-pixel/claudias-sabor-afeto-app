"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { getClientes, saveCliente, deleteCliente } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, MessageCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { Cliente } from "@/types";

const EMPTY: Omit<Cliente, "id" | "contaId" | "createdAt"> = {
  nome: "", whatsapp: "", instagram: "", bairro: "", comoEncontrou: "", restricoes: "",
};

const COMO_ENCONTROU = ["Instagram", "WhatsApp", "Indicação", "Facebook", "Google", "Outro"];

export default function ClientesPage() {
  const { conta } = useConta();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!conta) return;
    getClientes(conta.id).then(setClientes);
  }
  useEffect(load, [conta]);

  function openNew() {
    setEditando(null);
    setForm({ ...EMPTY });
    setModal(true);
  }

  function openEdit(c: Cliente) {
    setEditando(c);
    setForm({
      nome: c.nome, whatsapp: c.whatsapp, instagram: c.instagram ?? "",
      bairro: c.bairro ?? "", comoEncontrou: c.comoEncontrou ?? "", restricoes: c.restricoes ?? "",
    });
    setModal(true);
  }

  async function handleSave() {
    if (!conta) return;
    if (!form.nome.trim()) { toast.error("Informe o nome"); return; }
    if (!form.whatsapp.trim()) { toast.error("Informe o WhatsApp"); return; }
    setSaving(true);
    try {
      await saveCliente(conta.id, { ...form, nome: form.nome.trim(), createdAt: editando?.createdAt ?? new Date() }, editando?.id);
      toast.success(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
      setModal(false);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir cliente?")) return;
    await deleteCliente(conta.id, id);
    toast.success("Cliente removido");
    load();
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca)
  );

  return (
    <>
      <Topbar title="Clientes" actions={
        <button onClick={openNew} className="flex items-center gap-1.5 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Cadastrar
        </button>
      } />

      <div className="p-4 md:p-6 max-w-4xl">
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full border border-rose-light rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-rose-mid transition bg-white"
            placeholder="Buscar por nome ou WhatsApp..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-rose-light p-10 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-muted text-sm mb-4">
              {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
            </p>
            {!busca && (
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-rose-DEFAULT hover:bg-rose-DEFAULT/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                <Plus size={14} /> Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-rose-light/60 overflow-hidden">
            <div className="divide-y divide-rose-light/40">
              {filtrados.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-cream/50 transition">
                  <div className="w-9 h-9 rounded-full bg-rose-light flex items-center justify-center shrink-0">
                    <span className="text-rose-DEFAULT font-semibold text-sm">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark text-sm">{c.nome}</p>
                    <p className="text-xs text-muted">{c.whatsapp}{c.bairro ? ` · ${c.bairro}` : ""}</p>
                    {c.restricoes && (
                      <p className="text-[0.65rem] text-amber-600 mt-0.5">⚠️ {c.restricoes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition" title="WhatsApp">
                      <MessageCircle size={14} />
                    </a>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-rose-light text-muted hover:text-rose-DEFAULT transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={openNew} className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted hover:text-rose-DEFAULT hover:bg-cream/50 transition font-medium">
                <Plus size={13} /> Adicionar cliente
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted mt-3 text-center">{clientes.length} cliente{clientes.length !== 1 ? "s" : ""} cadastrado{clientes.length !== 1 ? "s" : ""}</p>
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-[60] flex items-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition hover:scale-105 active:scale-95"
      >
        <Plus size={18} /> Novo Cliente
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Cliente" : "Cadastrar Cliente"}>
        <div className="space-y-3">
          <div>
            <label className="field-label">Nome *</label>
            <input className="field-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">WhatsApp *</label>
              <input className="field-input" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="field-label">Instagram</label>
              <input className="field-input" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
            </div>
            <div>
              <label className="field-label">Bairro</label>
              <input className="field-input" value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} placeholder="Ex: Moema" />
            </div>
            <div>
              <label className="field-label">Como encontrou?</label>
              <select className="field-input" value={form.comoEncontrou} onChange={e => setForm(f => ({ ...f, comoEncontrou: e.target.value }))}>
                <option value="">— Selecione —</option>
                {COMO_ENCONTROU.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Restrições alimentares</label>
            <input className="field-input" value={form.restricoes} onChange={e => setForm(f => ({ ...f, restricoes: e.target.value }))} placeholder="Ex: sem glúten, alérgico a amendoim..." />
          </div>
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
