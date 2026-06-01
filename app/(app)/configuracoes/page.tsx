"use client";
import { useEffect, useState } from "react";
import { useConta } from "@/hooks/useConta";
import { updateConta } from "@/lib/firestore";
import { seedDados, limparDados } from "@/lib/seed";
import { Topbar } from "@/components/layout/Topbar";
import { Save, FlaskConical, Trash2, Link2, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function ConfigPage() {
  const { conta } = useConta();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!conta) return;
    setNome(conta.nome ?? "");
    setTelefone(conta.telefone ?? "");
    setInstagram(conta.instagram ?? "");
  }, [conta]);

  async function handleSeed() {
    if (!conta) return;
    if (!confirm("Isso vai apagar todos os dados atuais e carregar os dados de exemplo. Confirmar?")) return;
    setSeeding(true);
    try {
      await seedDados(conta.id);
      toast.success("Dados de exemplo carregados! Explore o app.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados. Verifique o Firebase.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleClear() {
    if (!conta) return;
    if (!confirm("Isso vai apagar TODOS os dados (insumos, receitas, produtos, clientes e pedidos). Confirmar?")) return;
    setClearing(true);
    try {
      await limparDados(conta.id);
      toast.success("Todos os dados foram apagados.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao apagar dados.");
    } finally {
      setClearing(false);
    }
  }

  async function handleSave() {
    if (!conta) return;
    if (!nome.trim()) { toast.error("Informe o nome do negócio"); return; }
    setSaving(true);
    try {
      await updateConta(conta.id, { nome: nome.trim(), telefone, instagram });
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Topbar title="Configurações" />

      <div className="p-4 md:p-6 max-w-xl space-y-6">

        {/* Dados do negócio */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-4">Dados do Negócio</h2>
          <div className="space-y-3">
            <div>
              <label className="field-label">Nome do negócio</label>
              <input className="field-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Claudia's Sabor e Afeto" />
            </div>
            <div>
              <label className="field-label">WhatsApp / Telefone</label>
              <input className="field-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="field-label">Instagram</label>
              <input className="field-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@claudias.sabor" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition font-semibold">
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        {/* Link de pedidos para clientes */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <Link2 size={18} className="text-rose mt-0.5 shrink-0" />
            <div>
              <h2 className="font-heading font-semibold text-dark text-sm">Link de Pedidos</h2>
              <p className="text-xs text-muted mt-1">
                Compartilhe esse link com seus clientes para que eles façam pedidos direto pelo celular.
              </p>
            </div>
          </div>
          {conta && (
            <>
              <div className="bg-rose-light/30 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
                <span className="text-xs text-dark font-mono flex-1 truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://claudias-sabor-afeto-app.vercel.app"}/c/{conta.id}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/c/${conta.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copiado!");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 border border-rose-light hover:bg-rose-light/30 text-muted text-sm font-medium py-2 rounded-xl transition"
                >
                  <Copy size={13} /> Copiar link
                </button>
                <a
                  href={`/c/${conta.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C4566A] hover:bg-[#b04d60] text-white text-sm font-semibold py-2 rounded-xl transition"
                >
                  <Link2 size={13} /> Ver cardápio
                </a>
              </div>
            </>
          )}
        </div>

        {/* Dados de exemplo */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <FlaskConical size={18} className="text-rose mt-0.5 shrink-0" />
            <div>
              <h2 className="font-heading font-semibold text-dark text-sm">Dados de Exemplo</h2>
              <p className="text-xs text-muted mt-1">
                Popula o app com insumos, receitas, produtos, clientes e pedidos fictícios para você explorar todas as funcionalidades. <strong className="text-dark">Apaga tudo que tiver cadastrado antes.</strong>
              </p>
            </div>
          </div>
          <div className="bg-rose-light/30 rounded-xl p-3 mb-4 text-xs text-muted space-y-1">
            <p>📦 <strong className="text-dark">12 insumos</strong> — farinhas, chocolates, laticínios, embalagens</p>
            <p>📖 <strong className="text-dark">3 receitas</strong> — Bolo de Chocolate, Brigadeiro Gourmet, Torta de Limão</p>
            <p>🎂 <strong className="text-dark">5 produtos</strong> — com CMV calculado automaticamente</p>
            <p>👥 <strong className="text-dark">5 clientes</strong> — com WhatsApp e informações completas</p>
            <p>🛍️ <strong className="text-dark">5 pedidos</strong> — em diferentes status (aguardando, produção, pronto, entregue)</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding || clearing}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-rose-mid/40 hover:border-rose hover:bg-rose-light/20 text-rose text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
          >
            <FlaskConical size={15} />
            {seeding ? "Carregando dados..." : "Carregar dados de exemplo"}
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || seeding}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-xl transition disabled:opacity-60 mt-1"
          >
            <Trash2 size={14} />
            {clearing ? "Apagando..." : "Apagar todos os dados"}
          </button>
        </div>

        {/* Sobre o app */}
        <div className="bg-white rounded-xl border border-rose-light/60 p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-3">Sobre o App</h2>
          <div className="space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Versão</span><span className="font-medium text-dark">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Banco de dados</span><span className="font-medium text-dark">Firebase Firestore</span>
            </div>
            <div className="flex justify-between">
              <span>ID da conta</span><span className="font-mono text-[0.65rem] text-dark">{conta?.id ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Guia de CMV */}
        <div className="bg-rose-light/30 rounded-xl border border-rose-light p-5">
          <h2 className="font-heading font-semibold text-dark text-sm mb-2">📊 Referência de CMV</h2>
          <div className="space-y-1.5 text-xs text-muted">
            <p><strong className="text-emerald-600">≤ 25%</strong> — Excelente. Alta margem de contribuição.</p>
            <p><strong className="text-amber-600">26–35%</strong> — Aceitável para confeitaria artesanal.</p>
            <p><strong className="text-red-500">&gt; 35%</strong> — Atenção! Revise o preço ou reduza custos.</p>
          </div>
          <p className="text-xs text-muted mt-3">
            Para melhorar a precisão dos custos, cadastre os insumos em <strong className="text-dark">Estoque</strong>,
            crie as fichas técnicas em <strong className="text-dark">Receitas</strong> e vincule aos produtos.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .field-label{display:block;font-size:.7rem;font-weight:600;color:#7A6860;margin-bottom:.35rem}
        .field-input{width:100%;border:1px solid #FAEDEF;border-radius:10px;padding:.5rem .75rem;font-size:.82rem;outline:none;transition:border .15s;background:#fff}
        .field-input:focus{border-color:#E8A0AE;box-shadow:0 0 0 3px rgba(196,86,106,.08)}
      `}</style>
    </>
  );
}
