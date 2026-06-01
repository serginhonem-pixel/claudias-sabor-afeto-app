import { collection, addDoc, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

function requireDb() {
  if (!db) throw new Error("Firebase não configurado.");
  return db;
}
function col(contaId: string, sub: string) {
  return collection(requireDb(), "contas", contaId, sub);
}

async function limparColecao(contaId: string, sub: string) {
  const snap = await getDocs(col(contaId, sub));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function seedDados(contaId: string) {
  // Limpa dados existentes
  await Promise.all([
    limparColecao(contaId, "insumos"),
    limparColecao(contaId, "receitas"),
    limparColecao(contaId, "produtos"),
    limparColecao(contaId, "clientes"),
    limparColecao(contaId, "pedidos"),
  ]);

  // ── INSUMOS ─────────────────────────────────────────────────────────────────
  const insumosData = [
    { nome: "Farinha de Trigo",        categoria: "Farinhas",    unidade: "g",  estoque: 5000, estoqueMinimo: 1000, custoPorUnidade: 0.005,  fornecedor: "Atacadão" },
    { nome: "Açúcar Refinado",         categoria: "Açúcares",   unidade: "g",  estoque: 3000, estoqueMinimo: 500,  custoPorUnidade: 0.005,  fornecedor: "Atacadão" },
    { nome: "Chocolate em Pó 50%",     categoria: "Chocolates", unidade: "g",  estoque: 800,  estoqueMinimo: 200,  custoPorUnidade: 0.04,   fornecedor: "Cacau Show" },
    { nome: "Manteiga sem Sal",        categoria: "Laticínios", unidade: "g",  estoque: 1000, estoqueMinimo: 200,  custoPorUnidade: 0.04,   fornecedor: "Supermercado" },
    { nome: "Ovos",                    categoria: "Ovos",       unidade: "un", estoque: 30,   estoqueMinimo: 12,   custoPorUnidade: 0.80,   fornecedor: "Feira" },
    { nome: "Leite Integral",          categoria: "Laticínios", unidade: "ml", estoque: 2000, estoqueMinimo: 500,  custoPorUnidade: 0.005,  fornecedor: "Supermercado" },
    { nome: "Leite Condensado",        categoria: "Laticínios", unidade: "g",  estoque: 1200, estoqueMinimo: 400,  custoPorUnidade: 0.014,  fornecedor: "Atacadão" },
    { nome: "Creme de Leite",          categoria: "Laticínios", unidade: "ml", estoque: 600,  estoqueMinimo: 200,  custoPorUnidade: 0.02,   fornecedor: "Supermercado" },
    { nome: "Fermento em Pó",          categoria: "Farinhas",   unidade: "g",  estoque: 200,  estoqueMinimo: 50,   custoPorUnidade: 0.05,   fornecedor: "Supermercado" },
    { nome: "Caixinha 20x20",          categoria: "Embalagens", unidade: "un", estoque: 20,   estoqueMinimo: 10,   custoPorUnidade: 3.50,   fornecedor: "Embalagens & Cia" },
    { nome: "Forminhas de Brigadeiro", categoria: "Embalagens", unidade: "un", estoque: 200,  estoqueMinimo: 100,  custoPorUnidade: 0.08,   fornecedor: "Embalagens & Cia" },
    { nome: "Granulado Chocolate",     categoria: "Chocolates", unidade: "g",  estoque: 500,  estoqueMinimo: 100,  custoPorUnidade: 0.03,   fornecedor: "Cacau Show" },
  ];

  const insumosRefs: Record<string, string> = {};
  for (const ins of insumosData) {
    const ref = await addDoc(col(contaId, "insumos"), { ...ins, contaId, ativo: true });
    insumosRefs[ins.nome] = ref.id;
  }

  // ── RECEITAS ─────────────────────────────────────────────────────────────────
  // Bolo de Chocolate — custo total R$19,90 → custa R$19,90/bolo
  const ingBoloChocolate = [
    { insumoId: insumosRefs["Farinha de Trigo"],    insumoNome: "Farinha de Trigo",    quantidade: 300, unidade: "g" },
    { insumoId: insumosRefs["Açúcar Refinado"],     insumoNome: "Açúcar Refinado",     quantidade: 200, unidade: "g" },
    { insumoId: insumosRefs["Chocolate em Pó 50%"], insumoNome: "Chocolate em Pó 50%", quantidade: 100, unidade: "g" },
    { insumoId: insumosRefs["Manteiga sem Sal"],    insumoNome: "Manteiga sem Sal",    quantidade: 150, unidade: "g" },
    { insumoId: insumosRefs["Ovos"],                insumoNome: "Ovos",                quantidade: 3,   unidade: "un" },
    { insumoId: insumosRefs["Leite Integral"],      insumoNome: "Leite Integral",      quantidade: 200, unidade: "ml" },
    { insumoId: insumosRefs["Fermento em Pó"],      insumoNome: "Fermento em Pó",      quantidade: 10,  unidade: "g" },
    { insumoId: insumosRefs["Caixinha 20x20"],      insumoNome: "Caixinha 20x20",      quantidade: 1,   unidade: "un" },
  ];
  const custoBoloChocolate = 300*0.005 + 200*0.005 + 100*0.04 + 150*0.04 + 3*0.80 + 200*0.005 + 10*0.05 + 1*3.50; // 19.90
  const receitaBolo = await addDoc(col(contaId, "receitas"), {
    contaId, nome: "Bolo de Chocolate", categoria: "Confeitaria",
    rendimento: 1, unidadeRendimento: "Unidade", tempoPreparo: "2h",
    modoPreparo: "Misture os ingredientes secos. Em outra tigela, bata a manteiga com o açúcar. Adicione os ovos e o leite. Una as misturas, adicione o fermento e asse a 180°C por 40 minutos.",
    ingredientes: ingBoloChocolate, custoTotal: custoBoloChocolate, custoPorUnidade: custoBoloChocolate,
    ativo: true, createdAt: Timestamp.now(),
  });

  // Brigadeiro Gourmet — rende 20 unidades → custo R$9,73 total → R$0,487/un
  const ingBrigadeiro = [
    { insumoId: insumosRefs["Leite Condensado"],    insumoNome: "Leite Condensado",    quantidade: 395, unidade: "g" },
    { insumoId: insumosRefs["Chocolate em Pó 50%"], insumoNome: "Chocolate em Pó 50%", quantidade: 50,  unidade: "g" },
    { insumoId: insumosRefs["Manteiga sem Sal"],    insumoNome: "Manteiga sem Sal",    quantidade: 30,  unidade: "g" },
    { insumoId: insumosRefs["Creme de Leite"],      insumoNome: "Creme de Leite",      quantidade: 50,  unidade: "ml" },
    { insumoId: insumosRefs["Granulado Chocolate"], insumoNome: "Granulado Chocolate", quantidade: 80,  unidade: "g" },
    { insumoId: insumosRefs["Forminhas de Brigadeiro"], insumoNome: "Forminhas de Brigadeiro", quantidade: 20, unidade: "un" },
  ];
  const custoBrigadeiroTotal = 395*0.014 + 50*0.04 + 30*0.04 + 50*0.02 + 80*0.03 + 20*0.08; // 11.73
  const receitaBrigadeiro = await addDoc(col(contaId, "receitas"), {
    contaId, nome: "Brigadeiro Gourmet", categoria: "Confeitaria",
    rendimento: 20, unidadeRendimento: "Unidade", tempoPreparo: "45min",
    modoPreparo: "Misture o leite condensado, chocolate e manteiga em fogo baixo, mexendo sempre. Quando desgrudar do fundo, retire do fogo e adicione o creme de leite. Espere esfriar, enrole e cubra com granulado.",
    ingredientes: ingBrigadeiro, custoTotal: custoBrigadeiroTotal, custoPorUnidade: custoBrigadeiroTotal / 20,
    ativo: true, createdAt: Timestamp.now(),
  });

  // Torta de Limão — rende 8 fatias
  const ingTortaLimao = [
    { insumoId: insumosRefs["Farinha de Trigo"],  insumoNome: "Farinha de Trigo",  quantidade: 200, unidade: "g" },
    { insumoId: insumosRefs["Manteiga sem Sal"],  insumoNome: "Manteiga sem Sal",  quantidade: 100, unidade: "g" },
    { insumoId: insumosRefs["Açúcar Refinado"],   insumoNome: "Açúcar Refinado",   quantidade: 100, unidade: "g" },
    { insumoId: insumosRefs["Leite Condensado"],  insumoNome: "Leite Condensado",  quantidade: 395, unidade: "g" },
    { insumoId: insumosRefs["Creme de Leite"],    insumoNome: "Creme de Leite",    quantidade: 200, unidade: "ml" },
    { insumoId: insumosRefs["Ovos"],              insumoNome: "Ovos",              quantidade: 3,   unidade: "un" },
    { insumoId: insumosRefs["Caixinha 20x20"],    insumoNome: "Caixinha 20x20",    quantidade: 1,   unidade: "un" },
  ];
  const custoTortaTotal = 200*0.005 + 100*0.04 + 100*0.005 + 395*0.014 + 200*0.02 + 3*0.80 + 3.50;
  const receitaTorta = await addDoc(col(contaId, "receitas"), {
    contaId, nome: "Torta de Limão", categoria: "Confeitaria",
    rendimento: 8, unidadeRendimento: "Fatia", tempoPreparo: "3h",
    modoPreparo: "Prepare a massa com farinha, manteiga e açúcar. Forre a forma e asse por 15 min. Misture o leite condensado, creme de leite e suco de limão. Despeje e leve à geladeira por 4h.",
    ingredientes: ingTortaLimao, custoTotal: custoTortaTotal, custoPorUnidade: custoTortaTotal / 8,
    ativo: true, createdAt: Timestamp.now(),
  });

  // ── PRODUTOS ─────────────────────────────────────────────────────────────────
  const produtosData = [
    {
      nome: "Bolo de Chocolate", categoria: "Confeitaria", unidadeVenda: "Unidade",
      precoVenda: 85, custoProduto: custoBoloChocolate,
      cmvPercent: Math.round((custoBoloChocolate / 85) * 100),
      receitaId: receitaBolo.id, receitaNome: "Bolo de Chocolate",
      descricao: "Bolo fofinho de chocolate com cobertura de brigadeiro. Serve 8 pessoas.",
      prazoProduzDias: 1, status: "ativo",
    },
    {
      nome: "Caixinha de Brigadeiro (20un)", categoria: "Confeitaria", unidadeVenda: "Caixa",
      precoVenda: 55, custoProduto: custoBrigadeiroTotal,
      cmvPercent: Math.round((custoBrigadeiroTotal / 55) * 100),
      receitaId: receitaBrigadeiro.id, receitaNome: "Brigadeiro Gourmet",
      descricao: "20 brigadeiros gourmet em forminha, com granulado belga.",
      prazoProduzDias: 1, status: "ativo",
    },
    {
      nome: "Torta de Limão (fatia)", categoria: "Confeitaria", unidadeVenda: "Porção",
      precoVenda: 18, custoProduto: custoTortaTotal / 8,
      cmvPercent: Math.round(((custoTortaTotal / 8) / 18) * 100),
      receitaId: receitaTorta.id, receitaNome: "Torta de Limão",
      descricao: "Fatia generosa de torta de limão com massa crocante e recheio cremoso.",
      prazoProduzDias: 1, status: "ativo",
    },
    {
      nome: "Kit Festa Completo", categoria: "Kit", unidadeVenda: "Kit",
      precoVenda: 130, custoProduto: custoBoloChocolate + custoBrigadeiroTotal,
      cmvPercent: Math.round(((custoBoloChocolate + custoBrigadeiroTotal) / 130) * 100),
      descricao: "1 Bolo de Chocolate + 20 Brigadeiros Gourmet. Ideal para festas de até 15 pessoas.",
      prazoProduzDias: 2, status: "ativo",
    },
    {
      nome: "Bolo de Baunilha", categoria: "Confeitaria", unidadeVenda: "Unidade",
      precoVenda: 75, custoProduto: 16,
      cmvPercent: Math.round((16 / 75) * 100),
      descricao: "Bolo de baunilha com recheio de doce de leite e cobertura de chantilly.",
      prazoProduzDias: 1, status: "encomenda",
    },
  ];

  const produtosRefs: Record<string, string> = {};
  for (const prod of produtosData) {
    const ref = await addDoc(col(contaId, "produtos"), { ...prod, contaId, createdAt: Timestamp.now() });
    produtosRefs[prod.nome] = ref.id;
  }

  // ── CLIENTES ─────────────────────────────────────────────────────────────────
  const clientesData = [
    { nome: "Ana Paula Silva",   whatsapp: "(11) 98765-4321", instagram: "@anapaula", bairro: "Moema",       comoEncontrou: "Instagram",  restricoes: "" },
    { nome: "Fernanda Costa",    whatsapp: "(11) 91234-5678", instagram: "@fecosta",  bairro: "Vila Mariana", comoEncontrou: "Indicação",  restricoes: "" },
    { nome: "Maria Oliveira",    whatsapp: "(11) 99999-1111", instagram: "",          bairro: "Perdizes",    comoEncontrou: "Instagram",  restricoes: "sem glúten" },
    { nome: "Juliana Mendes",    whatsapp: "(11) 97777-2222", instagram: "@jumendes", bairro: "Pinheiros",   comoEncontrou: "WhatsApp",   restricoes: "" },
    { nome: "Carla Rodrigues",   whatsapp: "(11) 95555-3333", instagram: "",          bairro: "Tatuapé",     comoEncontrou: "Google",     restricoes: "intolerante a lactose" },
  ];

  const clientesRefs: Record<string, string> = {};
  for (const cli of clientesData) {
    const ref = await addDoc(col(contaId, "clientes"), { ...cli, contaId, createdAt: Timestamp.now() });
    clientesRefs[cli.nome] = ref.id;
  }

  // ── PEDIDOS ─────────────────────────────────────────────────────────────────
  const hoje = new Date();
  const daqui3 = new Date(hoje); daqui3.setDate(hoje.getDate() + 3);
  const daqui7 = new Date(hoje); daqui7.setDate(hoje.getDate() + 7);
  const ontem  = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  const semanaPassada = new Date(hoje); semanaPassada.setDate(hoje.getDate() - 6);

  function fmt(d: Date) { return d.toISOString().slice(0, 10); }

  const pedidosData = [
    {
      numero: 1, clienteId: clientesRefs["Ana Paula Silva"], clienteNome: "Ana Paula Silva", clienteWhatsapp: "(11) 98765-4321",
      itens: [
        { produtoId: produtosRefs["Bolo de Chocolate"], produtoNome: "Bolo de Chocolate", quantidade: 1, precoUnit: 85, subtotal: 85 },
        { produtoId: produtosRefs["Caixinha de Brigadeiro (20un)"], produtoNome: "Caixinha de Brigadeiro (20un)", quantidade: 1, precoUnit: 55, subtotal: 55 },
      ],
      total: 140, desconto: 0, totalFinal: 140,
      formaPagamento: "pix", dataEntrega: fmt(daqui3), status: "producao",
      personalizacao: "Feliz Aniversário Luísa! 🎉", obs: "Retirada às 14h",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    },
    {
      numero: 2, clienteId: clientesRefs["Fernanda Costa"], clienteNome: "Fernanda Costa", clienteWhatsapp: "(11) 91234-5678",
      itens: [
        { produtoId: produtosRefs["Kit Festa Completo"], produtoNome: "Kit Festa Completo", quantidade: 1, precoUnit: 130, subtotal: 130 },
      ],
      total: 130, desconto: 10, totalFinal: 120,
      formaPagamento: "pix", dataEntrega: fmt(daqui7), status: "aguardando",
      personalizacao: "", obs: "Entrega em casa — confirmar endereço",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    },
    {
      numero: 3, clienteId: clientesRefs["Juliana Mendes"], clienteNome: "Juliana Mendes", clienteWhatsapp: "(11) 97777-2222",
      itens: [
        { produtoId: produtosRefs["Bolo de Baunilha"], produtoNome: "Bolo de Baunilha", quantidade: 1, precoUnit: 75, subtotal: 75 },
      ],
      total: 75, desconto: 0, totalFinal: 75,
      formaPagamento: "cartao", dataEntrega: fmt(ontem), status: "pronto",
      personalizacao: "Para o chá de bebê da Juliana", obs: "",
      createdAt: Timestamp.fromDate(semanaPassada), updatedAt: Timestamp.now(),
    },
    {
      numero: 4, clienteId: clientesRefs["Maria Oliveira"], clienteNome: "Maria Oliveira", clienteWhatsapp: "(11) 99999-1111",
      itens: [
        { produtoId: produtosRefs["Torta de Limão (fatia)"], produtoNome: "Torta de Limão (fatia)", quantidade: 4, precoUnit: 18, subtotal: 72 },
      ],
      total: 72, desconto: 0, totalFinal: 72,
      formaPagamento: "dinheiro", dataEntrega: fmt(daqui3), status: "aguardando",
      personalizacao: "", obs: "Cliente tem restrição a glúten — confirmar receita",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    },
    {
      numero: 5, clienteId: clientesRefs["Carla Rodrigues"], clienteNome: "Carla Rodrigues", clienteWhatsapp: "(11) 95555-3333",
      itens: [
        { produtoId: produtosRefs["Caixinha de Brigadeiro (20un)"], produtoNome: "Caixinha de Brigadeiro (20un)", quantidade: 2, precoUnit: 55, subtotal: 110 },
      ],
      total: 110, desconto: 0, totalFinal: 110,
      formaPagamento: "pix", dataEntrega: fmt(semanaPassada), status: "entregue",
      personalizacao: "", obs: "",
      createdAt: Timestamp.fromDate(semanaPassada), updatedAt: Timestamp.fromDate(semanaPassada),
    },
  ];

  for (const ped of pedidosData) {
    await addDoc(col(contaId, "pedidos"), { ...ped, contaId });
  }
}
