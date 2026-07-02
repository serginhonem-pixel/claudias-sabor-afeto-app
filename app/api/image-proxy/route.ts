import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Parâmetro 'url' é obrigatório" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), { redirect: "follow" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Não foi possível baixar a imagem" }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL não retornou uma imagem" }, { status: 502 });
    }
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erro no proxy de imagem:", msg);
    return NextResponse.json({ error: "Erro ao buscar imagem" }, { status: 500 });
  }
}
