import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { Pedido, StatusPedido } from '../../../types';

export const pedidoService = {
  async listar(): Promise<Pedido[]> {
    if (getIsDemoMode()) {
      // Ordena por data decrescente
      return db.getPedidos().sort((a, b) => b.dataPedido.localeCompare(a.dataPedido));
    }
    const response = await api.get<Pedido[]>('/pedido');
    return response.data;
  },

  async buscarPorId(id: string): Promise<Pedido> {
    if (getIsDemoMode()) {
      const p = db.getPedidos().find(item => item.id === id);
      if (!p) throw new Error('Pedido não encontrado');
      return p;
    }
    const response = await api.get<Pedido>(`/pedido/${id}`);
    return response.data;
  },

  async criar(pedido: Omit<Pedido, 'id' | 'dataPedido' | 'status'>): Promise<Pedido> {
    if (getIsDemoMode()) {
      const pedidos = db.getPedidos();
      const novo: Pedido = {
        ...pedido,
        id: 'PED-' + Math.floor(Math.random() * 900 + 100),
        status: 'PENDENTE',
        dataPedido: new Date().toISOString(),
      };
      
      pedidos.push(novo);
      db.savePedidos(pedidos);

      // Incrementar o contador de pedidos do cliente
      const clientes = db.getClientes();
      const cliIdx = clientes.findIndex(c => c.id === novo.clienteId);
      if (cliIdx !== -1) {
        clientes[cliIdx].totalPedidos += 1;
        db.saveClientes(clientes);
      }

      return novo;
    }
    const response = await api.post<Pedido>('/pedido', pedido);
    return response.data;
  },

  async atualizar(id: string, partial: Partial<Pedido>): Promise<Pedido> {
    if (getIsDemoMode()) {
      const pedidos = db.getPedidos();
      const idx = pedidos.findIndex(item => item.id === id);
      if (idx === -1) throw new Error('Pedido não encontrado');
      
      const anterior = pedidos[idx];
      const atualizado = { ...anterior, ...partial };
      
      if (partial.status && partial.status !== anterior.status) {
        // Lógica de estoque acionada na transição para 'ENTREGUE' ou 'CANCELADO'
        this.processarEstoqueETransicao(anterior, partial.status, partial.entregador);
      }

      pedidos[idx] = atualizado;
      db.savePedidos(pedidos);
      return atualizado;
    }
    const response = await api.put<Pedido>(`/pedido/${id}`, partial);
    return response.data;
  },

  async remover(id: string): Promise<void> {
    if (getIsDemoMode()) {
      const pedidos = db.getPedidos();
      const filtrados = pedidos.filter(item => item.id !== id);
      db.savePedidos(filtrados);
      return;
    }
    await api.delete(`/pedido/${id}`);
  },

  // Processamento operacional realista de estoque ao entregar ou cancelar pedidos
  processarEstoqueETransicao(pedido: Pedido, novoStatus: StatusPedido, entregador?: string): void {
    const produtos = db.getProdutos();
    const clientes = db.getClientes();
    const movimentacoes = db.getMovimentacoes();
    const financeiro = db.getFinanceiro();

    // Se o pedido foi ENTREGUE
    if (novoStatus === 'ENTREGUE') {
      // 1. Atualizar data de entrega
      pedido.dataEntrega = new Date().toISOString();
      if (entregador) pedido.entregador = entregador;

      // 2. Dar baixa em estoque de cheios e atualizar vazio se houver troca
      pedido.itens.forEach(item => {
        const prod = produtos.find(p => p.id === item.produtoId);
        if (prod) {
          // Subtrai cheios do estoque
          prod.estoqueCheio = Math.max(0, prod.estoqueCheio - item.quantidade);
          
          if (item.trocaVasilhame) {
            // Se o motorista buscou um vazio, entra no estoque de vazios
            prod.estoqueVazio += item.quantidade;
            
            // Registra movimento de retorno de vasilhame vazio
            movimentacoes.push({
              id: 'mov-' + Math.random().toString(36).substring(2, 7),
              tipo: 'RETORNO_VAZIO',
              produtoId: prod.id,
              tipoVasilhame: prod.tipo,
              quantidade: item.quantidade,
              detalhes: `Troca recolhida no pedido ${pedido.id} por ${pedido.entregador || 'entregador'}`,
              usuario: 'Operação GásGestão',
              dataHora: new Date().toISOString()
            });
          } else {
            // Se NÃO houve troca, o cliente "pegou emprestado" ou comprou o vasilhame comodato.
            // O saldo de vasilhames que estão EM POSSE do cliente aumenta
            const cli = clientes.find(c => c.id === pedido.clienteId);
            if (cli) {
              const tipoGas = prod.tipo as 'P5' | 'P13' | 'P20' | 'P45';
              cli.saldoVasilhames[tipoGas] = (cli.saldoVasilhames[tipoGas] || 0) + item.quantidade;
            }
          }

          // Registrar movimento da venda (Saída)
          movimentacoes.push({
            id: 'mov-' + Math.random().toString(36).substring(2, 7),
            tipo: 'SAIDA_VENDA',
            produtoId: prod.id,
            tipoVasilhame: prod.tipo,
            quantidade: item.quantidade,
            detalhes: `Venda registrada no pedido ${pedido.id}`,
            usuario: 'Operação GásGestão',
            dataHora: new Date().toISOString()
          });
        }
      });

      // 3. Gerar registro correspondente no Financeiro
      financeiro.push({
        id: 'fin-' + Math.random().toString(36).substring(2, 7),
        tipo: 'RECEITA',
        categoria: 'Venda de Gás',
        descricao: `Recebimento Ref. Pedido ${pedido.id} (${pedido.clienteNome})`,
        valor: pedido.valorTotal,
        formaPagamento: pedido.formaPagamento === 'FATURADO' ? 'BOLETO' : (pedido.formaPagamento as any),
        dataHora: new Date().toISOString(),
        status: pedido.formaPagamento === 'FATURADO' ? 'PENDENTE' : 'PAGO'
      });

      // Salvar
      db.saveProdutos(produtos);
      db.saveClientes(clientes);
      db.saveMovimentacoes(movimentacoes);
      db.saveFinanceiro(financeiro);
    }
  }
};
