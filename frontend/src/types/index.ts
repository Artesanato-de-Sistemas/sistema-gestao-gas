export interface User {
  id: string;
  name: string;
  email: string;
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
  type: 'P13' | 'P20' | 'P45';
  condition: 'NOVO' | 'USADO';
  status: 'OK' | 'DEFEITUOSO';
  quantity: number;
  unitPrice: number;
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
  person_id: string;
  payment_deadline_days: number;
  active: boolean;
  person_type: 'FISICA' | 'JURIDICA';
  name: string;
  document: string;
  phone: string;
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  delivery_driver_id?: string;
  driver_name?: string;
  sale_type: string;
  status: 'ABERTO' | 'FINALIZADO' | 'CANCELADO';
  due_date?: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}
