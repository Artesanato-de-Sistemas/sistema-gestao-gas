/**
 * Core Types for GásGestão Operational System
 */

export type StatusVasilhame = 'CHEIO_ENTREPOSTO' | 'VAZIO_ENTREPOSTO' | 'EM_CLIENTE' | 'DANIFICADO';

export interface Produto {
  id: string;
  nome: string;
  tipo: 'P5' | 'P13' | 'P20' | 'P45';
  pesoKg: number;
  precoVenda: number;
  estoqueCheio: number;
  estoqueVazio: number;
  limiteEstoqueMinimo: number;
}

export interface Vasilhame {
  id: string;
  tipo: 'P5' | 'P13' | 'P20' | 'P45';
  marca: string;
  status: StatusVasilhame;
  clienteId?: string; // se estiver com o cliente
  dataMovimentacao: string;
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string; // CPF ou CNPJ
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
  };
  // Saldo de vasilhames que estão em posse deste cliente
  saldoVasilhames: {
    P5: number;
    P13: number;
    P20: number;
    P45: number;
  };
  totalPedidos: number;
}

export type StatusPedido = 'PENDENTE' | 'PREPARANDO' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';

export interface ItemPedido {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
  trocaVasilhame: boolean; // se o cliente vai devolver um vasilhame vazio
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: ItemPedido[];
  status: StatusPedido;
  formaPagamento: 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'FATURADO';
  valorTotal: number;
  entregador?: string;
  dataPedido: string;
  dataEntrega?: string;
}

export interface MovimentacaoEstoque {
  id: string;
  tipo: 'ENTRADA_COMPRA' | 'SAIDA_VENDA' | 'RETORNO_VAZIO' | 'RETORNO_CHEIO' | 'ENVIO_CARGA_SUPPLIER' | 'PERDA_DANIFICADO';
  produtoId?: string;
  tipoVasilhame: 'P5' | 'P13' | 'P20' | 'P45';
  quantidade: number;
  detalhes: string;
  usuario: string;
  dataHora: string;
}

export interface RegistroFinanceiro {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string; // Venda, Frete, Compra de Gás, Manutenção, Combustível, etc.
  descricao: string;
  valor: number;
  formaPagamento: 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'BOLETO';
  dataHora: string;
  status: 'PAGO' | 'PENDENTE';
}
