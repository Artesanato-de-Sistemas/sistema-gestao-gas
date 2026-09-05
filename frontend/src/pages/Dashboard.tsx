import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Table, Spin, message, Row, Col } from 'antd';
import {
  Home,
  Box,
  AlertTriangle,
  TrendingDown,
  Users,
  DollarSign,
  Phone,
  Flame,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

const { Title, Text } = Typography;

interface AlertaEstoque {
  id_produto: string;
  nome: string;
  quantidade: number;
  critico: boolean;
}

interface AlertaInadimplencia {
  id_cliente: string;
  nome: string;
  telefone?: string;
  valor_devido: number;
  limite_credito: number;
}

interface SangriaResumo {
  total_hoje: number;
  total_mes: number;
  por_tipo: Record<string, number>;
  registros_hoje: Array<{
    id: string;
    tipo: string;
    descricao: string;
    valor: number;
    created_at: string;
  }>;
}

interface DashboardData {
  alertas_estoque: AlertaEstoque[];
  alertas_inadimplencia: AlertaInadimplencia[];
  total_inadimplente: number;
  inadimplentes_count: number;
  resumo_sangrias: SangriaResumo;
  clientes_ativos: {
    total_cadastrados: number;
    ativos_30_dias: number;
  };
  sales_today: number;
  orders_today: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err);
      message.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Carregando métricas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
          <Home className="w-6 h-6 text-orange-500" />
          Dashboard Administrativo
        </h2>
        <p className="text-slate-500 mt-1 mb-0">
          Visão geral de estoque, alertas financeiros, sangrias e base de clientes.
        </p>
      </div>

      {/* 4 Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Alertas de Estoque */}
        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500">Alertas de Estoque</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {data.alertas_estoque.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            {data.alertas_estoque.filter((a) => a.critico).length > 0 ? (
              <span className="text-red-500 font-semibold">
                {data.alertas_estoque.filter((a) => a.critico).length} produto(s) em nível crítico
              </span>
            ) : (
              'Produtos abaixo do nível ideal'
            )}
          </p>
        </Card>

        {/* Card 2: Alertas de Inadimplência */}
        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500">Inadimplência Total</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {formatCurrency(data.total_inadimplente || 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            {data.inadimplentes_count} cliente(s) com débito em aberto
          </p>
        </Card>

        {/* Card 3: Resumo Atual de Sangria */}
        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500">Sangrias do Dia</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {formatCurrency(data.resumo_sangrias.total_hoje || 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            Mês: {formatCurrency(data.resumo_sangrias.total_mes || 0)}
          </p>
        </Card>

        {/* Card 4: Clientes Ativos */}
        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500">Clientes Ativos</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {data.clientes_ativos.ativos_30_dias}
          </div>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            de {data.clientes_ativos.total_cadastrados} clientes cadastrados
          </p>
        </Card>
      </div>

      {/* Seção 1: Alertas de Estoque e Resumo de Sangrias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes de Alertas de Estoque */}
        <Card
          className="border-slate-100 shadow-sm rounded-2xl"
          title={
            <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Box className="w-5 h-5 text-orange-500" />
              Produtos com Estoque em Atenção
            </div>
          }
          styles={{ body: { padding: '16px' } }}
        >
          {data.alertas_estoque.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Todos os produtos estão com níveis adequados de estoque.
            </div>
          ) : (
            <div className="space-y-3">
              {data.alertas_estoque.map((item) => (
                <div
                  key={item.id_produto}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{item.nome}</div>
                    <div className="text-xs text-slate-400">
                      {item.critico ? 'Estoque crítico!' : 'Nível baixo'}
                    </div>
                  </div>
                  <Tag
                    color={item.critico ? 'error' : 'warning'}
                    className="font-bold text-sm px-2.5 py-0.5 rounded-lg"
                  >
                    {item.quantidade} un disponíveis
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Detalhamento de Sangrias */}
        <Card
          className="border-slate-100 shadow-sm rounded-2xl"
          title={
            <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Resumo de Sangrias (Hoje)
            </div>
          }
          styles={{ body: { padding: '16px' } }}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.keys(data.resumo_sangrias.por_tipo).length === 0 ? (
              <span className="text-sm text-slate-400">Nenhuma sangria hoje.</span>
            ) : (
              Object.entries(data.resumo_sangrias.por_tipo).map(([tipo, valor]) => (
                <Tag key={tipo} color="orange" className="text-xs py-1 px-2.5 rounded-lg">
                  <strong>{tipo}:</strong> {formatCurrency(valor)}
                </Tag>
              ))
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.resumo_sangrias.registros_hoje.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
              >
                <div>
                  <div className="font-medium text-slate-800">{s.descricao}</div>
                  <div className="text-xs text-slate-400">
                    Tipo: {s.tipo} • {(s.created_at || '').slice(11, 16)}
                  </div>
                </div>
                <span className="font-bold text-red-500">- {formatCurrency(s.valor)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Seção 2: Tabela de Clientes Inadimplentes */}
      <Card
        className="border-slate-100 shadow-sm rounded-2xl overflow-hidden"
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Clientes com Débitos Pendentes (Inadimplência)
          </div>
        }
        styles={{ body: { padding: '16px' } }}
      >
        <Table
          dataSource={data.alertas_inadimplencia}
          rowKey="id_cliente"
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Nenhum cliente com débitos pendentes.' }}
          columns={[
            {
              title: 'Cliente',
              dataIndex: 'nome',
              key: 'nome',
              render: (nome: string) => <span className="font-semibold text-slate-800">{nome}</span>,
            },
            {
              title: 'Telefone',
              dataIndex: 'telefone',
              key: 'telefone',
              render: (t: string) => <span>{t || '-'}</span>,
            },
            {
              title: 'Limite de Crédito',
              dataIndex: 'limite_credito',
              key: 'limite',
              align: 'right' as const,
              render: (v: number) => <span>{formatCurrency(v || 0)}</span>,
            },
            {
              title: 'Débito Total',
              dataIndex: 'valor_devido',
              key: 'debito',
              align: 'right' as const,
              render: (v: number) => (
                <span className="font-bold text-red-600">{formatCurrency(v)}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
