import { useState, useEffect, useMemo } from 'react';
import { Card, Select, DatePicker, Button, Table, message, Spin } from 'antd';
import { Search, BarChart2 } from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const ANALYSES = [
  { value: 'sales_by_driver_monthly', label: '📊 Vendas por Entregador por Mês' },
];

interface MonthlySalesData {
  driver_id: string;
  driver_name: string;
  month: string;
  order_count: number;
  total_sales: number;
  avg_order_value: number;
}

export function Pesquisa() {
  const [selectedAnalysis, setSelectedAnalysis] = useState(ANALYSES[0].value);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<MonthlySalesData[]>([]);
  
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get('/drivers').then(res => {
      setDrivers(res.data);
    }).catch(err => console.error(err));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let params: any = {};
      
      if (selectedDrivers.length > 0) {
        params.driver_ids = selectedDrivers.join(',');
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_month = dateRange[0].format('YYYY-MM');
        params.end_month = dateRange[1].format('YYYY-MM');
      } else if (dateRange && dateRange[0]) {
        params.start_month = dateRange[0].format('YYYY-MM');
        params.end_month = dateRange[0].format('YYYY-MM');
      }
      
      const res = await api.get('/sales-by-driver-monthly/', { params });
      setRawData(res.data);
      if (res.data.length === 0) {
        message.info('Nenhum dado encontrado para os filtros selecionados.');
      }
    } catch (error) {
      console.error(error);
      message.error('Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  // Transformar dados para tabela
  const { tableData, months } = useMemo(() => {
    if (!rawData.length) {
      return { tableData: [], months: [] };
    }

    // Extrair todos os meses únicos e ordenar
    const uniqueMonths = Array.from(new Set(rawData.map(item => item.month))).sort();
    
    // Agrupar por driver
    const driverMap = new Map();
    rawData.forEach(item => {
      const key = item.driver_id;
      if (!driverMap.has(key)) {
        driverMap.set(key, {
          driver_id: item.driver_id,
          driver_name: item.driver_name,
          months: {},
        });
      }
      const entry = driverMap.get(key);
      entry.months[item.month] = {
        order_count: item.order_count,
        total_sales: item.total_sales,
        avg_order_value: item.avg_order_value,
      };
    });

    // Construir linhas da tabela
    const rows = Array.from(driverMap.values()).map(driver => {
      const row: any = {
        key: driver.driver_id,
        driver: driver.driver_name,
        driver_id: driver.driver_id,
      };
      uniqueMonths.forEach(month => {
        const data = driver.months[month];
        if (data) {
          row[month] = {
            order_count: data.order_count,
            total_sales: data.total_sales,
            avg_order_value: data.avg_order_value,
          };
        } else {
          row[month] = {
            order_count: 0,
            total_sales: 0,
            avg_order_value: 0,
          };
        }
      });
      // Calcular totais
      let totalOrders = 0;
      let totalSales = 0;
      uniqueMonths.forEach(month => {
        const data = driver.months[month];
        if (data) {
          totalOrders += data.order_count;
          totalSales += data.total_sales;
        }
      });
      row.totalOrders = totalOrders;
      row.totalSales = totalSales;
      row.avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      return row;
    });

    rows.sort((a, b) => a.driver.localeCompare(b.driver));

    return { tableData: rows, months: uniqueMonths };
  }, [rawData]);

  // Construir colunas
  const columns = useMemo((): ColumnsType<any> => {
    if (!months.length) return [];

    const cols: ColumnsType<any> = [
      {
        title: 'Entregador',
        dataIndex: 'driver',
        key: 'driver',
        fixed: 'left',
        width: 180,
        render: (text: string) => (
          <span className="font-semibold">{text}</span>
        ),
      },
    ];

    // Adicionar colunas para cada mês
    months.forEach(month => {
      const monthLabel = dayjs(month + '-01').format('MMM/YYYY');
      cols.push({
        title: monthLabel,
        key: month,
        align: 'center',
        render: (_, record) => {
          const data = record[month];
          if (!data || data.order_count === 0) {
            return <span className="text-slate-400 text-sm">-</span>;
          }
          return (
            <div className="space-y-0.5">
              <div className="text-xs text-slate-500">
                {data.order_count} vendas
              </div>
              <div className="text-sm font-medium text-slate-800">
                {formatCurrency(data.total_sales)}
              </div>
              <div className="text-xs text-slate-400">
                Média: {formatCurrency(data.avg_order_value)}
              </div>
            </div>
          );
        },
        sorter: (a, b) => {
          const aData = a[month] || { total_sales: 0 };
          const bData = b[month] || { total_sales: 0 };
          return aData.total_sales - bData.total_sales;
        },
      });
    });

    // Coluna de Total
    cols.push({
      title: 'Total',
      key: 'total',
      align: 'center',
      render: (_, record) => (
        <div className="space-y-0.5">
          <div className="text-xs text-slate-500">
            {record.totalOrders || 0} vendas
          </div>
          <div className="text-sm font-bold text-orange-600">
            {formatCurrency(record.totalSales || 0)}
          </div>
          <div className="text-xs text-slate-400">
            Média: {formatCurrency(record.avgOrderValue || 0)}
          </div>
        </div>
      ),
      fixed: 'right',
      sorter: (a, b) => (a.totalSales || 0) - (b.totalSales || 0),
    });

    return cols;
  }, [months]);

  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <BarChart2 className="w-6 h-6 text-orange-500" />
            Pesquisa Avançada
          </h2>
          <p className="text-slate-500 mt-1 mb-0">Teste novas visões de dados antes de fixá-las no Dashboard.</p>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl p-2" styles={{ body: { padding: '16px' } }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Análise</label>
            <Select
              value={selectedAnalysis}
              onChange={setSelectedAnalysis}
              className="w-full h-10"
              options={ANALYSES}
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Entregador(es)</label>
            <Select
              mode="multiple"
              placeholder="Todos"
              className="w-full h-10"
              value={selectedDrivers}
              onChange={setSelectedDrivers}
              options={driverOptions}
              allowClear
              maxTagCount={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Período</label>
            <DatePicker.RangePicker
              picker="month"
              className="w-full h-10"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              placeholder={['Mês Inicial', 'Mês Final']}
              format="MMM/YYYY"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="primary" icon={<Search className="w-4 h-4" />} onClick={handleSearch} loading={loading}>
            Executar Pesquisa
          </Button>
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-x-auto" styles={{ body: { padding: 0 } }}>
        <Spin spinning={loading}>
          {tableData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 'max-content' }}
              bordered
              className="w-full"
            />
          ) : (
            <div className="text-center py-10 text-slate-400">
              {rawData.length === 0 && !loading 
                ? 'Nenhum dado encontrado. Ajuste os filtros e execute a pesquisa.' 
                : 'Carregando dados...'}
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
}