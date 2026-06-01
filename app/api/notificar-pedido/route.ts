import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminMessaging } from "@/lib/firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ItemPedido {
  quantidade: number;
  produtoNome: string;
  subtotal: number;
}

export async function POST(req: NextRequest) {
  const { numero, clienteNome, clienteWhatsapp, dataEntrega, itens, total, obs, personalizacao, fcmToken } =
    await req.json();

  const dataFormatada = new Date(dataEntrega + "T12:00:00").toLocaleDateString("pt-BR");
  const errors: string[] = [];

  // ── Email ──────────────────────────────────────────────────────────────────
  try {
    const itensHtml = (itens as ItemPedido[])
      .map(
        (i) => `
        <tr>
          <td style="padding:6px 0;color:#2A1F1A;">${i.quantidade}x ${i.produtoNome}</td>
          <td style="padding:6px 0;color:#B87444;font-weight:bold;text-align:right;">${fmt(i.subtotal)}</td>
        </tr>`
      )
      .join("");

    await resend.emails.send({
      from: "Claudia's Sabor e Afeto <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL!,
      subject: `🎂 Novo Pedido #${numero} — ${clienteNome}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#FDF8F4;padding:24px;border-radius:16px;">
          <h1 style="color:#C4566A;font-size:20px;margin-bottom:4px;">🎂 Novo Pedido #${numero}</h1>
          <p style="color:#7A6860;font-size:13px;margin-top:0;">Claudia's Sabor e Afeto</p>

          <div style="background:#fff;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #FAEDEF;">
            <p style="margin:0 0 6px;font-size:13px;color:#2A1F1A;"><strong>👤 Cliente:</strong> ${clienteNome}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#2A1F1A;"><strong>📱 WhatsApp:</strong> ${clienteWhatsapp}</p>
            <p style="margin:0;font-size:13px;color:#2A1F1A;"><strong>📅 Entrega desejada:</strong> ${dataFormatada}</p>
            ${obs ? `<p style="margin:6px 0 0;font-size:13px;color:#2A1F1A;"><strong>📝 Obs:</strong> ${obs}</p>` : ""}
            ${personalizacao ? `<p style="margin:6px 0 0;font-size:13px;color:#2A1F1A;"><strong>✏️ Personalização:</strong> ${personalizacao}</p>` : ""}
          </div>

          <div style="background:#fff;border-radius:12px;padding:16px;border:1px solid #FAEDEF;">
            <p style="font-weight:bold;color:#2A1F1A;margin:0 0 12px;font-size:14px;">Itens do pedido</p>
            <table style="width:100%;border-collapse:collapse;">
              ${itensHtml}
              <tr style="border-top:1px solid #FAEDEF;">
                <td style="padding:10px 0 0;font-weight:bold;color:#2A1F1A;">Total</td>
                <td style="padding:10px 0 0;font-weight:bold;color:#B87444;text-align:right;font-size:16px;">${fmt(total)}</td>
              </tr>
            </table>
          </div>

          <p style="text-align:center;color:#7A6860;font-size:11px;margin-top:20px;">
            Acesse o app para atualizar o status do pedido.
          </p>
        </div>
      `,
    });
  } catch (e) {
    errors.push(`email: ${e}`);
    console.error("Erro ao enviar email:", e);
  }

  // ── FCM Push ───────────────────────────────────────────────────────────────
  if (fcmToken) {
    try {
      await getAdminMessaging().send({
        token: fcmToken,
        notification: {
          title: `🎂 Novo Pedido #${numero}!`,
          body: `${clienteNome} — ${fmt(total)} • Entrega: ${dataFormatada}`,
        },
        webpush: {
          fcmOptions: { link: "/pedidos" },
        },
      });
    } catch (e) {
      errors.push(`fcm: ${e}`);
      console.error("Erro ao enviar FCM:", e);
    }
  }

  return NextResponse.json({ ok: true, errors });
}
