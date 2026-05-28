import axios, { AxiosError } from 'axios';

// Get the API URL from Vite environment variables or fallback to Spring Boot default
const viteEnv = (import.meta as any).env || {};
const API_URL = viteEnv.VITE_API_URL || viteEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: can be used for adding auth tokens, tenant IDs, logging
api.interceptors.request.use(
  (config) => {
    // Exemplo: se houver token no localStorage, adiciona ao Header
    const token = localStorage.getItem('gas_gestao_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: centralized error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'Ocorreu um erro inesperado no servidor.';
    
    if (error.response) {
      // O servidor respondeu com um status fora do range 2xx
      const data = error.response.data as any;
      errorMessage = data?.message || `Erro ${error.response.status}: Falha na operação.`;
      
      console.error('API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      errorMessage = 'Não foi possível conectar com o servidor Spring Boot. Verifique se o backend está rodando em http://localhost:8080';
      console.error('API Connection Error:', error.request);
    } else {
      // Erro na configuração do request
      errorMessage = error.message;
    }
    
    // Podemos integrar aqui uma chamada de Toast ou notificação global futuramente
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Controle de Modo Demo/Mock para o ambiente de preview do AI Studio.
 * Garante que o usuário consiga interagir com o sistema mesmo sem o backend Spring rodando.
 */
export const getIsDemoMode = (): boolean => {
  const stored = localStorage.getItem('gas_gestao_demo_mode');
  // Por padrão no preview habilitamos o modo de demonstração local se o backend não estiver disponível
  return stored !== 'false';
};

export const setIsDemoMode = (value: boolean): void => {
  localStorage.setItem('gas_gestao_demo_mode', String(value));
};
