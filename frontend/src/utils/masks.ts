export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (v.length <= 10) {
    // Fixo
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    // Celular
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

export const maskPlate = (value: string) => {
  // Accepted formats: AAA-1111 or AAA-1A11
  let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v.length > 7) v = v.slice(0, 7);
  if (v.length > 3) {
    v = v.replace(/^([A-Z]{3})([A-Z0-9]*)$/, '$1-$2');
  }
  return v;
};

export const maskNF = (value: string) => {
  let v = value.replace(/\D/g, '');
  return `NF${v.padStart(8, '0')}`;
};

export const maskNFInput = (value: string) => {
  let v = value.replace(/[^0-9]/g, '');
  if (v) {
      return `NF${v}`;
  }
  return '';
}

export const maskCurrency = (value: string | number) => {
  if (value === undefined || value === null) return '';
  
  let stringValue = value.toString();
  
  // If it's a number (from DB), it might be 10.5 => '1050' to format
  if (typeof value === 'number') {
     stringValue = value.toFixed(2).replace('.', '');
  } else {
     stringValue = stringValue.replace(/\D/g, '');
  }
  
  if (!stringValue) return '';
  
  const numericValue = (parseInt(stringValue, 10) / 100).toFixed(2);
  return numericValue.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseCurrency = (value: string) => {
  if (!value) return 0;
  const numericStr = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(numericStr) || 0;
};

/**
 * Formata um valor para exibição com 2 casas decimais
 * Exemplo: 1234560 → 12.345,60
 */
export const formatCurrencyDisplay = (value: number | string): string => {
  if (!value) return '0,00';
  
  // Se for string, converter para número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00';
  
  // Formatar com 2 casas decimais e substituir . por ,
  return numValue.toFixed(2).replace('.', ',');
};

/**
 * Máscara para campos de valor monetário com vírgula
 * Permite digitar sem vírgula e formata automaticamente
 * Exemplo: "1234560" → "12.345,60"
 */
export const maskCurrencyInput = (value: string): string => {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  if (numbers === '') return '0,00';
  
  // Converte para número e divide por 100 para ter 2 casas decimais
  const numValue = parseInt(numbers) / 100;
  
  // Formata com 2 casas decimais
  return numValue.toFixed(2).replace('.', ',');
};

/**
 * Converte valor formatado para número (sem vírgula)
 * Exemplo: "12.345,60" → 12345.60
 */
export const parseCurrencyValue = (value: string): number => {
  if (!value) return 0;
  
  // Remove pontos de milhar e substitui vírgula por ponto
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
};

/**
 * Converte número para valor com vírgula
 * Exemplo: 12345.60 → "12.345,60"
 */
export const numberToCurrency = (value: number): string => {
  if (!value || isNaN(value)) return '0,00';
  return value.toFixed(2).replace('.', ',');
};