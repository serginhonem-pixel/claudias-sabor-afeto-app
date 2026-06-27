import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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

    const [snap1, snap2] = await Promise.all([
      db.collection("contas").doc(contaId).collection("clientes").where("whatsapp", "==", limpo).limit(1).get(),
      db.collection("contas").doc(contaId).collection("clientes").where("whatsapp", "==", whatsapp).limit(1).get(),
    ]);

    const doc = snap1.docs[0] ?? snap2.docs[0];
    if (!doc) return NextResponse.json({ cliente: null, pedidos: [] });

    const clienteData = { id: doc.id, ...doc.data() };

    const pedidosSnap = await db.collection("contas").doc(contaId).collection("pedidos")
      .where("clienteWhatsapp", "in", [limpo, whatsapp])
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const pedidos = pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ cliente: clienteData, pedidos });
  } catch (e) {
    console.error("Erro ao buscar cliente:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
