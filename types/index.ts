// ─── USUÁRIO / CONTA ─────────────────────────────────────────────────────────
export interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

export interface Conta {
  id: string;
  nome: string;
  telefone?: string;
  instagram?: string;
  fcmToken?: string;
  custosFixos?: CustoFixo[];
  createdAt: Date;
  ativo: boolean;
}

// ─── CLIENTE ─────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string;
  contaId: string;
  nome: string;
  whatsapp: string;
  instagram?: string;
  bairro?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  cidade?: string;
  comoEncontrou?: string;
  restricoes?: string;
  createdAt: Date;
}

// ─── INSUMO (ESTOQUE) ─────────────────────────────────────────────────────────
export interface Insumo {
  id: string;
  contaId: string;
  nome: string;
  categoria: string;
  unidade: string;
  equivalencia?: { quantidade: number; unidade: string };
  estoque: number;
  estoqueMinimo: number;
  custoPorUnidade: number;
  fornecedor?: string;
  ativo: boolean;
}

// ─── RECEITA ─────────────────────────────────────────────────────────────────
export interface IngredienteReceita {
  insumoId: string;
  insumoNome: string;
  quantidade: number;
  unidade: string;
}

export interface Receita {
  id: string;
  contaId: string;
  nome: string;
  categoria: "Confeitaria" | "Salgado" | "Panificado" | "Outro";
  rendimento: number;
  unidadeRendimento: string;
  tempoPreparo?: string;
  modoPreparo?: string;
  ingredientes: IngredienteReceita[];
  custoTotal: number;
  custoPorUnidade: number;
  ativo: boolean;
  createdAt: Date;
}

// ─── PRODUTO ─────────────────────────────────────────────────────────────────
export interface ReceitaVinculada {
  receitaId: string;
  receitaNome: string;
  qtdPorUnidade?: number;
}

export interface Produto {
  id: string;
  contaId: string;
  nome: string;
  categoria: "Confeitaria" | "Salgado" | "Panificado" | "Kit" | "Outro";
  unidadeVenda: string;
  precoVenda: number;
  receitaId?: string;
  receitaNome?: string;
  receitasVinculadas?: ReceitaVinculada[];
  custoProduto: number;
  cmvPercent: number;
  descricao?: string;
  imagemUrl?: string;
  prazoProduzDias: number;
  status: "ativo" | "encomenda" | "inativo";
  createdAt: Date;
}

// ─── PEDIDO ──────────────────────────────────────────────────────────────────
export type StatusPedido = "aguardando" | "producao" | "pronto" | "entregue" | "cancelado";

export interface ItemPedido {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  contaId: string;
  numero: number;
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string;
  itens: ItemPedido[];
  total: number;
  desconto: number;
  totalFinal: number;
  formaPagamento: string;
  pago?: boolean;
  dataEntrega: string;
  status: StatusPedido;
  obs?: string;
  personalizacao?: string;
  enderecoEntrega?: string;
  createdAt: Date;
  updatedAt: Date;
}
