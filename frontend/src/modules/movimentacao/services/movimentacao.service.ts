import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { MovimentacaoEstoque } from '../../../types';

export const movimentacaoService = {
  async listar(): Promise<MovimentacaoEstoque[]> {
    if (getIsDemoMode()) {
      return db.getMovimentacoes().sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    }
    const response = await api.get<MovimentacaoEstoque[]>('/movimentacao');
    return response.data;
  },

  async buscarPorId(id: string): Promise<MovimentacaoEstoque> {
    if (getIsDemoMode()) {
      const m = db.getMovimentacoes().find(item => item.id === id);
      if (!m) throw new Error('Movimentação não encontrada');
      return m;
    }
    const response = await api.get<MovimentacaoEstoque>(`/movimentacao/${id}`);
    return response.data;
  },

  async criar(movimentacao: Omit<MovimentacaoEstoque, 'id' | 'dataHora'>): Promise<MovimentacaoEstoque> {
    if (getIsDemoMode()) {
      const movimentacoes = db.getMovimentacoes();
      const novo: MovimentacaoEstoque = {
        ...movimentacao,
        id: 'mov-' + Math.random().toString(36).substring(2, 7),
        dataHora: new Date().toISOString(),
      };
      movimentacoes.push(novo);
      db.saveMovimentacoes(movimentacoes);

      // Ajustar o estoque físico de cheios e vazios
      const produtos = db.getProdutos();
      const prod = produtos.find(p => p.id === novo.produtoId || p.tipo === novo.tipoVasilhame);
      
      if (prod) {
        if (novo.tipo === 'ENTRADA_COMPRA') {
          prod.estoqueCheio += novo.quantidade;
        } else if (novo.tipo === 'SAIDA_VENDA') {
          prod.estoqueCheio = Math.max(0, prod.estoqueCheio - novo.quantidade);
        } else if (novo.tipo === 'RETORNO_VAZIO') {
          prod.estoqueVazio += novo.quantidade;
        } else if (novo.tipo === 'ENVIO_CARGA_SUPPLIER') {
          // tirou do entreposto para envasar no fornecedor
          prod.estoqueVazio = Math.max(0, prod.estoqueVazio - novo.quantidade);
        } else if (novo.tipo === 'RETORNO_CHEIO') {
          // retornou cheio do fornecedor
          prod.estoqueCheio += novo.quantidade;
        } else if (novo.tipo === 'PERDA_DANIFICADO') {
          prod.estoqueCheio = Math.max(0, prod.estoqueCheio - novo.quantidade);
        }
        db.saveProdutos(produtos);
      }

      return novo;
    }
    const response = await api.post<MovimentacaoEstoque>('/movimentacao', movimentacao);
    return response.data;
  }
};
