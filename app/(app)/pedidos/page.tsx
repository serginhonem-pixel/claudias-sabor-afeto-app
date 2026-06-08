"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { listenPedidos, savePedido, deletePedido, getClientes, getProdutos, getProximoNumeroPedido, saveCliente } from "@/lib/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, CheckCircle2, MessageCircle, LayoutList, Columns, Banknote, Eye, Printer } from "lucide-react";
import toast from "react-hot-toast";
import type { Pedido, Cliente, Produto, ItemPedido, StatusPedido } from "@/types";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";

const STATUS: Record<StatusPedido, { label: string; cls: string }> = {
  aguardando: { label: "Aguardando",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  producao:   { label: "Em Produção", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pronto:     { label: "Pronto",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  entregue:   { label: "Entregue",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
  cancelado:  { label: "Cancelado",   cls: "bg-red-50 text-red-500 border-red-200" },
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function PedidosPage() {
  const { conta } = useConta();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState<StatusPedido | "todos">("todos");
  const [vista, setVista] = useState<"lista" | "kanban">("lista");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(e: DragStartEvent) { setDraggingId(e.active.id as string); }
  function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || !conta) return;
    const pedido = pedidos.find(p => p.id === active.id);
    const novoStatus = over.id as StatusPedido;
    if (!pedido || pedido.status === novoStatus) return;
    savePedido(conta.id, { ...pedido, status: novoStatus, updatedAt: new Date() }, pedido.id);
    toast.success(`→ ${STATUS[novoStatus].label}`);
  }
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [saving, setSaving] = useState(false);
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [dataEntrega, setDataEntrega] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [obs, setObs] = useState("");
  const [personalizacao, setPersonalizacao] = useState("");
  const [status, setStatus] = useState<StatusPedido>("aguardando");
  const [desconto, setDesconto] = useState(0);

  function load() { } // mantido para compatibilidade com chamadas após salvar
  useEffect(() => {
    if (!conta) return;
    const unsub = listenPedidos(conta.id, setPedidos);
    return unsub;
  }, [conta]);
  useEffect(() => {
    if (!conta) return;
    getClientes(conta.id).then(setClientes);
    getProdutos(conta.id).then(ps => setProdutos(ps.filter(p => p.status !== "inativo")));
  }, [conta]);

  function openNew() {
    setEditando(null);
    setClienteId(""); setItens([]); setDataEntrega(""); setFormaPagamento("pix");
    setObs(""); setPersonalizacao(""); setStatus("aguardando"); setDesconto(0);
    setModal(true);
  }

  function openEdit(p: Pedido) {
    setEditando(p);
    setClienteId(p.clienteId); setItens(p.itens); setDataEntrega(p.dataEntrega);
    setFormaPagamento(p.formaPagamento); setObs(p.obs ?? ""); setPersonalizacao(p.personalizacao ?? "");
    setStatus(p.status); setDesconto(p.desconto);
    setModal(true);
  }

  function addItem() {
    const prod = produtos[0];
    if (!prod) return;
    setItens(ii => [...ii, { produtoId: prod.id, produtoNome: prod.nome, quantidade: 1, precoUnit: prod.precoVenda, subtotal: prod.precoVenda }]);
  }

  function updateItem(idx: number, produtoId: string, quantidade: number) {
    const prod = produtos.find(p => p.id === produtoId);
    if (!prod) return;
    setItens(ii => ii.map((it, i) => i === idx ? { produtoId, produtoNome: prod.nome, quantidade, precoUnit: prod.precoVenda, subtotal: prod.precoVenda * quantidade } : it));
  }

  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const totalFinal = Math.max(0, total - desconto);
  const clienteSel = clientes.find(c => c.id === clienteId);

  async function handleSave() {
    if (!conta || !clienteSel) { toast.error("Selecione o cliente"); return; }
    if (itens.length === 0) { toast.error("Adicione ao menos um item"); return; }
    if (!dataEntrega) { toast.error("Informe a data de entrega"); return; }
    setSaving(true);
    try {
      const numero = editando?.numero ?? await getProximoNumeroPedido(conta.id);
      await savePedido(conta.id, {
        numero, clienteId: clienteSel.id, clienteNome: clienteSel.nome,
        clienteWhatsapp: clienteSel.whatsapp, itens, total, desconto, totalFinal,
        formaPagamento, dataEntrega, status, obs, personalizacao,
        createdAt: editando?.createdAt ?? new Date(), updatedAt: new Date(),
      }, editando?.id);
      toast.success(editando ? "Pedido atualizado!" : "Pedido criado!");
      setModal(false); load();
    } catch (err) { console.error(err); toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function avancarStatus(p: Pedido) {
    if (!conta) return;
    const prox: Record<StatusPedido, StatusPedido> = { aguardando: "producao", producao: "pronto", pronto: "entregue", entregue: "entregue", cancelado: "cancelado" };
    await savePedido(conta.id, { ...p, status: prox[p.status], updatedAt: new Date() }, p.id);
    toast.success(`Status: ${STATUS[prox[p.status]].label}`);
    load();
  }

  async function togglePago(p: Pedido) {
    if (!conta) return;
    await savePedido(conta.id, { ...p, pago: !p.pago, updatedAt: new Date() }, p.id);
    toast.success(p.pago ? "Marcado como não pago" : "Pagamento confirmado! ✓");
  }

  async function handleCadastrarCliente(pedido: Pedido, enderecoFormatado: string) {
    if (!conta) { toast.error("Conta não carregada"); return; }
    try {
      const dadosCliente: Parameters<typeof saveCliente>[1] = {
        nome: pedido.clienteNome,
        whatsapp: pedido.clienteWhatsapp,
        createdAt: new Date(),
      };
      if (enderecoFormatado) dadosCliente.endereco = enderecoFormatado;
      const novoId = await saveCliente(conta.id, dadosCliente);
      await savePedido(conta.id, { ...pedido, clienteId: novoId, updatedAt: new Date() }, pedido.id);
      const novosClientes = await getClientes(conta.id);
      setClientes(novosClientes);
      setDetalhe(prev => prev ? { ...prev, clienteId: novoId } : prev);
      toast.success("Cliente cadastrado e vinculado ao pedido!");
    } catch (err) {
      console.error("Erro ao cadastrar cliente:", err);
      toast.error("Erro ao cadastrar cliente. Verifique o console.");
    }
  }

  async function handleDelete(id: string) {
    if (!conta || !confirm("Excluir pedido?")) return;
    await deletePedido(conta.id, id);
    toast.success("Removido"); load();
  }

  const filtrados = filtro === "todos" ? pedidos : pedidos.filter(p => p.status === filtro);

  return (
    <>
      <Topbar title="Pedidos" actions={
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#C4566A] hover:bg-[#C4566A]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          <Plus size={13} /> Novo Pedido
        </button>
      } />

      <div className="p-4 md:p-6 max-w-full">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["todos", "aguardando", "producao", "pronto", "entregue", "cancelado"] as const).map(s => {
              const count = s === "todos" ? pedidos.length : pedidos.filter(p => p.status === s).length;
              return (
                <button key={s} onClick={() => setFiltro(s)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filtro === s ? "bg-[#C4566A] text-white border-rose" : "bg-white text-muted border-rose-light hover:border-rose-mid"}`}>
                  {s === "todos" ? "Todos" : STATUS[s].label} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex bg-rose-light/30 rounded-xl p-1 gap-1 shrink-0">
            <button onClick={() => setVista("lista")} title="Lista"
              className={`p-1.5 rounded-lg transition ${vista === "lista" ? "bg-white shadow-sm text-dark" : "text-muted hover:text-dark"}`}>
              <LayoutList size={15} />
            </button>
            <button onClick={() => setVista("kanban")} title="Kanban"
              className={`p-1.5 rounded-lg transition ${vista === "kanban" ? "bg-white shadow-sm text-dark" : "text-muted hover:text-dark"}`}>
              <Columns size={15} />
            </button>
          </div>
        </div>

        {/* ── LISTA ── */}
        {vista === "lista" && (
          <div className="space-y-3 max-w-4xl">
            {filtrados.length === 0 ? (
              <div className="bg-white rounded-xl border border-rose-light/60 p-10 text-center">
                <p className="text-4xl mb-3">🎂</p>
                <p className="text-muted text-sm">Nenhum pedido encontrado.</p>
              </div>
            ) : filtrados.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-rose-light/60 p-4 hover:border-rose-mid/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted">#{p.numero}</span>
                      <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full border ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                      {p.dataEntrega < new Date().toISOString().slice(0,10) && p.status !== "entregue" && p.status !== "cancelado" && (
                        <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Atrasado</span>
                      )}
                    </div>
                    <p className="font-semibold text-dark">{p.clienteNome}</p>
                    <p className="text-xs text-muted truncate">{p.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(", ")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted">📅 {p.dataEntrega} · {p.formaPagamento}</p>
                      {p.pago
                        ? <span className="text-[0.6rem] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-200">Pago ✓</span>
                        : <span className="text-[0.6rem] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">A receber</span>
                      }
                    </div>
                    {p.personalizacao && <p className="text-xs text-caramel-DEFAULT mt-1">✏️ {p.personalizacao}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading font-semibold text-lg text-dark">{fmt(p.totalFinal)}</p>
                    <div className="flex gap-1 mt-2 justify-end">
                      {p.status !== "entregue" && p.status !== "cancelado" && (
                        <button onClick={() => avancarStatus(p)} className="p-1.5 rounded-lg hover:bg-rose-light text-rose transition" title="Avançar status"><CheckCircle2 size={14} /></button>
                      )}
                      <button onClick={() => togglePago(p)} title={p.pago ? "Marcar não pago" : "Confirmar pagamento"}
                        className={`p-1.5 rounded-lg transition ${p.pago ? "bg-emerald-50 text-emerald-600" : "hover:bg-amber-50 text-muted hover:text-amber-600"}`}>
                        <Banknote size={14} />
                      </button>
                      <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition"><MessageCircle size={14} /></a>
                      <button onClick={() => setDetalhe(p)} className="p-1.5 rounded-lg hover:bg-rose-light text-muted hover:text-rose transition" title="Ver detalhes"><Eye size={14} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-rose-light text-muted hover:text-rose transition"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── KANBAN ── */}
        {vista === "kanban" && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex md:grid md:grid-cols-4 gap-3 pb-6 overflow-x-auto md:overflow-visible" style={{ minHeight: "70vh" }}>
              {(["aguardando", "producao", "pronto", "entregue"] as const).map(col => {
                const colCfg = {
                  aguardando: { bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-400",   title: "Aguardando" },
                  producao:   { bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-500",    title: "Em Produção" },
                  pronto:     { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", title: "Pronto 🎉" },
                  entregue:   { bg: "bg-slate-50",   border: "border-slate-200",   dot: "bg-slate-400",   title: "Entregue" },
                }[col];
                const cards = pedidos.filter(p => p.status === col && (filtro === "todos" || filtro === col));
                return (
                  <KanbanColuna key={col} id={col} colCfg={colCfg} count={cards.length}>
                    {cards.map(p => (
                      <KanbanCard key={p.id} pedido={p} isDragging={draggingId === p.id}
                        onAvancar={() => avancarStatus(p)} onEdit={() => openEdit(p)} onView={() => setDetalhe(p)} />
                    ))}
                  </KanbanColuna>
                );
              })}
            </div>
            <DragOverlay>
              {draggingId && (() => {
                const p = pedidos.find(x => x.id === draggingId);
                return p ? <KanbanCard pedido={p} isDragging overlay onAvancar={() => {}} onEdit={() => {}} onView={() => {}} /> : null;
              })()}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-[60] flex items-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl transition hover:scale-105 active:scale-95"
      >
        <Plus size={18} /> Novo Pedido
      </button>

      {detalhe && (
        <ComandaModal
          pedido={detalhe}
          contaNome={conta?.nome ?? ""}
          clientes={clientes}
          onClose={() => setDetalhe(null)}
          onEdit={() => { openEdit(detalhe); setDetalhe(null); }}
          onCadastrarCliente={handleCadastrarCliente}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Pedido" : "Novo Pedido"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="field-label">Cliente *</label>
              <select className="field-input" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.whatsapp}</option>)}
              </select>
              {clienteSel && (clienteSel.endereco || clienteSel.bairro) && (
                <p className="text-[0.65rem] text-muted mt-1.5 bg-rose-light/30 px-3 py-1.5 rounded-lg">
                  📍 {[clienteSel.endereco, clienteSel.numero, clienteSel.complemento, clienteSel.bairro, clienteSel.cidade].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div>
              <label className="field-label">Data de Entrega *</label>
              <input type="date" className="field-input" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Pagamento</label>
              <select className="field-input" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                {["pix","dinheiro","cartao","fiado"].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label mb-0">Itens do Pedido *</label>
              <button type="button" onClick={addItem} className="text-xs text-rose font-semibold hover:underline flex items-center gap-1">
                <Plus size={11} /> Adicionar
              </button>
            </div>
            {itens.length === 0 ? (
              <p className="text-xs text-muted italic">Nenhum item adicionado.</p>
            ) : (
              <div className="space-y-2">
                {itens.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_80px_20px] gap-2 items-center">
                    <select className="field-input" value={item.produtoId} onChange={e => updateItem(i, e.target.value, item.quantidade)}>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                    <input type="number" min="1" className="field-input" value={item.quantidade}
                      onChange={e => updateItem(i, item.produtoId, Number(e.target.value))} />
                    <span className="text-xs text-right font-semibold text-dark">{fmt(item.subtotal)}</span>
                    <button type="button" onClick={() => setItens(ii => ii.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500 transition">
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
              <input type="number" min="0" step="0.01" className="field-input" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={status} onChange={e => setStatus(e.target.value as StatusPedido)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Personalização / Mensagem no bolo</label>
            <input className="field-input" value={personalizacao} onChange={e => setPersonalizacao(e.target.value)} placeholder="Ex: Feliz aniversário João!" />
          </div>
          <div>
            <label className="field-label">Observações internas</label>
            <textarea className="field-input resize-none h-14" value={obs} onChange={e => setObs(e.target.value)} placeholder="Notas internas..." />
          </div>

          {total > 0 && (
            <div className="bg-rose-light/50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-muted">Total Final</span>
              <span className="font-heading font-bold text-xl text-rose">{fmt(totalFinal)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-rose-light/60">
            <button onClick={() => setModal(false)} className="flex-1 border border-rose-light text-muted text-sm py-2.5 rounded-xl hover:bg-rose-light/30 transition font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#C4566A] hover:bg-[#C4566A]/90 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
              {saving ? "Salvando..." : "Salvar Pedido"}
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

// ── Componentes Kanban ─────────────────────────────────────────────────────

function KanbanColuna({ id, colCfg, count, children }: {
  id: string;
  colCfg: { bg: string; border: string; dot: string; title: string };
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex flex-col min-h-0 w-72 md:w-auto shrink-0 md:shrink">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 ${colCfg.bg} ${colCfg.border}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${colCfg.dot}`} />
        <span className="font-semibold text-dark text-xs flex-1 truncate">{colCfg.title}</span>
        <span className="text-[0.6rem] font-bold text-muted bg-white/70 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div ref={setNodeRef} className={`flex-1 space-y-2 rounded-xl p-1.5 transition-colors min-h-[100px] ${isOver ? "bg-rose-light/30 ring-2 ring-rose-mid/30" : ""}`}>
        {count === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-muted">
            Arraste aqui
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function KanbanCard({ pedido: p, isDragging, overlay, onAvancar, onEdit, onView }: {
  pedido: Pedido;
  isDragging?: boolean;
  overlay?: boolean;
  onAvancar: () => void;
  onEdit: () => void;
  onView: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: p.id });
  const atrasado = p.dataEntrega < new Date().toISOString().slice(0, 10) && p.status !== "entregue";
  const style = transform && !overlay ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div ref={overlay ? undefined : setNodeRef} style={style}
      className={`bg-white rounded-xl border p-3 shadow-sm transition select-none
        ${atrasado ? "border-red-200" : "border-rose-light/60"}
        ${isDragging ? "opacity-40" : ""}
        ${overlay ? "shadow-xl rotate-1 scale-105" : "hover:shadow-md"}
      `}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[0.6rem] font-mono text-muted">#{p.numero}</span>
        <div className="flex items-center gap-1">
          {atrasado && <span className="text-[0.5rem] font-bold bg-red-50 text-red-500 px-1 py-0.5 rounded-full border border-red-200">Atrasado</span>}
          {/* handle de drag */}
          <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 rounded text-muted/40 hover:text-muted touch-none">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
              <circle cx="2" cy="5" r="1.2"/><circle cx="8" cy="5" r="1.2"/>
              <circle cx="2" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="font-semibold text-dark text-sm leading-snug">{p.clienteNome}</p>
      <div className="mt-1 space-y-0.5">
        {p.itens.map((it, i) => (
          <p key={i} className="text-[0.6rem] text-muted">{it.quantidade}x {it.produtoNome}</p>
        ))}
      </div>
      {p.personalizacao && (
        <p className="text-[0.6rem] text-caramel-DEFAULT mt-1.5 bg-amber-50 px-2 py-1 rounded-lg truncate">✏️ {p.personalizacao}</p>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-light/40">
        <div>
          <p className="font-bold text-dark text-xs">{p.totalFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p className="text-[0.55rem] text-muted">📅 {p.dataEntrega}</p>
        </div>
        {!overlay && (
          <div className="flex gap-1">
            {p.status !== "entregue" && (
              <button onClick={onAvancar} className="p-1 rounded-lg bg-rose-light hover:bg-rose-mid/30 text-rose transition"><CheckCircle2 size={12} /></button>
            )}
            <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 transition"><MessageCircle size={12} /></a>
            <button onClick={onView} className="p-1 rounded-lg hover:bg-rose-light text-muted hover:text-rose transition" title="Ver detalhes"><Eye size={12} /></button>
            <button onClick={onEdit} className="p-1 rounded-lg hover:bg-rose-light text-muted hover:text-rose transition"><Pencil size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Comanda ────────────────────────────────────────────────────────────────────

function printComanda(p: Pedido, contaNome: string, enderecoFormatado: string) {
  const win = window.open("", "_blank", "width=640,height=900");
  if (!win) return;
  const fmtR = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  const statusLabel: Record<string, string> = { aguardando: "Aguardando", producao: "Em Produção", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado" };
  const criadoEm = p.createdAt instanceof Date ? p.createdAt : new Date((p.createdAt as unknown as { seconds: number }).seconds * 1000);

  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Pedido #${p.numero} — ${contaNome}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Georgia',serif;color:#2A1F1A;background:#fff;padding:36px;max-width:560px;margin:0 auto}
  .header{text-align:center;border-bottom:2px solid #FAEDEF;padding-bottom:18px;margin-bottom:20px}
  .logo{font-size:22px;font-weight:700;color:#C4566A;letter-spacing:.04em}
  .sub{font-size:10px;color:#7A6860;margin-top:3px;letter-spacing:.12em;text-transform:uppercase}
  .num{font-size:13px;color:#7A6860;margin-top:6px}
  .sec{margin-bottom:18px}
  .sec-title{font-size:9px;font-weight:700;color:#7A6860;text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .box{background:#FDF8F4;border:1px solid #FAEDEF;border-radius:8px;padding:9px 12px}
  .lbl{font-size:9px;color:#7A6860;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}
  .val{font-size:13px;font-weight:600;color:#2A1F1A}
  table{width:100%;border-collapse:collapse}
  th{font-size:9px;font-weight:700;color:#7A6860;text-transform:uppercase;letter-spacing:.08em;padding:5px 0;border-bottom:1px solid #FAEDEF;text-align:left}
  th:last-child,td:last-child{text-align:right}
  td{font-size:12px;padding:8px 0;border-bottom:1px solid #FAEDEF}
  .tr{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;color:#7A6860}
  .tf{display:flex;justify-content:space-between;font-size:17px;font-weight:700;color:#C4566A;padding-top:8px;margin-top:4px;border-top:2px solid #FAEDEF}
  .note{background:#FDF8F4;border:1px solid #FAEDEF;border-radius:8px;padding:10px 12px;font-size:12px}
  .footer{text-align:center;font-size:10px;color:#7A6860;margin-top:24px;padding-top:14px;border-top:1px solid #FAEDEF}
  @media print{body{padding:16px}}
</style></head><body>
<div class="header">
  <div class="logo">${contaNome}</div>
  <div class="sub">Confeitaria Artesanal</div>
  <div class="num">Pedido #${p.numero} &nbsp;·&nbsp; ${criadoEm.toLocaleDateString("pt-BR")} às ${criadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>
<div class="sec">
  <div class="sec-title">Cliente</div>
  <div class="grid2">
    <div class="box"><div class="lbl">Nome</div><div class="val">${p.clienteNome}</div></div>
    <div class="box"><div class="lbl">WhatsApp</div><div class="val">${p.clienteWhatsapp}</div></div>
  </div>
  ${enderecoFormatado ? `<div class="box" style="margin-top:8px"><div class="lbl">Endereço de entrega</div><div class="val" style="font-size:12px">📍 ${enderecoFormatado}</div></div>` : ""}
</div>
<div class="sec">
  <div class="sec-title">Entrega &amp; Pagamento</div>
  <div class="grid2">
    <div class="box"><div class="lbl">Data de entrega</div><div class="val">${fmtDate(p.dataEntrega)}</div></div>
    <div class="box"><div class="lbl">Pagamento</div><div class="val" style="text-transform:capitalize">${p.formaPagamento}${p.pago ? " ✓" : ""}</div></div>
  </div>
</div>
<div class="sec">
  <div class="sec-title">Itens</div>
  <table><thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead><tbody>
    ${p.itens.map(i => `<tr><td>${i.produtoNome}</td><td>${i.quantidade}</td><td>${fmtR(i.precoUnit)}</td><td>${fmtR(i.subtotal)}</td></tr>`).join("")}
  </tbody></table>
  <div style="margin-top:10px">
    ${p.desconto > 0 ? `<div class="tr"><span>Subtotal</span><span>${fmtR(p.total)}</span></div><div class="tr"><span>Desconto</span><span>- ${fmtR(p.desconto)}</span></div>` : ""}
    <div class="tf"><span>Total</span><span>${fmtR(p.totalFinal)}</span></div>
  </div>
</div>
${p.personalizacao ? `<div class="sec"><div class="sec-title">Personalização</div><div class="note">✏️ ${p.personalizacao}</div></div>` : ""}
${p.obs ? `<div class="sec"><div class="sec-title">Observações</div><div class="note">${p.obs}</div></div>` : ""}
<div class="footer">Status: ${statusLabel[p.status] ?? p.status}${p.pago ? " · Pagamento confirmado ✓" : " · Pagamento pendente"}</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  aguardando: { label: "Aguardando",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  producao:   { label: "Em Produção", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pronto:     { label: "Pronto",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  entregue:   { label: "Entregue",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
  cancelado:  { label: "Cancelado",   cls: "bg-red-50 text-red-500 border-red-200" },
};

function ComandaModal({ pedido: p, contaNome, clientes, onClose, onEdit, onCadastrarCliente }: {
  pedido: Pedido;
  contaNome: string;
  clientes: Cliente[];
  onClose: () => void;
  onEdit: () => void;
  onCadastrarCliente: (pedido: Pedido, endereco: string) => Promise<void>;
}) {
  const fmtR = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  const criadoEm = p.createdAt instanceof Date ? p.createdAt : new Date((p.createdAt as unknown as { seconds: number }).seconds * 1000);
  const statusCfg = STATUS_CFG[p.status];
  const atrasado = p.dataEntrega < new Date().toISOString().slice(0, 10) && p.status !== "entregue" && p.status !== "cancelado";
  const [cadastrando, setCadastrando] = useState(false);
  const clienteCad = clientes.find(c => c.id === p.clienteId);
  const enderecoFormatado = p.enderecoEntrega ||
    (clienteCad ? [clienteCad.endereco, clienteCad.numero, clienteCad.complemento, clienteCad.bairro, clienteCad.cidade].filter(Boolean).join(", ") : "");

  async function handleCadastrar() {
    setCadastrando(true);
    try { await onCadastrarCliente(p, enderecoFormatado); }
    finally { setCadastrando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] mb-16 sm:mb-0" onClick={e => e.stopPropagation()}>

        {/* Topo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-light/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted">#{p.numero}</span>
            <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>{statusCfg.label}</span>
            {atrasado && <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Atrasado</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => printComanda(p, contaNome, enderecoFormatado)} className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-dark bg-rose-light/40 hover:bg-rose-light px-3 py-1.5 rounded-lg transition">
              <Printer size={13} /> Imprimir / PDF
            </button>
            <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C4566A] hover:bg-[#b04d60] px-3 py-1.5 rounded-lg transition">
              <Pencil size={13} /> Editar
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-dark hover:bg-rose-light transition ml-1">
              <Eye size={15} className="rotate-0" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Cliente */}
          <div>
            <p className="text-[0.65rem] font-bold text-muted uppercase tracking-widest mb-2">Cliente</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cream/60 rounded-xl px-3 py-2.5">
                <p className="text-[0.6rem] text-muted mb-0.5">Nome</p>
                <p className="text-sm font-semibold text-dark">{p.clienteNome}</p>
              </div>
              <div className="bg-cream/60 rounded-xl px-3 py-2.5">
                <p className="text-[0.6rem] text-muted mb-0.5">WhatsApp</p>
                <a href={`https://wa.me/55${p.clienteWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-600 hover:underline">{p.clienteWhatsapp}</a>
              </div>
            </div>
            {enderecoFormatado && (
              <div className="bg-cream/60 rounded-xl px-3 py-2.5 mt-2">
                <p className="text-[0.6rem] text-muted mb-0.5">Endereço de entrega</p>
                <p className="text-sm text-dark">📍 {enderecoFormatado}</p>
              </div>
            )}
            {!p.clienteId && (
              <button
                onClick={handleCadastrar}
                disabled={cadastrando}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#C4566A] border border-rose-mid/40 hover:bg-rose-light/40 disabled:opacity-60 py-2 rounded-xl transition"
              >
                {cadastrando ? "Cadastrando..." : "＋ Cadastrar como cliente"}
              </button>
            )}
          </div>

          {/* Entrega & Pagamento */}
          <div>
            <p className="text-[0.65rem] font-bold text-muted uppercase tracking-widest mb-2">Entrega &amp; Pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-cream/60 rounded-xl px-3 py-2.5">
                <p className="text-[0.6rem] text-muted mb-0.5">Data entrega</p>
                <p className={`text-sm font-semibold ${atrasado ? "text-red-600" : "text-dark"}`}>{fmtDate(p.dataEntrega)}</p>
              </div>
              <div className="bg-cream/60 rounded-xl px-3 py-2.5">
                <p className="text-[0.6rem] text-muted mb-0.5">Forma</p>
                <p className="text-sm font-semibold text-dark capitalize">{p.formaPagamento}</p>
              </div>
              <div className={`rounded-xl px-3 py-2.5 ${p.pago ? "bg-emerald-50" : "bg-amber-50"}`}>
                <p className="text-[0.6rem] text-muted mb-0.5">Status pag.</p>
                <p className={`text-sm font-semibold ${p.pago ? "text-emerald-700" : "text-amber-700"}`}>{p.pago ? "Pago ✓" : "A receber"}</p>
              </div>
            </div>
            <p className="text-[0.6rem] text-muted mt-1.5 pl-1">Pedido criado em {criadoEm.toLocaleDateString("pt-BR")} às {criadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>

          {/* Itens */}
          <div>
            <p className="text-[0.65rem] font-bold text-muted uppercase tracking-widest mb-2">Itens</p>
            <div className="border border-rose-light/60 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_40px_80px_80px] gap-0 bg-cream/40 px-3 py-2 border-b border-rose-light/40">
                {["Produto","Qtd","Unit.","Total"].map(h => (
                  <p key={h} className="text-[0.6rem] font-bold text-muted uppercase tracking-wide last:text-right">{h}</p>
                ))}
              </div>
              {p.itens.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_40px_80px_80px] gap-0 px-3 py-2.5 border-b border-rose-light/30 last:border-0">
                  <p className="text-xs font-medium text-dark">{item.produtoNome}</p>
                  <p className="text-xs text-muted text-center">{item.quantidade}</p>
                  <p className="text-xs text-muted text-right">{fmtR(item.precoUnit)}</p>
                  <p className="text-xs font-semibold text-dark text-right">{fmtR(item.subtotal)}</p>
                </div>
              ))}
              {p.desconto > 0 && (
                <div className="px-3 py-2 bg-cream/30 border-t border-rose-light/40 flex justify-between text-xs text-muted">
                  <span>Subtotal</span><span>{fmtR(p.total)}</span>
                </div>
              )}
              {p.desconto > 0 && (
                <div className="px-3 py-2 bg-cream/30 flex justify-between text-xs text-muted">
                  <span>Desconto</span><span className="text-emerald-600">- {fmtR(p.desconto)}</span>
                </div>
              )}
              <div className="px-3 py-3 bg-rose-light/20 border-t border-rose-light/60 flex justify-between items-center">
                <span className="text-sm font-semibold text-muted">Total</span>
                <span className="font-heading font-bold text-xl text-[#C4566A]">{fmtR(p.totalFinal)}</span>
              </div>
            </div>
          </div>

          {/* Personalização */}
          {p.personalizacao && (
            <div>
              <p className="text-[0.65rem] font-bold text-muted uppercase tracking-widest mb-2">Personalização</p>
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2.5">
                <p className="text-sm text-dark">✏️ {p.personalizacao}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {p.obs && (
            <div>
              <p className="text-[0.65rem] font-bold text-muted uppercase tracking-widest mb-2">Observações</p>
              <div className="bg-cream/60 border border-rose-light/40 rounded-xl px-3 py-2.5">
                <p className="text-sm text-dark">{p.obs}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
