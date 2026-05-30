import { Box, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockNeighborhoodData = [
  { name: 'Centro', orders: 120 },
  { name: 'Jardins', orders: 98 },
  { name: 'Vila Nova', orders: 85 },
  { name: 'Boa Vista', orders: 62 },
  { name: 'São José', orders: 45 },
  { name: 'Bela Vista', orders: 30 },
];

const getOrangeColor = (value: number, max: number) => {
  const ratio = value / max;
  if (ratio > 0.8) return '#ea580c'; // orange-600
  if (ratio > 0.6) return '#f97316'; // orange-500
  if (ratio > 0.4) return '#fb923c'; // orange-400
  if (ratio > 0.2) return '#fdba74'; // orange-300
  return '#fed7aa'; // orange-200
};

export function Dashboard() {
  const metrics = [
    {
      title: 'Estoque P13',
      value: '245',
      subtitle: 'Unidades disponíveis',
      icon: Box,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Estoque P45',
      value: '18',
      subtitle: 'Unidades disponíveis',
      icon: Box,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Vendas do Dia',
      value: formatCurrency(1850),
      subtitle: '24 pedidos finalizados',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inadimplência',
      value: '12',
      subtitle: 'Faturas em atraso',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Visão geral do desempenho e logística da distribuidora.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="shadow-sm border-slate-100 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{metric.value}</div>
              <p className="text-sm text-slate-400 mt-1">{metric.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 shadow-sm border-slate-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MapPin className="w-5 h-5 text-blue-600" />
              Volume de Pedidos por Bairro
            </CardTitle>
            <CardDescription>
              Concentração logística baseada nas últimas entregas.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={mockNeighborhoodData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#64748B', fontSize: 12 }} 
                     dy={10}
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#64748B', fontSize: 12 }}
                   />
                   <Tooltip 
                     cursor={{ fill: '#F1F5F9' }}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar 
                     dataKey="orders" 
                     radius={[4, 4, 0, 0]} 
                     barSize={40}
                   >
                     {mockNeighborhoodData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={getOrangeColor(entry.orders, 120)} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-3 shadow-sm border-slate-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800">Níveis de Estoque Alerta</CardTitle>
            <CardDescription>
              Produtos que precisam de atenção.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Box className="w-5 h-5 text-orange-500"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Cilindro P45</p>
                      <p className="text-xs text-slate-500 mt-0.5">Criticamente baixo</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-lg font-bold text-orange-600">3</span>
                    <span className="text-xs text-slate-400 ml-1">un</span>
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Box className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Botijão P20</p>
                      <p className="text-xs text-slate-500 mt-0.5">Atenção ao estoque</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">12</span>
                    <span className="text-xs text-slate-400 ml-1">un</span>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
