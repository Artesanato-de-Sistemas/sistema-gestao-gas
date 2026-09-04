// frontend/src/pages/Planilha.tsx
import { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Button, Table, Spin, message, Tag, Typography } from 'antd';
import { Calendar, Users, FileText, TrendingUp, Wallet, Package } from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface Driver {
  id: string;
  name: string;
}

interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  clients?: { name: string };
  product: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  payment_form: string;
  date: string;
}

interface Payment {
  id: string;
  client_id: string;
  client_name?: string;
  clients?: { name: string };
  order_id?: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string;
}

interface CashEntry {
  id: string;
  type: 'ENTRADA' | 'SAIDA';
  amount: number;
  description: string;
  date: string;
  category?: string;
}

interface Totals {
  DINHEIRO: number;
  PIX: number;
  CREDITO: number;
  DEBITO: number;
  CHEQUE: number;
  TOTAL: number;
}

interface WorksheetData {
  orders: Order[];
  payments: Payment[];
  cash_entries: CashEntry[];
  totals: Totals;
}

export function Planilha() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      try {
        const res = await api.get('/drivers');
        setDrivers(res.data);
      } catch (error) {
        console.error('Erro ao carregar entregadores:', error);
        message.error('Erro ao carregar lista de entregadores');
      } finally {
        setLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, []);

  const fetchWorksheet = async () => {
    if (!selectedDriver) {
      message.warning('Selecione um funcionário');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/orders/worksheet/', {
        params: {
          driver_id: selectedDriver,
          date: selectedDate.format('YYYY-MM-DD'),
        },
      });
      setData(res.data);
      if (res.data.orders.length === 0 && res.data.payments.length === 0 && res.data.cash_entries.length === 0) {
        message.info('Nenhum registro encontrado para este dia e funcionário');
      }
    } catch (error) {
      console.error('Erro ao buscar planilha:', error);
      message.error('Erro ao carregar planilha');
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: 'Cliente',
      key: 'client',
      render: (_, record: Order) => (
        <Text strong>{record.clients?.name || record.client_name || '-'}</Text>
      ),
    },
    {
      title: 'Produto',
      dataIndex: 'product',
      key: 'product',
      render: (product: string) => <Text>{product}</Text>,
    },
    {
      title: 'Qtd',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
      render: (qty: number) => <Text>{qty}</Text>,
    },
    {
      title: 'Valor Unit',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      align: 'right' as const,
      render: (value: number) => <Text>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right' as const,
      render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Pagamento',
      dataIndex: 'payment_form',
      key: 'payment_form',
      render: (form: string) => {
        const colors: Record<string, string> = {
          'DINHEIRO': 'green',
          'PIX': 'blue',
          'CREDITO': 'purple',
          'DEBITO': 'orange',
          'A PRAZO (VENDA)': 'red',
        };
        return <Tag color={colors[form] || 'default'}>{form}</Tag>;
      },
    },
  ];

  const mixedColumns = [
    {
      title: 'Tipo',
      key: 'type',
      render: (_, record: any) => {
        if (record.type === 'SAIDA') {
          return <Tag color="red">Sangria</Tag>;
        }
        if (record.type === 'ENTRADA') {
          return <Tag color="green">Entrada</Tag>;
        }
        return <Tag color="blue">Pagamento</Tag>;
      },
    },
    {
      title: 'Cliente / Categoria',
      key: 'client',
      render: (_, record: any) => {
        if (record.type === 'PAGAMENTO') {
          return <Text>{record.clients?.name || record.client_name || '-'}</Text>;
        }
        if (record.type === 'SAIDA' || record.type === 'ENTRADA') {
          return <Text type="secondary">{record.category || 'Sem categoria'}</Text>;
        }
        return <Text>-</Text>;
      },
    },
    {
      title: 'Descrição',
      key: 'description',
      render: (_, record: any) => (
        <Text>{record.description || record.notes || '-'}</Text>
      ),
    },
    {
      title: 'Valor',
      key: 'amount',
      align: 'right' as const,
      render: (_, record: any) => {
        const value = record.amount || 0;
        const isNegative = record.type === 'SAIDA';
        return (
          <Text style={{ color: isNegative ? '#ef4444' : '#22c55e' }}>
            {isNegative ? '- ' : '+ '}{formatCurrency(Math.abs(value))}
          </Text>
        );
      },
    },
    {
      title: 'Método',
      key: 'method',
      render: (_, record: any) => {
        if (record.payment_method) {
          const colors: Record<string, string> = {
            'DINHEIRO': 'green',
            'PIX': 'blue',
            'CREDITO': 'purple',
            'DEBITO': 'orange',
            'CHEQUE': 'gold',
          };
          return <Tag color={colors[record.payment_method] || 'default'}>{record.payment_method}</Tag>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  const getMixedData = () => {
    if (!data) return [];
    const payments = data.payments.map((p) => ({ 
      ...p, 
      type: 'PAGAMENTO',
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount) || 0
    }));
    const cashEntries = data.cash_entries.map((c) => ({ 
      ...c, 
      type: c.type,
      amount: typeof c.amount === 'number' ? c.amount : parseFloat(c.amount) || 0
    }));
    return [...payments, ...cashEntries];
  };

  const getTotalRows = () => {
    if (!data) return [];
    const { totals } = data;
    return [
      { method: 'DINHEIRO', value: totals.DINHEIRO || 0 },
      { method: 'PIX', value: totals.PIX || 0 },
      { method: 'CREDITO', value: totals.CREDITO || 0 },
      { method: 'DEBITO', value: totals.DEBITO || 0 },
      { method: 'CHEQUE', value: totals.CHEQUE || 0 },
    ];
  };

  const getCashSummary = () => {
    if (!data) return null;
    const { orders, payments, cash_entries } = data;
    
    const totalSales = orders
      .filter(o => o.payment_form !== 'A PRAZO')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = cash_entries
      .filter(c => c.type === 'SAIDA')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    
    const totalIncome = totalSales + totalPayments;
    const balance = totalIncome - totalExpenses;
    
    return { totalSales, totalPayments, totalExpenses, totalIncome, balance };
  };

  const cashSummary = getCashSummary();

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <FileText className="w-6 h-6 text-orange-500" />
            Planilha do Dia
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Visualize vendas, pagamentos e movimentações por funcionário e data.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '20px' } }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
              loading={loadingDrivers}
              showSearch
              optionFilterProp="label"
              options={drivers.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
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
            />
          </div>

          <div>
            <Button
              type="primary"
              icon={<TrendingUp className="w-4 h-4" />}
              onClick={fetchWorksheet}
              loading={loading}
              className="w-full h-10 rounded-lg font-medium"
            >
              Buscar Planilha
            </Button>
          </div>
        </div>
      </Card>

      {/* Conteúdo */}
      <Spin spinning={loading}>
        {data && (
          <>
            {/* Tabela de Vendas */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  <span>Vendas</span>
                  <Tag color="blue">{data.orders.length} registros</Tag>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              <Table
                dataSource={data.orders}
                columns={orderColumns}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: 'Nenhuma venda registrada neste dia' }}
              />
            </Card>

            {/* Tabela Mista: Pagamentos + Movimentações */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-500" />
                  <span>Pagamentos e Movimentações</span>
                  <Tag color="green">{getMixedData().length} registros</Tag>
                </div>
              }
              className="border-slate-100 shadow-sm rounded-2xl"
            >
              <Table
                dataSource={getMixedData()}
                columns={mixedColumns}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: 'Nenhum pagamento ou movimentação registrada' }}
              />
            </Card>

            {/* Três Tabelas Verticais no Final */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tabela 1: Totais por Método de Pagamento */}
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span>Totais por Método</span>
                  </div>
                }
                className="border-slate-100 shadow-sm rounded-2xl"
              >
                <Table
                  dataSource={getTotalRows()}
                  columns={[
                    {
                      title: 'Método',
                      dataIndex: 'method',
                      key: 'method',
                      render: (method: string) => <Text strong>{method}</Text>,
                    },
                    {
                      title: 'Valor',
                      dataIndex: 'value',
                      key: 'value',
                      align: 'right' as const,
                      render: (value: number) => (
                        <Text strong>{formatCurrency(value)}</Text>
                      ),
                    },
                  ]}
                  rowKey="method"
                  pagination={false}
                  size="small"
                  className="w-full"
                />
              </Card>

              {/* Tabela 2: Resumo Financeiro Geral (vertical) */}
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    <span>Resumo Financeiro</span>
                  </div>
                }
                className="border-slate-100 shadow-sm rounded-2xl"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <Text type="secondary" className="text-sm">Vendas à Vista</Text>
                    <Text strong>{formatCurrency(cashSummary?.totalSales || 0)}</Text>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <Text type="secondary" className="text-sm">Recebimentos</Text>
                    <Text strong className="text-green-600">+{formatCurrency(cashSummary?.totalPayments || 0)}</Text>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <Text type="secondary" className="text-sm">Sangrias</Text>
                    <Text strong className="text-red-600">-{formatCurrency(cashSummary?.totalExpenses || 0)}</Text>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-slate-300 pt-2 mt-2">
                    <Text strong>Saldo Final</Text>
                    <Text strong className={`text-lg ${(cashSummary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashSummary?.balance || 0)}
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Tabela 3: Estoque (vertical) */}
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span>Estoque</span>
                  </div>
                }
                className="border-slate-100 shadow-sm rounded-2xl"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <Text type="secondary" className="text-sm">Cheio</Text>
                    <Text strong className="text-slate-700">-</Text>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <Text type="secondary" className="text-sm">Vazio</Text>
                    <Text strong className="text-slate-700">-</Text>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-slate-300 pt-2 mt-2">
                    <Text strong>Total</Text>
                    <Text strong className="text-slate-700">-</Text>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </Spin>
    </div>
  );
}