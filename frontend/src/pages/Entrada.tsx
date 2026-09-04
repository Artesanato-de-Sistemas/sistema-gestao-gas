// frontend/src/pages/Entrada.tsx
import { useState, useEffect, useMemo } from 'react';
import { 
  Card, Select, DatePicker, Button, Table, Input, 
  message, Tag, Typography, Spin, Divider, Alert,
  Modal, Space, InputNumber, Form, AutoComplete
} from 'antd';
import { 
  Calendar, Users, Plus, Save, Trash2, 
  Wallet, CreditCard, Coffee, Package, Calculator
} from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import dayjs, { Dayjs } from 'dayjs';
import { MoneyInput } from '@/components/MoneyInput';

const { Title, Text } = Typography;

// Tipos
interface Driver {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  trade_name?: string;
}

interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  product: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  payment_form: string;
  payment_received: number;
  date: string;
}

// Venda a prazo disponível para pagamento
interface PendingOrder {
  id: string;
  client_id: string;
  client_name: string;
  product: string;
  quantity: number;
  total_amount: number;
  payment_received: number;
  pending_amount: number;
  date: string;
}

// Entrada de venda no formulário
interface OrderEntry {
  client_id: string;
  client_name?: string;
  product: string;
  unit_cost: number;
  quantity: number;
  total_amount: number;
  payment_form: string;
}

// Entrada de pagamento no formulário
interface PaymentEntry {
  order_id: string;
  client_id: string;
  client_name?: string;
  amount: number;
  payment_method: string;
  notes: string;
  pending_amount: number;
}

// Entrada de sangria no formulário
interface CashEntry {
  type: 'SAIDA' | 'ENTRADA';
  category: string;
  amount: number;
  description: string;
}

export function Entrada() {
  // Estado principal
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockMessage, setLockMessage] = useState<string>('');

  // Dados da entrada
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);

  // Formulários
  const [orderForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [cashForm] = Form.useForm();

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, clientsRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/clients')
        ]);
        setDrivers(driversRes.data);
        setClients(clientsRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        message.error('Erro ao carregar dados iniciais');
      }
    };
    fetchData();
  }, []);

  // Buscar vendas a prazo pendentes quando selecionar o cliente no pagamento
  const fetchPendingOrders = async (clientId: string) => {
    if (!clientId) return;
    
    try {
      const res = await api.get('/orders/pending/', {
        params: { client_id: clientId }
      });
      setPendingOrders(res.data);
    } catch (error) {
      console.error('Erro ao buscar vendas pendentes:', error);
      message.error('Erro ao buscar vendas a prazo');
    }
  };

  // Verificar se já existe entrada
  const checkExistingEntry = async () => {
    if (!selectedDriver) {
      message.warning('Selecione um funcionário');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/entries/check/', {
        params: {
          driver_id: selectedDriver,
          date: selectedDate.format('YYYY-MM-DD')
        }
      });
      
      setIsLocked(res.data.has_entry);
      if (res.data.has_entry) {
        setLockMessage(res.data.message);
        message.warning(res.data.message);
      } else {
        setLockMessage('');
      }
    } catch (error) {
      console.error('Erro ao verificar entrada:', error);
      message.error('Erro ao verificar entrada');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar venda - com cálculo automático
  const handleAddOrder = () => {
    orderForm.validateFields().then(values => {
      const quantity = values.quantity;
      const unitCost = values.unit_cost || 0;
      const totalAmount = values.total_amount || 0;
      
      let finalUnitCost = unitCost;
      let finalTotalAmount = totalAmount;
      
      // Cálculo automático
      if (quantity > 0) {
        if (unitCost > 0 && totalAmount === 0) {
          // Calcula total a partir do unitário
          finalTotalAmount = Number((quantity * unitCost).toFixed(2));
        } else if (totalAmount > 0 && unitCost === 0) {
          // Calcula unitário a partir do total
          finalUnitCost = Number((totalAmount / quantity).toFixed(2));
        } else if (unitCost > 0 && totalAmount > 0) {
          // Ambos preenchidos - usa os valores
          finalUnitCost = unitCost;
          finalTotalAmount = totalAmount;
        }
      }
      
      const newOrder: OrderEntry = {
        client_id: values.client_id,
        client_name: clients.find(c => c.id === values.client_id)?.name || '',
        product: values.product,
        unit_cost: finalUnitCost,
        quantity: quantity,
        total_amount: finalTotalAmount,
        payment_form: values.payment_form
      };
      
      setOrders([...orders, newOrder]);
      orderForm.resetFields();
      // Resetar campos de cálculo
      orderForm.setFieldsValue({ unit_cost: 0, total_amount: 0 });
      message.success('Venda adicionada');
    });
  };

  // Adicionar pagamento
  const handleAddPayment = () => {
    paymentForm.validateFields().then(values => {
      const orderId = values.order_id;
      const pendingOrder = pendingOrders.find(o => o.id === orderId);
      
      if (!pendingOrder) {
        message.error('Venda a prazo não encontrada');
        return;
      }
      
      const newPayment: PaymentEntry = {
        order_id: orderId,
        client_id: pendingOrder.client_id,
        client_name: pendingOrder.client_name,
        amount: values.amount,
        payment_method: values.payment_method,
        notes: values.notes || '',
        pending_amount: pendingOrder.pending_amount
      };
      
      setPayments([...payments, newPayment]);
      paymentForm.resetFields();
      setPendingOrders([]);
      message.success('Pagamento adicionado');
    });
  };

  // Adicionar sangria
  const handleAddCash = () => {
    cashForm.validateFields().then(values => {
      const newCash: CashEntry = {
        type: values.type,
        category: values.category,
        amount: values.amount,
        description: values.description || values.category
      };
      setCashEntries([...cashEntries, newCash]);
      cashForm.resetFields();
      message.success('Movimentação adicionada');
    });
  };

  // Remover itens
  const removeOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const removeCash = (index: number) => {
    setCashEntries(cashEntries.filter((_, i) => i !== index));
  };

  // Salvar tudo
  const handleSaveAll = async () => {
    if (!selectedDriver) {
      message.warning('Selecione um funcionário');
      return;
    }

    if (orders.length === 0 && payments.length === 0 && cashEntries.length === 0) {
      message.warning('Adicione pelo menos uma venda, pagamento ou sangria');
      return;
    }

    if (isLocked) {
      message.error('Esta entrada já foi salva e não pode ser alterada');
      return;
    }

    Modal.confirm({
      title: 'Confirmar salvamento',
      content: 'Tem certeza que deseja salvar esta entrada? Após salvar, não será possível editar.',
      onOk: async () => {
        setLoading(true);
        try {
          const payload = {
            driver_id: selectedDriver,
            date: selectedDate.format('YYYY-MM-DD'),
            orders: orders.map(o => ({
              client_id: o.client_id,
              product: o.product,
              unit_cost: o.unit_cost,
              quantity: o.quantity,
              payment_form: o.payment_form
            })),
            payments: payments.map(p => ({
              client_id: p.client_id,
              order_id: p.order_id,
              amount: p.amount,
              payment_method: p.payment_method,
              notes: p.notes
            })),
            cash_entries: cashEntries.map(c => ({
              type: c.type,
              category: c.category,
              amount: c.amount,
              description: c.description
            }))
          };

          await api.post('/entries/save/', payload);
          message.success('Entrada salva com sucesso!');
          
          // Limpar e bloquear
          setOrders([]);
          setPayments([]);
          setCashEntries([]);
          setIsLocked(true);
          setLockMessage('Esta entrada já foi salva e não pode ser alterada');
          
        } catch (error: any) {
          console.error('Erro ao salvar entrada:', error);
          message.error(error.response?.data?.error || 'Erro ao salvar entrada');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Calcular totais
  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = cashEntries
    .filter(c => c.type === 'SAIDA')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalIncome = totalSales + totalPayments;
  const balance = totalIncome - totalExpenses;

  // Opções
  const productOptions = [
    { value: 'P13 - Gas', label: 'P13 - Gás' },
    { value: 'P13 - Casco Cheio', label: 'P13 - Casco Cheio' },
    { value: 'P45 - Gas', label: 'P45 - Gás' },
  ];

  const paymentFormOptions = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTÃO', label: 'Cartão' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'A PRAZO', label: 'A Prazo' },
  ];

  const paymentMethodOptions = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CREDITO', label: 'Cartão de Crédito' },
    { value: 'DEBITO', label: 'Cartão de Débito' },
    { value: 'CHEQUE', label: 'Cheque' },
  ];

  const cashTypeOptions = [
    { value: 'SAIDA', label: 'Sangria (Saída)' },
    { value: 'ENTRADA', label: 'Entrada' },
  ];

  const sangriaTypeOptions = [
    { value: 'ALMOÇO', label: '🍽️ Almoço' },
    // Adicione outros tipos conforme necessário
  ];

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.trade_name || c.name
  }));

  // Opções de vendas a prazo para o pagamento
  const pendingOrderOptions = pendingOrders.map(o => ({
    value: o.id,
    label: `${o.client_name} - ${o.product} (${o.quantity} und) - Pendente: ${formatCurrency(o.pending_amount)}`
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <Calendar className="w-6 h-6 text-orange-500" />
            Entrada do Dia
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Selecione funcionário e data para lançar vendas, pagamentos e sangrias.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSaveAll}
          loading={loading}
          disabled={isLocked || (orders.length === 0 && payments.length === 0 && cashEntries.length === 0)}
          className="h-10 px-6 rounded-lg font-medium"
        >
          Salvar Tudo
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Funcionário
            </label>
            <Select
              placeholder="Selecione o funcionário"
              value={selectedDriver}
              onChange={setSelectedDriver}
              className="w-full h-10"
              showSearch
              optionFilterProp="label"
              options={drivers.map(d => ({ value: d.id, label: d.name }))}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Data
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              className="w-full h-10"
              format="DD/MM/YYYY"
              disabled={isLocked}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="primary"
              onClick={checkExistingEntry}
              loading={loading}
              className="w-full h-10 rounded-lg font-medium"
              disabled={!selectedDriver || isLocked}
            >
              Carregar / Verificar
            </Button>
          </div>
        </div>

        {isLocked && (
          <Alert
            message="Entrada bloqueada"
            description={lockMessage}
            type="warning"
            showIcon
            className="mt-4"
          />
        )}
      </Card>

      {/* Conteúdo Principal - 2 Colunas */}
      <Spin spinning={loading}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUNA ESQUERDA - Inserção */}
          <div className="space-y-6">
            
            {/* Formulário de Venda */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span>Adicionar Venda</span>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              <Form form={orderForm} layout="vertical" disabled={isLocked}>
                <Form.Item
                  name="client_id"
                  label="Cliente"
                  rules={[{ required: true, message: 'Selecione um cliente' }]}
                >
                  <Select
                    placeholder="Selecione o cliente"
                    className="w-full h-10"
                    showSearch
                    optionFilterProp="label"
                    options={clientOptions}
                  />
                </Form.Item>

                <Form.Item
                  name="product"
                  label="Produto"
                  rules={[{ required: true, message: 'Selecione um produto' }]}
                >
                  <Select
                    placeholder="Produto"
                    className="w-full h-10"
                    options={productOptions}
                  />
                </Form.Item>

                <div className="grid grid-cols-3 gap-4">
                  <Form.Item
                    name="quantity"
                    label="Quantidade"
                    rules={[{ required: true, message: 'Digite a quantidade' }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="Qtd"
                      className="w-full h-10"
                    />
                  </Form.Item>

                  <Form.Item
                    name="unit_cost"
                    label="Valor Unitário"
                  >
                    <MoneyInput
                      placeholder="0,00"
                      onChange={(value) => {
                        const form = orderForm;
                        const quantity = form.getFieldValue('quantity');
                        if (quantity > 0 && value && value > 0) {
                          const total = quantity * value;
                          form.setFieldsValue({ total_amount: Number(total.toFixed(2)) });
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="total_amount"
                    label="Valor Total"
                  >
                    <MoneyInput
                      placeholder="0,00"
                      onChange={(value) => {
                        const form = orderForm;
                        const quantity = form.getFieldValue('quantity');
                        if (quantity > 0 && value && value > 0) {
                          const unitCost = value / quantity;
                          form.setFieldsValue({ unit_cost: Number(unitCost.toFixed(2)) });
                        }
                      }}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="payment_form"
                  label="Forma de Pagamento"
                  rules={[{ required: true, message: 'Selecione a forma' }]}
                >
                  <Select
                    placeholder="Forma"
                    className="w-full h-10"
                    options={paymentFormOptions}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddOrder}
                  disabled={isLocked}
                  className="w-full h-10 rounded-lg font-medium"
                >
                  Adicionar Venda
                </Button>
              </Form>
            </Card>

            {/* Formulário de Pagamento */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <span>Adicionar Pagamento (A Prazo)</span>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              <Form form={paymentForm} layout="vertical" disabled={isLocked}>
                <Form.Item
                  name="client_id"
                  label="Cliente"
                  rules={[{ required: true, message: 'Selecione um cliente' }]}
                >
                  <Select
                    placeholder="Selecione o cliente"
                    className="w-full h-10"
                    showSearch
                    optionFilterProp="label"
                    options={clientOptions}
                    onChange={(value) => {
                      fetchPendingOrders(value);
                      paymentForm.setFieldsValue({ order_id: undefined });
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="order_id"
                  label="Venda a Prazo"
                  rules={[{ required: true, message: 'Selecione uma venda a prazo' }]}
                >
                  <Select
                    placeholder="Selecione a venda a prazo"
                    className="w-full h-10"
                    options={pendingOrderOptions}
                    disabled={pendingOrders.length === 0}
                    onChange={(value) => {
                      const order = pendingOrders.find(o => o.id === value);
                      if (order) {
                        paymentForm.setFieldsValue({ 
                          amount: order.pending_amount,
                          notes: `Pagamento da venda ${order.product} - ${order.client_name}`
                        });
                      }
                    }}
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="amount"
                    label="Valor a Pagar"
                    rules={[{ required: true, message: 'Digite o valor' }]}
                  >
                    <MoneyInput placeholder="0,00" />
                  </Form.Item>

                  <Form.Item
                    name="payment_method"
                    label="Método"
                    rules={[{ required: true, message: 'Selecione o método' }]}
                  >
                    <Select
                      placeholder="Método"
                      className="w-full h-10"
                      options={paymentMethodOptions}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="notes"
                  label="Observação"
                >
                  <Input
                    placeholder="Ex: Pagamento da venda X"
                    className="h-10"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddPayment}
                  disabled={isLocked}
                  className="w-full h-10 rounded-lg font-medium"
                  style={{ background: '#22c55e' }}
                >
                  Adicionar Pagamento
                </Button>
              </Form>
            </Card>

            {/* Formulário de Sangria */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-red-500" />
                  <span>Adicionar Sangria / Movimentação</span>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              <Form form={cashForm} layout="vertical" disabled={isLocked}>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="type"
                    label="Tipo"
                    rules={[{ required: true, message: 'Selecione o tipo' }]}
                  >
                    <Select
                      placeholder="Tipo"
                      className="w-full h-10"
                      options={cashTypeOptions}
                    />
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label="Categoria"
                    rules={[{ required: true, message: 'Selecione a categoria' }]}
                  >
                    <Select
                      placeholder="Categoria"
                      className="w-full h-10"
                      options={sangriaTypeOptions}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="amount"
                  label="Valor"
                  rules={[{ required: true, message: 'Digite o valor' }]}
                >
                  <MoneyInput placeholder="0,00" />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Descrição"
                >
                  <Input
                    placeholder="Descrição adicional (opcional)"
                    className="h-10"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddCash}
                  disabled={isLocked}
                  className="w-full h-10 rounded-lg font-medium"
                  style={{ background: '#ef4444' }}
                >
                  Adicionar Movimentação
                </Button>
              </Form>
            </Card>
          </div>

          {/* COLUNA DIREITA - Resumo */}
          <div className="space-y-6">
            
            {/* Resumo de Vendas */}
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Vendas ({orders.length})
                  </span>
                  <Text strong className="text-blue-600">
                    {formatCurrency(totalSales)}
                  </Text>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              {orders.length === 0 ? (
                <Text type="secondary" className="text-center block py-4">
                  Nenhuma venda adicionada
                </Text>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders.map((order, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <div>
                        <Text strong>{order.client_name}</Text>
                        <Text type="secondary" className="block text-xs">
                          {order.quantity}x {order.product} - {order.payment_form}
                          {order.payment_form === 'A PRAZO' && (
                            <Tag color="orange" className="ml-1">Pendente</Tag>
                          )}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text strong>{formatCurrency(order.total_amount)}</Text>
                        <Text type="secondary" className="text-xs">
                          {formatCurrency(order.unit_cost)}/un
                        </Text>
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removeOrder(index)}
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Resumo de Pagamentos */}
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-500" />
                    Pagamentos ({payments.length})
                  </span>
                  <Text strong className="text-green-600">
                    +{formatCurrency(totalPayments)}
                  </Text>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              {payments.length === 0 ? (
                <Text type="secondary" className="text-center block py-4">
                  Nenhum pagamento adicionado
                </Text>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                      <div>
                        <Text strong>{payment.client_name}</Text>
                        <Text type="secondary" className="block text-xs">
                          {payment.payment_method} - Pendente: {formatCurrency(payment.pending_amount)}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text strong className="text-green-600">
                          +{formatCurrency(payment.amount)}
                        </Text>
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removePayment(index)}
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Resumo de Sangrias */}
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-red-500" />
                    Sangrias ({cashEntries.length})
                  </span>
                  <Text strong className="text-red-600">
                    -{formatCurrency(totalExpenses)}
                  </Text>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              {cashEntries.length === 0 ? (
                <Text type="secondary" className="text-center block py-4">
                  Nenhuma movimentação adicionada
                </Text>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cashEntries.map((cash, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                      <div>
                        <Text strong>{cash.description || cash.category}</Text>
                        <Text type="secondary" className="block text-xs">
                          {cash.category} - {cash.type === 'SAIDA' ? 'Saída' : 'Entrada'}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text strong className={cash.type === 'SAIDA' ? 'text-red-600' : 'text-green-600'}>
                          {cash.type === 'SAIDA' ? '-' : '+'}{formatCurrency(cash.amount)}
                        </Text>
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removeCash(index)}
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Totais */}
            <Card className="border-slate-100 shadow-sm rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <Text type="secondary">Total Vendas</Text>
                  <Text strong>{formatCurrency(totalSales)}</Text>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <Text type="secondary">Total Pagamentos</Text>
                  <Text strong className="text-green-600">+{formatCurrency(totalPayments)}</Text>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <Text type="secondary">Total Sangrias</Text>
                  <Text strong className="text-red-600">-{formatCurrency(totalExpenses)}</Text>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                  <Text strong className="text-base">Saldo Final</Text>
                  <Text strong className={`text-lg ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Spin>
    </div>
  );
}