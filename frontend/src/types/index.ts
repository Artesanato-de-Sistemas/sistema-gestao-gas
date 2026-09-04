export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
}

export interface Product {
  id: string;
  name: string;
  current_price: number;
  active: boolean;
  stock_quantity: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  notes?: string;
  created_at: string;
}

export interface InboundItem {
  id?: string;
  category: 'GLP_13KG_CHEIO' | 'GLP_13KG_VAZIO' | 'GLP_20KG_CHEIO' | 'GLP_20KG_VAZIO' | 'GLP_45KG_CHEIO' | 'GLP_45KG_VAZIO';
  quantity: number;
  unit_cost: number;
}

export interface InboundPayload {
  truckPlate: string;
  invoice: string;
  items: InboundItem[];
}

export interface DriverFinancialReport {
  driverId: string;
  driverName: string;
  cylindersSold: number;
  grossAmount: number;
  withdrawals: number;
  netProfit: number;
}

export interface Employee {
  id: string;
  name: string;
  document: string;
  phone: string;
  role: 'ENTREGADOR' | 'SECRETARIO';
  active: boolean;
  email?: string;
  created_at: string;
}

export interface Client {
  id: string;
  payment_deadline_days: number;
  active: boolean;
  person_type: 'FISICA' | 'JURIDICA';
  name: string;
  document: string;
  phone: string;
  email?: string;
  trade_name?: string;
  created_at: string;
  // Métricas agregadas
  isInadimplente?: boolean;
  revenue?: number;
  purchasesCount?: number;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  commission_percentage: number;
  active: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  delivery_driver_id?: string;
  driver_name?: string;
  date: string; // Data da venda
  product: string; // Produto vendido
  unit_cost: number; // Preço unitário
  quantity: number; // Quantidade
  payment_form: string; // Forma de pagamento
  payment_received: number; // Valor recebido
  total_amount: number; // Valor total
  status: string; // Status do pedido
  sale_type?: string; // Para compatibilidade
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
}
