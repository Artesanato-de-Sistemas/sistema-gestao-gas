import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { Produto } from '../../../types';

export const produtoService = {
  async listar(): Promise<Produto[]> {
    if (getIsDemoMode()) {
      return db.getProdutos();
    }
    const response = await api.get<Produto[]>('/produto');
    return response.data;
  },

  async buscarPorId(id: string): Promise<Produto> {
    if (getIsDemoMode()) {
      const p = db.getProdutos().find(item => item.id === id);
      if (!p) throw new Error('Produto não encontrado');
      return p;
    }
    const response = await api.get<Produto>(`/produto/${id}`);
    return response.data;
  },

  async criar(produto: Omit<Produto, 'id'>): Promise<Produto> {
    if (getIsDemoMode()) {
      const produtos = db.getProdutos();
      const novo: Produto = {
        ...produto,
        id: Math.random().toString(36).substring(2, 9),
      };
      produtos.push(novo);
      db.saveProdutos(produtos);
      
      // Registrar movimentação de estoque inicial automatizada se houver estoque
      const movimentacoes = db.getMovimentacoes();
      if (novo.estoqueCheio > 0) {
        movimentacoes.push({
          id: 'mov-' + Math.random().toString(36).substring(2, 7),
          tipo: 'ENTRADA_COMPRA',
          produtoId: novo.id,
          tipoVasilhame: novo.tipo,
          quantidade: novo.estoqueCheio,
          detalhes: `Estoque cheio inicial do produto ${novo.nome}`,
          usuario: 'Sistema GásGestão',
          dataHora: new Date().toISOString()
        });
      }
      db.saveMovimentacoes(movimentacoes);
      return novo;
    }
    const response = await api.post<Produto>('/produto', produto);
    return response.data;
  },

  async atualizar(id: string, produto: Partial<Produto>): Promise<Produto> {
    if (getIsDemoMode()) {
      const produtos = db.getProdutos();
      const idx = produtos.findIndex(item => item.id === id);
      if (idx === -1) throw new Error('Produto não encontrado');
      
      const atualizado = { ...produtos[idx], ...produto };
      produtos[idx] = atualizado;
      db.saveProdutos(produtos);
      return atualizado;
    }
    const response = await api.put<Produto>(`/produto/${id}`, produto);
    return response.data;
  },

  async remover(id: string): Promise<void> {
    if (getIsDemoMode()) {
      const produtos = db.getProdutos();
      const filtrados = produtos.filter(item => item.id !== id);
      db.saveProdutos(filtrados);
      return;
    }
    await api.delete(`/produto/${id}`);
  }
};
