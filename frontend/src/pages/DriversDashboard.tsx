import { useState, useEffect } from 'react';
import { Card, Select, Table, Typography, Avatar, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DriverFinancialReport } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { UserCircle, TrendingDown, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export function DriversDashboard() {
  const [period, setPeriod] = useState('Hoje');
  const [data, setData] = useState<DriverFinancialReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/drivers?period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
      message.error("Erro ao buscar relatório dos entregadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const totalCylinders = data.reduce((acc, d) => acc + d.cylindersSold, 0);
  const totalGross = data.reduce((acc, d) => acc + d.grossAmount, 0);
  const totalWithdrawals = data.reduce((acc, d) => acc + d.withdrawals, 0);
  const totalNet = data.reduce((acc, d) => acc + d.netProfit, 0);

  const columns: ColumnsType<DriverFinancialReport> = [
    {
      title: 'Entregador',
      key: 'driverName',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-orange-50 text-orange-700 border border-orange-100 font-bold" size="default">
             {record.driverName.substring(0, 2).toUpperCase()}
          </Avatar>
          <span className="font-medium text-slate-800">{record.driverName}</span>
        </div>
      )
    },
    {
      title: 'Vendas (Qtd)',
      dataIndex: 'cylindersSold',
      key: 'cylindersSold',
      align: 'right',
      render: (val) => <span className="font-medium text-slate-700">{val}</span>
    },
    {
      title: 'Total Bruto',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      align: 'right',
      render: (val) => <span className="text-slate-700">{formatCurrency(val)}</span>
    },
    {
      title: 'Sangria',
      dataIndex: 'withdrawals',
      key: 'withdrawals',
      align: 'right',
      render: (val) => <span className="text-orange-600 font-medium">{formatCurrency(val)}</span>
    },
    {
      title: 'Lucro Real',
      dataIndex: 'netProfit',
      key: 'netProfit',
      align: 'right',
      render: (val) => <span className="font-bold text-emerald-600">{formatCurrency(val)}</span>
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
             <BarChart3 className="w-6 h-6 text-orange-500" />
             Performance de Entregadores
          </h2>
          <p className="text-slate-500 mt-1 mb-0">Acompanhamento financeiro (DRE) e vendas por entregador.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Período:</span>
          <Select 
            value={period} 
            onChange={setPeriod}
            className="w-[180px] h-9"
            options={[
              { value: 'Hoje', label: 'Hoje' },
              { value: 'Semana', label: 'Esta Semana' },
              { value: 'Mês', label: 'Este Mês' }
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-500">Total de Botijões</span>
              <div className="p-2 bg-orange-50 rounded-xl">
                <UserCircle className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{totalCylinders}</div>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-500">Valor Bruto</span>
              <div className="p-2 bg-slate-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalGross)}</div>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-500">Sangria (Vales)</span>
              <div className="p-2 bg-red-50 rounded-xl">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 mt-2">-{formatCurrency(totalWithdrawals)}</div>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-emerald-50/20" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-500">Lucro Real Líquido</span>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(totalNet)}</div>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-100 rounded-2xl" styles={{ body: { padding: '0' } }}>
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 m-0">Detalhamento por Entregador</h3>
          <p className="text-sm text-slate-500 mt-1 m-0">
            Resultados consolidados filtrados por {period.toLowerCase()}.
          </p>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="driverId"
          pagination={false}
          loading={loading}
          className="w-full"
        />
      </Card>
    </div>
  );
}
