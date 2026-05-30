import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DriverFinancialReport } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { UserCircle, TrendingDown, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

const mockDrivers: DriverFinancialReport[] = [
  { driverId: '1', driverName: 'Roberto Silva', cylindersSold: 45, grossAmount: 4950, withdrawals: 150, netProfit: 4800 },
  { driverId: '2', driverName: 'João Souza', cylindersSold: 32, grossAmount: 3520, withdrawals: 300, netProfit: 3220 },
  { driverId: '3', driverName: 'Fernando Costa', cylindersSold: 58, grossAmount: 6380, withdrawals: 0, netProfit: 6380 },
  { driverId: '4', driverName: 'Carlos Mendes', cylindersSold: 12, grossAmount: 1320, withdrawals: 500, netProfit: 820 },
];

export function DriversDashboard() {
  const [period, setPeriod] = useState('Hoje');

  const totalCylinders = mockDrivers.reduce((acc, d) => acc + d.cylindersSold, 0);
  const totalGross = mockDrivers.reduce((acc, d) => acc + d.grossAmount, 0);
  const totalWithdrawals = mockDrivers.reduce((acc, d) => acc + d.withdrawals, 0);
  const totalNet = mockDrivers.reduce((acc, d) => acc + d.netProfit, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
             <BarChart3 className="w-6 h-6 text-blue-600" />
             Performance de Entregadores
          </h2>
          <p className="text-slate-500 mt-1">Acompanhamento financeiro (DRE) e vendas por entregador.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Período:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white rounded-xl shadow-sm border-slate-200">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Hoje">Hoje</SelectItem>
              <SelectItem value="Semana">Esta Semana</SelectItem>
              <SelectItem value="Mês">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Total de Botijões</p>
              <div className="p-2 bg-blue-50 rounded-xl">
                <UserCircle className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{totalCylinders}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Valor Bruto</p>
              <div className="p-2 bg-slate-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalGross)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Sangria (Vales)</p>
              <div className="p-2 bg-orange-50 rounded-xl">
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600 mt-2">-{formatCurrency(totalWithdrawals)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-2xl bg-emerald-50/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Lucro Real Líquido</p>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-100 rounded-2xl">
        <CardHeader className="pb-4 border-b border-slate-50">
          <CardTitle className="text-slate-800">Detalhamento por Entregador</CardTitle>
          <CardDescription>
            Resultados consolidados filtrados por {period.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 pl-6 h-12">Entregador</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Vendas (Qtd)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Total Bruto</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 h-12">Sangria</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 pr-6 h-12">Lucro Real</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDrivers.map((driver) => (
                  <TableRow key={driver.driverId} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell className="font-medium text-slate-800 flex items-center gap-3 pl-6 py-4">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold border border-blue-100">
                            {driver.driverName.substring(0, 2).toUpperCase()}
                        </div>
                        {driver.driverName}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700 py-4">{driver.cylindersSold}</TableCell>
                    <TableCell className="text-right text-slate-700 py-4">{formatCurrency(driver.grossAmount)}</TableCell>
                    <TableCell className="text-right text-orange-600 font-medium py-4">
                      {formatCurrency(driver.withdrawals)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 pr-6 py-4">
                      {formatCurrency(driver.netProfit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
