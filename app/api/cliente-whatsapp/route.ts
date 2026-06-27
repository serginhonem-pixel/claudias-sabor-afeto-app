import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID?.trim(),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim(),
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim(),
    }),
  });
  return getFirestore(app);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contaId = searchParams.get("contaId");
  const whatsapp = searchParams.get("whatsapp");

  if (!contaId || !whatsapp) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const limpo = whatsapp.replace(/\D/g, "");

    // Busca todos os clientes e filtra por dígitos — funciona com qualquer formato salvo
    const todosSnap = await db.collection("contas").doc(contaId).collection("clientes").get();
    const clienteDoc = todosSnap.docs.find(d => {
      const wpp = (d.data().whatsapp ?? "").replace(/\D/g, "");
      return wpp === limpo;
    });

    if (!clienteDoc) return NextResponse.json({ cliente: null, pedidos: [] });

    const clienteData = { id: clienteDoc.id, ...clienteDoc.data() };

    // orderBy junto com "in" exige índice composto — ordena em memória para evitar isso
    const [pedidosSnap1, pedidosSnap2] = await Promise.all([
      db.collection("contas").doc(contaId).collection("pedidos").where("clienteWhatsapp", "==", limpo).get(),
      limpo !== whatsapp
        ? db.collection("contas").doc(contaId).collection("pedidos").where("clienteWhatsapp", "==", whatsapp).get()
        : Promise.resolve({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] }),
    ]);

    const seen = new Set<string>();
    const pedidos = [...pedidosSnap1.docs, ...pedidosSnap2.docs]
      .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const ta = (a.createdAt as { _seconds?: number })?._seconds ?? 0;
        const tb = (b.createdAt as { _seconds?: number })?._seconds ?? 0;
        return tb - ta;
      })
      .slice(0, 5);

    return NextResponse.json({ cliente: clienteData, pedidos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erro ao buscar cliente:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
