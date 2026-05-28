import { api, getIsDemoMode } from '../../../services/api';
import { db } from '../../../services/localDb';
import { Cliente } from '../../../types';

export const clienteService = {
  async listar(): Promise<Cliente[]> {
    if (getIsDemoMode()) {
      return db.getClientes();
    }
    const response = await api.get<Cliente[]>('/cliente');
    return response.data;
  },

  async buscarPorId(id: string): Promise<Cliente> {
    if (getIsDemoMode()) {
      const c = db.getClientes().find(item => item.id === id);
      if (!c) throw new Error('Cliente não encontrado');
      return c;
    }
    const response = await api.get<Cliente>(`/cliente/${id}`);
    return response.data;
  },

  async criar(cliente: Omit<Cliente, 'id' | 'totalPedidos'>): Promise<Cliente> {
    if (getIsDemoMode()) {
      const clientes = db.getClientes();
      const novo: Cliente = {
        ...cliente,
        id: 'c' + Math.random().toString(36).substring(2, 7),
        totalPedidos: 0,
      };
      clientes.push(novo);
      db.saveClientes(clientes);
      return novo;
    }
    const response = await api.post<Cliente>('/cliente', cliente);
    return response.data;
  },

  async atualizar(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    if (getIsDemoMode()) {
      const clientes = db.getClientes();
      const idx = clientes.findIndex(item => item.id === id);
      if (idx === -1) throw new Error('Cliente não encontrado');
      
      const atualizado = { ...clientes[idx], ...cliente };
      clientes[idx] = atualizado;
      db.saveClientes(clientes);
      return atualizado;
    }
    const response = await api.put<Cliente>(`/cliente/${id}`, cliente);
    return response.data;
  },

  async remover(id: string): Promise<void> {
    if (getIsDemoMode()) {
      const clientes = db.getClientes();
      const filtrados = clientes.filter(item => item.id !== id);
      db.saveClientes(filtrados);
      return;
    }
    await api.delete(`/cliente/${id}`);
  }
};
