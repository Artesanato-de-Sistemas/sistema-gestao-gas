// frontend/src/components/MoneyInput.tsx
import { Input, InputProps } from 'antd';
import { maskCurrencyInput, parseCurrencyValue } from '@/utils/masks';

interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number | null) => void;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ 
  value = 0, 
  onChange,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = maskCurrencyInput(rawValue);
    
    // Atualizar o input com o valor formatado
    e.target.value = formatted;
    
    // Converter para número e chamar onChange
    const numValue = parseCurrencyValue(formatted);
    onChange?.(numValue);
  };

  return (
    <Input
      {...props}
      value={value ? maskCurrencyInput(String(value * 100)) : '0,00'}
      onChange={handleChange}
      className="h-10 text-right font-mono"
    />
  );
};