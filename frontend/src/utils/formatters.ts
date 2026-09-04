// export const formatCurrency = (value: number) => {
//   return new Intl.NumberFormat('pt-BR', {
//     style: 'currency',
//     currency: 'BRL',
//   }).format(value);
// };

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

export const formatCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

/**
 * Formata um número para exibição como moeda (R$)
 * Exemplo: 12345.60 → "R$ 12.345,60"
 */
export const formatCurrency = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return `R$ ${numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

/**
 * Formata um número para exibição como moeda sem o símbolo R$
 */
export const formatCurrencyWithoutSymbol = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return '0,00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00';
  
  return numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};