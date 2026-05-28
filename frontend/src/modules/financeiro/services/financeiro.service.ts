import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { RegistroFinanceiro } from '../../../types';

export const financeiroService = {
  async listar(): Promise<RegistroFinanceiro[]> {
    if (getIsDemoMode()) {
      return db.getFinanceiro().sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    }
    const response = await api.get<RegistroFinanceiro[]>('/financeiro');
    return response.data;
  },

  async buscarPorId(id: string): Promise<RegistroFinanceiro> {
    if (getIsDemoMode()) {
      const f = db.getFinanceiro().find(item => item.id === id);
      if (!f) throw new Error('Registro financeiro não encontrado');
      return f;
    }
    const response = await api.get<RegistroFinanceiro>(`/financeiro/${id}`);
    return response.data;
  },

  async criar(registro: Omit<RegistroFinanceiro, 'id' | 'dataHora'>): Promise<RegistroFinanceiro> {
    if (getIsDemoMode()) {
      const financeiro = db.getFinanceiro();
      const novo: RegistroFinanceiro = {
        ...registro,
        id: 'fin-' + Math.random().toString(36).substring(2, 7),
        dataHora: new Date().toISOString(),
      };
      financeiro.push(novo);
      db.saveFinanceiro(financeiro);
      return novo;
    }
    const response = await api.post<RegistroFinanceiro>('/financeiro', registro);
    return response.data;
  },

  async conciliar(id: string): Promise<RegistroFinanceiro> {
    if (getIsDemoMode()) {
      const financeiro = db.getFinanceiro();
      const idx = financeiro.findIndex(f => f.id === id);
      if (idx === -1) throw new Error('Registro não encontrado');
      financeiro[idx].status = 'PAGO';
      db.saveFinanceiro(financeiro);
      return financeiro[idx];
    }
    const response = await api.post<RegistroFinanceiro>(`/financeiro/${id}/conciliar`, {});
    return response.data;
  },

  async remover(id: string): Promise<void> {
    if (getIsDemoMode()) {
      const financeiro = db.getFinanceiro();
      const filtrados = financeiro.filter(f => f.id !== id);
      db.saveFinanceiro(filtrados);
      return;
    }
    await api.delete(`/financeiro/${id}`);
  }
};
