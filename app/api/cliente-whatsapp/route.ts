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

    const formatarBR = (digits: string): string[] => {
      const vars: string[] = [digits];
      if (digits.length === 11) {
        const ddd = digits.slice(0, 2);
        const num = digits.slice(2);
        vars.push(`(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`);
        vars.push(`${ddd} ${num.slice(0, 5)}-${num.slice(5)}`);
      } else if (digits.length === 10) {
        const ddd = digits.slice(0, 2);
        const num = digits.slice(2);
        vars.push(`(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`);
        vars.push(`${ddd} ${num.slice(0, 4)}-${num.slice(4)}`);
      }
      return vars;
    };

    const variants = [...new Set([...formatarBR(limpo), whatsapp])];

    // Firestore só aceita até 30 valores no "in", mas aqui teremos poucos
    const snap = await db.collection("contas").doc(contaId).collection("clientes")
      .where("whatsapp", "in", variants)
      .limit(1)
      .get();

    const doc = snap.docs[0];
    if (!doc) return NextResponse.json({ cliente: null, pedidos: [] });

    const clienteData = { id: doc.id, ...doc.data() };

    const pedidosSnap = await db.collection("contas").doc(contaId).collection("pedidos")
      .where("clienteWhatsapp", "in", variants)
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
