import { Produto, Vasilhame, Cliente, Pedido, MovimentacaoEstoque, RegistroFinanceiro } from '../types';

// Seed data
const INITIAL_PRODUCTS: Produto[] = [
  { id: '1', nome: 'Gás Liquefeito P13 (Residencial)', tipo: 'P13', pesoKg: 13, precoVenda: 110.00, estoqueCheio: 120, estoqueVazio: 65, limiteEstoqueMinimo: 30 },
  { id: '2', nome: 'Gás Liquefeito P45 (Industrial/Comercial)', tipo: 'P45', pesoKg: 45, precoVenda: 420.00, estoqueCheio: 35, estoqueVazio: 18, limiteEstoqueMinimo: 10 },
  { id: '3', nome: 'Gás Liquefeito P20 (Empilhadeiras)', tipo: 'P20', pesoKg: 20, precoVenda: 185.00, estoqueCheio: 45, estoqueVazio: 22, limiteEstoqueMinimo: 12 },
  { id: '4', nome: 'Gás Liquefeito P5 (Residencial Pequeno)', tipo: 'P5', pesoKg: 5, precoVenda: 65.00, estoqueCheio: 25, estoqueVazio: 12, limiteEstoqueMinimo: 8 },
];

const INITIAL_CLIENTS: Cliente[] = [
  {
    id: 'c1',
    nome: 'Churrascaria do Sul Ltda',
    documento: '12.345.678/0001-99',
    telefone: '(11) 98765-4321',
    endereco: { rua: 'Av. Paulista', numero: '1500', bairro: 'Bela Vista', cidade: 'São Paulo' },
    saldoVasilhames: { P5: 0, P13: 2, P20: 0, P45: 8 },
    totalPedidos: 14,
  },
  {
    id: 'c2',
    nome: 'Condomínio Spazio Di Napoli',
    documento: '45.182.903/0001-12',
    telefone: '(11) 97722-1100',
    endereco: { rua: 'Rua das Flores', numero: '450', bairro: 'Jardins', cidade: 'São Paulo' },
    saldoVasilhames: { P5: 0, P13: 15, P20: 0, P45: 2 },
    totalPedidos: 32,
  },
  {
    id: 'c3',
    nome: 'Maria de Lurdes da Silva',
    documento: '111.222.333-44',
    telefone: '(11) 96111-2233',
    endereco: { rua: 'Rua São João', numero: '25', bairro: 'Brás', cidade: 'São Paulo' },
    saldoVasilhames: { P5: 1, P13: 1, P20: 0, P45: 0 },
    totalPedidos: 8,
  },
  {
    id: 'c4',
    nome: 'Empilhadeiras Logtech Brasil',
    documento: '09.876.543/0001-01',
    telefone: '(11) 95555-8888',
    endereco: { rua: 'Av. Industrial', numero: '1020', bairro: 'Lapa', cidade: 'São Paulo' },
    saldoVasilhames: { P5: 0, P13: 0, P20: 12, P45: 0 },
    totalPedidos: 21,
  }
];

const INITIAL_VASILHAMES: Vasilhame[] = [
  { id: 'v1', tipo: 'P13', marca: 'Ultragaz', status: 'CHEIO_ENTREPOSTO', dataMovimentacao: '2026-05-25T10:00:00Z' },
  { id: 'v2', tipo: 'P13', marca: 'Liquigás', status: 'CHEIO_ENTREPOSTO', dataMovimentacao: '2026-05-25T11:00:00Z' },
  { id: 'v3', tipo: 'P13', marca: 'NacionalGas', status: 'VAZIO_ENTREPOSTO', dataMovimentacao: '2026-05-26T09:30:00Z' },
  { id: 'v4', tipo: 'P45', marca: 'Supergasbras', status: 'CHEIO_ENTREPOSTO', dataMovimentacao: '2026-05-24T08:15:00Z' },
  { id: 'v5', tipo: 'P45', marca: 'Ultragaz', status: 'EM_CLIENTE', clienteId: 'c1', dataMovimentacao: '2026-05-20T14:20:00Z' },
  { id: 'v6', tipo: 'P20', marca: 'Copagaz', status: 'CHEIO_ENTREPOSTO', dataMovimentacao: '2026-05-26T15:00:00Z' },
  { id: 'v7', tipo: 'P13', marca: 'Ultragaz', status: 'DANIFICADO', dataMovimentacao: '2026-05-18T11:45:00Z' },
];

const INITIAL_PEDIDOS: Pedido[] = [
  {
    id: 'PED-101',
    clienteId: 'c1',
    clienteNome: 'Churrascaria do Sul Ltda',
    itens: [
      { produtoId: '2', produtoNome: 'Gás Liquefeito P45 (Industrial/Comercial)', quantidade: 2, valorUnitario: 420.00, trocaVasilhame: true }
    ],
    status: 'ENTREGUE',
    formaPagamento: 'FATURADO',
    valorTotal: 840.00,
    entregador: 'Marcos Almeida (Caminhão 01)',
    dataPedido: '2026-05-27T14:30:00Z',
    dataEntrega: '2026-05-27T16:00:00Z'
  },
  {
    id: 'PED-102',
    clienteId: 'c3',
    clienteNome: 'Maria de Lurdes da Silva',
    itens: [
      { produtoId: '1', produtoNome: 'Gás Liquefeito P13 (Residencial)', quantidade: 1, valorUnitario: 110.00, trocaVasilhame: true }
    ],
    status: 'EM_ROTA',
    formaPagamento: 'PIX',
    valorTotal: 110.00,
    entregador: 'Claudio Motoqueiro',
    dataPedido: '2026-05-28T05:15:00Z'
  },
  {
    id: 'PED-103',
    clienteId: 'c2',
    clienteNome: 'Condomínio Spazio Di Napoli',
    itens: [
      { produtoId: '1', produtoNome: 'Gás Liquefeito P13 (Residencial)', quantidade: 5, valorUnitario: 105.00, trocaVasilhame: true }
    ],
    status: 'PENDENTE',
    formaPagamento: 'DEBITO',
    valorTotal: 525.00,
    dataPedido: '2026-05-28T05:55:00Z'
  },
  {
    id: 'PED-104',
    clienteId: 'c4',
    clienteNome: 'Empilhadeiras Logtech Brasil',
    itens: [
      { produtoId: '3', produtoNome: 'Gás Liquefeito P20 (Empilhadeiras)', quantidade: 4, valorUnitario: 185.00, trocaVasilhame: false }
    ],
    status: 'PREPARANDO',
    formaPagamento: 'FATURADO',
    valorTotal: 740.00,
    dataPedido: '2026-05-28T04:20:00Z'
  }
];

const INITIAL_MOVIMENTACOES: MovimentacaoEstoque[] = [
  { id: 'm1', tipo: 'ENTRADA_COMPRA', produtoId: '1', tipoVasilhame: 'P13', quantidade: 50, detalhes: 'Carga recebida da distribuidora Ultragaz', usuario: 'Gerente Carlos', dataHora: '2026-05-25T08:00:00Z' },
  { id: 'm2', tipo: 'SAIDA_VENDA', produtoId: '1', tipoVasilhame: 'P13', quantidade: 1, detalhes: 'Venda entrega rápida para Maria de Lurdes', usuario: 'Atendente Julia', dataHora: '2026-05-28T05:15:00Z' },
  { id: 'm3', tipo: 'RETORNO_VAZIO', produtoId: '1', tipoVasilhame: 'P13', quantidade: 1, detalhes: 'Troca de cilindro P13 recolhida', usuario: 'Claudio Motoqueiro', dataHora: '2026-05-27T18:00:00Z' },
  { id: 'm4', tipo: 'ENVIO_CARGA_SUPPLIER', produtoId: '2', tipoVasilhame: 'P45', quantidade: 10, detalhes: 'Remessa de vasilhames vazios para envasar', usuario: 'Gerente Carlos', dataHora: '2026-05-26T11:00:00Z' },
];

const INITIAL_FINANCEIRO: RegistroFinanceiro[] = [
  { id: 'f1', tipo: 'RECEITA', categoria: 'Venda de Gás', descricao: 'Recebimento PED-101 (Churrascaria do Sul)', valor: 840.00, formaPagamento: 'BOLETO', dataHora: '2026-05-27T16:00:00Z', status: 'PAGO' },
  { id: 'f2', tipo: 'DESPESA', categoria: 'Combustível', descricao: 'Abastecimento Caminhão 01', valor: 350.00, formaPagamento: 'CREDITO', dataHora: '2026-05-26T10:00:00Z', status: 'PAGO' },
  { id: 'f3', tipo: 'DESPESA', categoria: 'Compra de Gás', descricao: 'Remessa de compra 50 cilindros P13 cheios', valor: 3250.00, formaPagamento: 'PIX', dataHora: '2026-05-25T08:15:00Z', status: 'PAGO' },
  { id: 'f4', tipo: 'RECEITA', categoria: 'Venda de Gás', descricao: 'Venda avulsa 1 cilindro P13 balcão', valor: 110.00, formaPagamento: 'DINHEIRO', dataHora: '2026-05-28T03:00:00Z', status: 'PAGO' },
  { id: 'f5', tipo: 'RECEITA', categoria: 'Venda de Gás', descricao: 'Previsão de pagamento PED-103 (Cond. Spazio)', valor: 525.00, formaPagamento: 'DEBITO', dataHora: '2026-05-28T05:55:00Z', status: 'PENDENTE' },
];

// LocalDatabase Class to handle CRUD on localstorage
class LocalDatabase {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem('gas_app_produtos')) {
      localStorage.setItem('gas_app_produtos', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem('gas_app_clientes')) {
      localStorage.setItem('gas_app_clientes', JSON.stringify(INITIAL_CLIENTS));
    }
    if (!localStorage.getItem('gas_app_vasilhames')) {
      localStorage.setItem('gas_app_vasilhames', JSON.stringify(INITIAL_VASILHAMES));
    }
    if (!localStorage.getItem('gas_app_pedidos')) {
      localStorage.setItem('gas_app_pedidos', JSON.stringify(INITIAL_PEDIDOS));
    }
    if (!localStorage.getItem('gas_app_movimentacoes')) {
      localStorage.setItem('gas_app_movimentacoes', JSON.stringify(INITIAL_MOVIMENTACOES));
    }
    if (!localStorage.getItem('gas_app_financeiro')) {
      localStorage.setItem('gas_app_financeiro', JSON.stringify(INITIAL_FINANCEIRO));
    }
  }

  // Generic getter/setter
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- PRODUTOS ---
  getProdutos(): Produto[] { return this.get<Produto>('gas_app_produtos'); }
  saveProdutos(data: Produto[]): void { this.set<Produto>('gas_app_produtos', data); }

  // --- CLIENTES ---
  getClientes(): Cliente[] { return this.get<Cliente>('gas_app_clientes'); }
  saveClientes(data: Cliente[]): void { this.set<Cliente>('gas_app_clientes', data); }

  // --- VASILHAMES ---
  getVasilhames(): Vasilhame[] { return this.get<Vasilhame>('gas_app_vasilhames'); }
  saveVasilhames(data: Vasilhame[]): void { this.set<Vasilhame>('gas_app_vasilhames', data); }

  // --- PEDIDOS ---
  getPedidos(): Pedido[] { return this.get<Pedido>('gas_app_pedidos'); }
  savePedidos(data: Pedido[]): void { this.set<Pedido>('gas_app_pedidos', data); }

  // --- MOVIMENTACOES ---
  getMovimentacoes(): MovimentacaoEstoque[] { return this.get<MovimentacaoEstoque>('gas_app_movimentacoes'); }
  saveMovimentacoes(data: MovimentacaoEstoque[]): void { this.set<MovimentacaoEstoque>('gas_app_movimentacoes', data); }

  // --- FINANCEIRO ---
  getFinanceiro(): RegistroFinanceiro[] { return this.get<RegistroFinanceiro>('gas_app_financeiro'); }
  saveFinanceiro(data: RegistroFinanceiro[]): void { this.set<RegistroFinanceiro>('gas_app_financeiro', data); }
}

export const db = new LocalDatabase();
