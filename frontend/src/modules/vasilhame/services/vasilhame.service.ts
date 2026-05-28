import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { Vasilhame, StatusVasilhame } from '../../../types';

export const vasilhameService = {
  async listar(): Promise<Vasilhame[]> {
    if (getIsDemoMode()) {
      return db.getVasilhames();
    }
    const response = await api.get<Vasilhame[]>('/vasilhame');
    return response.data;
  },

  async buscarPorId(id: string): Promise<Vasilhame> {
    if (getIsDemoMode()) {
      const v = db.getVasilhames().find(item => item.id === id);
      if (!v) throw new Error('Vasilhame não encontrado');
      return v;
    }
    const response = await api.get<Vasilhame>(`/vasilhame/${id}`);
    return response.data;
  },

  async criar(vasilhame: Omit<Vasilhame, 'id' | 'dataMovimentacao'>): Promise<Vasilhame> {
    if (getIsDemoMode()) {
      const vasilhames = db.getVasilhames();
      const novo: Vasilhame = {
        ...vasilhame,
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        dataMovimentacao: new Date().toISOString(),
      };
      vasilhames.push(novo);
      db.saveVasilhames(vasilhames);
      
      // Atualizar o estoque do produto correlato
      const produtos = db.getProdutos();
      const prod = produtos.find(p => p.tipo === novo.tipo);
      if (prod) {
        if (novo.status === 'CHEIO_ENTREPOSTO') prod.estoqueCheio += 1;
        if (novo.status === 'VAZIO_ENTREPOSTO') prod.estoqueVazio += 1;
        db.saveProdutos(produtos);
      }

      return novo;
    }
    const response = await api.post<Vasilhame>('/vasilhame', vasilhame);
    return response.data;
  },

  async atualizar(id: string, vasilhame: Partial<Vasilhame>): Promise<Vasilhame> {
    if (getIsDemoMode()) {
      const vasilhames = db.getVasilhames();
      const idx = vasilhames.findIndex(item => item.id === id);
      if (idx === -1) throw new Error('Vasilhame não encontrado');
      
      const anterior = vasilhames[idx];
      const atualizado = { 
        ...anterior, 
        ...vasilhame,
        dataMovimentacao: new Date().toISOString() 
      };
      
      vasilhames[idx] = atualizado;
      db.saveVasilhames(vasilhames);

      // Ajustar estoques se o status mudou
      if (vasilhame.status && vasilhame.status !== anterior.status) {
        const produtos = db.getProdutos();
        const prod = produtos.find(p => p.tipo === atualizado.tipo);
        if (prod) {
          // Decrementa antigo
          if (anterior.status === 'CHEIO_ENTREPOSTO') prod.estoqueCheio = Math.max(0, prod.estoqueCheio - 1);
          if (anterior.status === 'VAZIO_ENTREPOSTO') prod.estoqueVazio = Math.max(0, prod.estoqueVazio - 1);
          
          // Incrementa novo
          if (atualizado.status === 'CHEIO_ENTREPOSTO') prod.estoqueCheio += 1;
          if (atualizado.status === 'VAZIO_ENTREPOSTO') prod.estoqueVazio += 1;
          db.saveProdutos(produtos);
        }
      }

      return atualizado;
    }
    const response = await api.put<Vasilhame>(`/vasilhame/${id}`, vasilhame);
    return response.data;
  },

  async remover(id: string): Promise<void> {
    if (getIsDemoMode()) {
      const vasilhames = db.getVasilhames();
      const anterior = vasilhames.find(item => item.id === id);
      const filtrados = vasilhames.filter(item => item.id !== id);
      db.saveVasilhames(filtrados);

      if (anterior) {
        const produtos = db.getProdutos();
        const prod = produtos.find(p => p.tipo === anterior.tipo);
        if (prod) {
          if (anterior.status === 'CHEIO_ENTREPOSTO') prod.estoqueCheio = Math.max(0, prod.estoqueCheio - 1);
          if (anterior.status === 'VAZIO_ENTREPOSTO') prod.estoqueVazio = Math.max(0, prod.estoqueVazio - 1);
          db.saveProdutos(produtos);
        }
      }
      return;
    }
    await api.delete(`/vasilhame/${id}`);
  },

  // Ajustar múltiplos vasilhames (enviar para envasar / retorno)
  async movimentarLote(tipo: 'P5' | 'P13' | 'P20' | 'P45', quantidade: number, deStatus: StatusVasilhame, paraStatus: StatusVasilhame): Promise<void> {
    if (getIsDemoMode()) {
      const vasilhames = db.getVasilhames();
      let alterados = 0;
      
      const novosVasilhames = vasilhames.map(v => {
        if (v.tipo === tipo && v.status === deStatus && alterados < quantidade) {
          alterados++;
          return {
            ...v,
            status: paraStatus,
            dataMovimentacao: new Date().toISOString()
          };
        }
        return v;
      });

      db.saveVasilhames(novosVasilhames);

      // Ajustar estoque geral
      const produtos = db.getProdutos();
      const prod = produtos.find(p => p.tipo === tipo);
      if (prod) {
        if (deStatus === 'CHEIO_ENTREPOSTO') prod.estoqueCheio = Math.max(0, prod.estoqueCheio - alterados);
        if (deStatus === 'VAZIO_ENTREPOSTO') prod.estoqueVazio = Math.max(0, prod.estoqueVazio - alterados);
        
        if (paraStatus === 'CHEIO_ENTREPOSTO') prod.estoqueCheio += alterados;
        if (paraStatus === 'VAZIO_ENTREPOSTO') prod.estoqueVazio += alterados;
        db.saveProdutos(produtos);
      }
      return;
    }
    
    // Na API real, faria uma chamada dedicada de lote
    await api.post('/vasilhame/movimentar-lote', { tipo, quantidade, deStatus, paraStatus });
  }
};
