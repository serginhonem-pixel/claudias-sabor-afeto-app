import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp, DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Conta, Cliente, Insumo, Receita, Produto, Pedido } from "@/types";

function requireDb() {
  if (!db) throw new Error("Firebase não configurado.");
  return db;
}
function col(contaId: string, sub: string) {
  return collection(requireDb(), "contas", contaId, sub);
}
function docRef(contaId: string, sub: string, id: string) {
  return doc(requireDb(), "contas", contaId, sub, id);
}
function fromTs(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

// ─── CONTA ───────────────────────────────────────────────────────────────────
export async function getConta(id: string): Promise<Conta | null> {
  const snap = await getDoc(doc(requireDb(), "contas", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: fromTs(snap.data().createdAt) } as Conta;
}

export async function createConta(data: Omit<Conta, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(requireDb(), "contas"), { ...data, createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateConta(id: string, data: Partial<Conta>) {
  await setDoc(doc(requireDb(), "contas", id), data as DocumentData, { merge: true });
}

export async function saveUserConta(userId: string, contaId: string) {
  try {
    await updateDoc(doc(requireDb(), "users", userId), { contaId });
  } catch {
    await addDoc(collection(requireDb(), "users"), { userId, contaId });
  }
}

export async function getUserConta(userId: string): Promise<Conta | null> {
  const q = query(collection(requireDb(), "users"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const contaId = snap.docs[0].data().contaId as string;
  return getConta(contaId);
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export async function getClientes(contaId: string): Promise<Cliente[]> {
  const snap = await getDocs(query(col(contaId, "clientes"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: fromTs(d.data().createdAt) })) as Cliente[];
}

export async function saveCliente(contaId: string, data: Omit<Cliente, "id" | "contaId">, id?: string): Promise<string> {
  if (id) { await updateDoc(docRef(contaId, "clientes", id), data as DocumentData); return id; }
  const ref = await addDoc(col(contaId, "clientes"), { ...data, contaId, createdAt: Timestamp.now() });
  return ref.id;
}

export async function deleteCliente(contaId: string, id: string) {
  await deleteDoc(docRef(contaId, "clientes", id));
}

export async function getClienteByWhatsapp(contaId: string, whatsapp: string): Promise<Cliente | null> {
  const limpo = whatsapp.replace(/\D/g, "");
  const snap = await getDocs(query(col(contaId, "clientes"), where("whatsapp", "==", limpo)));
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data(), createdAt: fromTs(snap.docs[0].data().createdAt) } as Cliente;
  // tenta com formatação original
  const snap2 = await getDocs(query(col(contaId, "clientes"), where("whatsapp", "==", whatsapp)));
  if (!snap2.empty) return { id: snap2.docs[0].id, ...snap2.docs[0].data(), createdAt: fromTs(snap2.docs[0].data().createdAt) } as Cliente;
  return null;
}

export async function getPedidosByWhatsapp(contaId: string, whatsapp: string): Promise<Pedido[]> {
  const limpo = whatsapp.replace(/\D/g, "");
  const snap = await getDocs(query(col(contaId, "pedidos"), where("clienteWhatsapp", "==", limpo)));
  const snap2 = await getDocs(query(col(contaId, "pedidos"), where("clienteWhatsapp", "==", whatsapp)));
  const todos = [...snap.docs, ...snap2.docs].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
  return todos
    .map(d => ({ id: d.id, ...d.data(), createdAt: fromTs(d.data().createdAt), updatedAt: fromTs(d.data().updatedAt) }) as Pedido)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);
}

// ─── INSUMOS ────────────────────────────────────────────────────────────────
export async function getInsumos(contaId: string): Promise<Insumo[]> {
  const snap = await getDocs(query(col(contaId, "insumos"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Insumo[];
}

export async function saveInsumo(contaId: string, data: Omit<Insumo, "id" | "contaId">, id?: string): Promise<string> {
  if (id) { await updateDoc(docRef(contaId, "insumos", id), data as DocumentData); return id; }
  const ref = await addDoc(col(contaId, "insumos"), { ...data, contaId });
  return ref.id;
}

export async function deleteInsumo(contaId: string, id: string) {
  await deleteDoc(docRef(contaId, "insumos", id));
}

// ─── RECEITAS ────────────────────────────────────────────────────────────────
export async function getReceitas(contaId: string): Promise<Receita[]> {
  const snap = await getDocs(query(col(contaId, "receitas"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: fromTs(d.data().createdAt) })) as Receita[];
}

export async function saveReceita(contaId: string, data: Omit<Receita, "id" | "contaId">, id?: string): Promise<string> {
  if (id) { await updateDoc(docRef(contaId, "receitas", id), data as DocumentData); return id; }
  const ref = await addDoc(col(contaId, "receitas"), { ...data, contaId, createdAt: Timestamp.now() });
  return ref.id;
}

export async function deleteReceita(contaId: string, id: string) {
  await deleteDoc(docRef(contaId, "receitas", id));
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
export async function getProdutos(contaId: string): Promise<Produto[]> {
  const snap = await getDocs(query(col(contaId, "produtos"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: fromTs(d.data().createdAt) })) as Produto[];
}

export async function saveProduto(contaId: string, data: Omit<Produto, "id" | "contaId">, id?: string): Promise<string> {
  if (id) { await updateDoc(docRef(contaId, "produtos", id), data as DocumentData); return id; }
  const ref = await addDoc(col(contaId, "produtos"), { ...data, contaId, createdAt: Timestamp.now() });
  return ref.id;
}

export async function deleteProduto(contaId: string, id: string) {
  await deleteDoc(docRef(contaId, "produtos", id));
}

// ─── PEDIDOS ────────────────────────────────────────────────────────────────
export async function getPedidos(contaId: string): Promise<Pedido[]> {
  const snap = await getDocs(query(col(contaId, "pedidos"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({
    id: d.id, ...d.data(),
    createdAt: fromTs(d.data().createdAt),
    updatedAt: fromTs(d.data().updatedAt),
  })) as Pedido[];
}

export function listenPedidos(contaId: string, cb: (pedidos: Pedido[]) => void) {
  return onSnapshot(query(col(contaId, "pedidos"), orderBy("createdAt", "desc")), snap => {
    cb(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      createdAt: fromTs(d.data().createdAt),
      updatedAt: fromTs(d.data().updatedAt),
    })) as Pedido[]);
  });
}

export async function getProximoNumeroPedido(contaId: string): Promise<number> {
  const snap = await getDocs(query(col(contaId, "pedidos"), orderBy("numero", "desc"), limit(1)));
  if (snap.empty) return 1;
  return (snap.docs[0].data().numero ?? 0) + 1;
}

export async function savePedido(contaId: string, data: Omit<Pedido, "id" | "contaId">, id?: string): Promise<string> {
  const payload = {
    ...data, contaId,
    obs: data.obs ?? "",
    personalizacao: data.personalizacao ?? "",
    createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  if (id) { await updateDoc(docRef(contaId, "pedidos", id), payload as DocumentData); return id; }
  const ref = await addDoc(col(contaId, "pedidos"), payload);
  return ref.id;
}

export async function deletePedido(contaId: string, id: string) {
  await deleteDoc(docRef(contaId, "pedidos", id));
}
