import { useState, useEffect } from 'react';
import { Box, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, Typography, Row, Col, message } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/services/api';

const { Title, Text } = Typography;

const getOrangeColor = (value: number, max: number) => {
  const ratio = value / max;
  if (ratio > 0.8) return '#ea580c';
  if (ratio > 0.6) return '#f97316';
  if (ratio > 0.4) return '#fb923c';
  if (ratio > 0.2) return '#fdba74';
  return '#fed7aa';
};

export function Dashboard() {
  const [data, setData] = useState({
    stock_p13: 0,
    stock_p20: 0,
    stock_p45: 0,
    sales_today: 0,
    orders_today: 0,
    overdue_invoices: 0
  });

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      setData(res.data);
    } catch (error) {
      console.error(error);
      message.error("Erro ao buscar métricas do dashboard");
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const metrics = [
    {
      title: 'Estoque P13',
      value: data.stock_p13.toString(),
      subtitle: 'Unidades disponíveis',
      icon: Box,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Estoque P45',
      value: data.stock_p45.toString(),
      subtitle: 'Unidades disponíveis',
      icon: Box,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Vendas do Dia',
      value: formatCurrency(data.sales_today),
      subtitle: `${data.orders_today} pedidos finalizados`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Inadimplência',
      value: data.overdue_invoices.toString(),
      subtitle: 'Faturas em atraso',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 m-0">Dashboard</h2>
        <p className="text-slate-500 mt-1 mb-0">Visão geral do desempenho e logística da distribuidora.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="shadow-sm border-slate-100 rounded-2xl" styles={{ body: { padding: '24px' } }}>
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-500">
                {metric.title}
              </span>
              <div className={`p-2 rounded-xl ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{metric.value}</div>
              <p className="text-sm text-slate-400 mt-1 m-0">{metric.subtitle}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-7 shadow-sm border-slate-100 rounded-2xl" styles={{ body: { padding: '24px' } }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 m-0">Níveis de Estoque Alerta</h3>
            <p className="text-sm text-slate-500 mt-1 m-0">
              Produtos que precisam de atenção.
            </p>
          </div>
          <div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Box className="w-5 h-5 text-orange-500"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 m-0">Estoque P13</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className={`text-lg font-bold ${data.stock_p13 < 10 ? 'text-orange-600' : 'text-slate-800'}`}>{data.stock_p13}</span>
                    <span className="text-xs text-slate-400 ml-1">un</span>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Box className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 m-0">Estoque P20</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className={`text-lg font-bold ${data.stock_p20 < 10 ? 'text-orange-600' : 'text-slate-800'}`}>{data.stock_p20}</span>
                    <span className="text-xs text-slate-400 ml-1">un</span>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <Box className="w-5 h-5 text-slate-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 m-0">Estoque P45</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className={`text-lg font-bold ${data.stock_p45 < 10 ? 'text-orange-600' : 'text-slate-800'}`}>{data.stock_p45}</span>
                    <span className="text-xs text-slate-400 ml-1">un</span>
                 </div>
               </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
