import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  Search,
  Box,
  DollarSign,
  Bike,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

// Função utilitária para exportar qualquer array de dados para CSV
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(';'), ...rows.map((e) => e.map((val) => `"${val}"`).join(';'))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function Pesquisa() {
  const [activeTab, setActiveTab] = useState<string>('estoque');

  // Filtros Globais
  const [dataEstoque, setDataEstoque] = useState<Dayjs>(dayjs());
  const [dataFinanceiro, setDataFinanceiro] = useState<Dayjs>(dayjs());
  const [periodoEntregadores, setPeriodoEntregadores] = useState<string>('diario');
  const [dataInicioAvancada, setDataInicioAvancada] = useState<Dayjs | null>(dayjs().subtract(7, 'days'));
  const [dataFimAvancada, setDataFimAvancada] = useState<Dayjs | null>(dayjs());
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedProduto, setSelectedProduto] = useState<string>('');

  // Opções de Seleção
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  // Estados de Dados
  const [estoqueData, setEstoqueData] = useState<any[]>([]);
  const [financeiroData, setFinanceiroData] = useState<any | null>(null);
  const [entregadoresData, setEntregadoresData] = useState<any[]>([]);
  const [avancadaData, setAvancadaData] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Carrega opções de filtro
    Promise.all([
      api.get('/funcionarios/'),
      api.get('/clientes/'),
      api.get('/produtos/'),
    ])
      .then(([fRes, cRes, pRes]) => {
        setFuncionarios(fRes.data || []);
        setClientes(cRes.data || []);
        setProdutos(pRes.data || []);
      })
      .catch((err) => console.error('Erro ao carregar filtros:', err));
  }, []);

  // 1. Busca Estoque Diário
  const fetchEstoque = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pesquisa/estoque/', {
        params: { data: dataEstoque.format('YYYY-MM-DD') },
      });
      setEstoqueData(res.data || []);
    } catch (err) {
      message.error('Erro ao carregar dados de estoque.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Busca Financeiro Diário
  const fetchFinanceiro = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pesquisa/financeiro/', {
        params: { data: dataFinanceiro.format('YYYY-MM-DD') },
      });
      setFinanceiroData(res.data || null);
    } catch (err) {
      message.error('Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Busca Entregadores
  const fetchEntregadores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pesquisa/entregadores/', {
        params: { periodo: periodoEntregadores },
      });
      setEntregadoresData(res.data || []);
    } catch (err) {
      message.error('Erro ao carregar dados de entregadores.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Busca Pesquisa Avançada
  const fetchAvancada = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dataInicioAvancada) params.data_inicio = dataInicioAvancada.format('YYYY-MM-DD');
      if (dataFimAvancada) params.data_fim = dataFimAvancada.format('YYYY-MM-DD');
      if (selectedFuncionario) params.id_funcionario = selectedFuncionario;
      if (selectedCliente) params.id_cliente = selectedCliente;
      if (selectedProduto) params.id_produto = selectedProduto;

      const res = await api.get('/pesquisa/avancada/', { params });
      setAvancadaData(res.data || []);
    } catch (err) {
      message.error('Erro ao carregar pesquisa avançada.');
    } finally {
      setLoading(false);
    }
  };

  // Dispara busca conforme aba ativa ou filtro correspondente
  useEffect(() => {
    if (activeTab === 'estoque') fetchEstoque();
    if (activeTab === 'financeiro') fetchFinanceiro();
    if (activeTab === 'entregadores') fetchEntregadores();
    if (activeTab === 'avancada') fetchAvancada();
  }, [activeTab, dataEstoque, dataFinanceiro, periodoEntregadores]);

  // Handlers de Exportação
  const exportEstoque = () => {
    const headers = ['Produto', 'Categoria', 'Entradas no Dia', 'Saídas no Dia', 'Saldo Disponível Atual'];
    const rows = estoqueData.map((e) => [
      e.produto,
      e.categoria,
      e.entradas_dia,
      e.saidas_dia,
      e.saldo_disponivel,
    ]);
    exportToCSV(`relatorio_estoque_${dataEstoque.format('YYYY-MM-DD')}`, headers, rows);
  };

  const exportFinanceiro = () => {
    if (!financeiroData) return;
    const headers = ['Métrica / Forma', 'Valor (R$)'];
    const rows: (string | number)[][] = [
      ['Total Vendas Bruto', financeiroData.total_vendas_bruto],
      ['Total Recebido', financeiroData.total_recebido],
      ['Total Sangrias', financeiroData.total_sangrias],
      ['Balanço Líquido', financeiroData.balanco_liquido],
    ];
    Object.entries(financeiroData.totais_por_forma || {}).forEach(([forma, val]) => {
      rows.push([`Recebido: ${forma}`, val as number]);
    });
    exportToCSV(`relatorio_financeiro_${dataFinanceiro.format('YYYY-MM-DD')}`, headers, rows);
  };

  const exportEntregadores = () => {
    const headers = ['Funcionário / Entregador', 'Função', 'Pedidos', 'Cilindros Vendidos', 'Valor Faturado (R$)', 'Sangrias (R$)', 'Saldo Líquido (R$)', 'Ticket Médio (R$)'];
    const rows = entregadoresData.map((e) => [
      e.nome,
      e.role,
      e.pedidos_count,
      e.itens_vendidos,
      e.valor_faturado,
      e.valor_sangrias,
      e.saldo_liquido,
      e.ticket_medio,
    ]);
    exportToCSV(`relatorio_entregadores_${periodoEntregadores}`, headers, rows);
  };

  const exportAvancada = () => {
    const headers = ['Data', 'Hora', 'Cliente', 'Telefone', 'Funcionário', 'Produtos', 'Qtd Total', 'Valor Total (R$)'];
    const rows = avancadaData.map((a) => [
      a.data,
      a.hora,
      a.cliente,
      a.telefone,
      a.funcionario,
      a.produtos,
      a.quantidade_total,
      a.valor_total,
    ]);
    exportToCSV(`relatorio_avancado`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
          <Search className="w-6 h-6 text-orange-500" />
          Central de Pesquisas e Relatórios
        </h2>
        <p className="text-slate-500 mt-1 mb-0">
          Cruze dados de estoque em tempo real, financeiro diário, entregadores e gere relatórios com exportação.
        </p>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl p-2" styles={{ body: { padding: '16px 20px' } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="pesquisa-tabs"
          items={[
            // ================= SUB-ABA 1: ESTOQUE =================
            {
              key: 'estoque',
              label: (
                <span className="flex items-center gap-2 text-base font-medium py-1">
                  <Box className="w-4 h-4 text-orange-500" />
                  Estoque Diário
                </span>
              ),
              children: (
                <div className="space-y-5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">Data de Referência:</span>
                      <DatePicker
                        format="DD/MM/YYYY"
                        className="h-10 w-44"
                        value={dataEstoque}
                        onChange={(d) => setDataEstoque(d || dayjs())}
                      />
                      <Button onClick={fetchEstoque} loading={loading} className="h-10 rounded-xl">
                        Atualizar
                      </Button>
                    </div>

                    <Button
                      type="primary"
                      icon={<Download className="w-4 h-4" />}
                      className="bg-orange-500 hover:bg-orange-600 border-none h-10 rounded-xl font-medium"
                      onClick={exportEstoque}
                    >
                      Exportar CSV
                    </Button>
                  </div>

                  <Table
                    dataSource={estoqueData}
                    rowKey="id_produto"
                    loading={loading}
                    pagination={false}
                    columns={[
                      {
                        title: 'Produto',
                        dataIndex: 'produto',
                        key: 'produto',
                        render: (p: string) => <span className="font-semibold text-slate-800">{p}</span>,
                      },
                      {
                        title: 'Categoria',
                        dataIndex: 'categoria',
                        key: 'categoria',
                        render: (c: string) => <Tag color="blue">{c}</Tag>,
                      },
                      {
                        title: 'Preço Padrão',
                        dataIndex: 'valor_padrao',
                        key: 'valor_padrao',
                        align: 'right' as const,
                        render: (v: number) => <span>{formatCurrency(v)}</span>,
                      },
                      {
                        title: 'Entradas no Dia',
                        dataIndex: 'entradas_dia',
                        key: 'entradas_dia',
                        align: 'center' as const,
                        render: (v: number) => <span className="font-medium text-green-600">+{v} un</span>,
                      },
                      {
                        title: 'Saídas no Dia (Tempo Real)',
                        dataIndex: 'saidas_dia',
                        key: 'saidas_dia',
                        align: 'center' as const,
                        render: (v: number) => <span className="font-medium text-red-500">-{v} un</span>,
                      },
                      {
                        title: 'Saldo Disponível Atual',
                        dataIndex: 'saldo_disponivel',
                        key: 'saldo_disponivel',
                        align: 'center' as const,
                        render: (v: number) => (
                          <Tag color={v <= 3 ? 'error' : v <= 10 ? 'warning' : 'green'} className="font-bold text-sm px-3 py-1">
                            {v} unidades
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },

            // ================= SUB-ABA 2: FINANCEIRO =================
            {
              key: 'financeiro',
              label: (
                <span className="flex items-center gap-2 text-base font-medium py-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Financeiro Diário
                </span>
              ),
              children: (
                <div className="space-y-5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">Data de Referência:</span>
                      <DatePicker
                        format="DD/MM/YYYY"
                        className="h-10 w-44"
                        value={dataFinanceiro}
                        onChange={(d) => setDataFinanceiro(d || dayjs())}
                      />
                      <Button onClick={fetchFinanceiro} loading={loading} className="h-10 rounded-xl">
                        Atualizar
                      </Button>
                    </div>

                    <Button
                      type="primary"
                      icon={<Download className="w-4 h-4" />}
                      className="bg-orange-500 hover:bg-orange-600 border-none h-10 rounded-xl font-medium"
                      onClick={exportFinanceiro}
                    >
                      Exportar CSV
                    </Button>
                  </div>

                  {financeiroData && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-xs text-slate-500 font-medium">Vendas Bruto</div>
                          <div className="text-xl font-bold text-slate-800 mt-1">
                            {formatCurrency(financeiroData.total_vendas_bruto || 0)}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-xs text-slate-500 font-medium">Total Recebido</div>
                          <div className="text-xl font-bold text-green-600 mt-1">
                            {formatCurrency(financeiroData.total_recebido || 0)}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-xs text-slate-500 font-medium">Sangrias Retiradas</div>
                          <div className="text-xl font-bold text-red-500 mt-1">
                            - {formatCurrency(financeiroData.total_sangrias || 0)}
                          </div>
                        </div>

                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <div className="text-xs text-orange-600 font-semibold">Balanço Líquido Caixa</div>
                          <div className="text-xl font-bold text-orange-600 mt-1">
                            {formatCurrency(financeiroData.balanco_liquido || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-slate-100 rounded-xl">
                        <div className="text-sm font-semibold text-slate-700 mb-3">
                          Recebimentos por Forma de Pagamento
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(financeiroData.totais_por_forma || {}).map(([forma, val]) => (
                            <div key={forma} className="p-3 bg-slate-50 border border-slate-100 rounded-lg min-w-36">
                              <span className="text-xs text-slate-400 block">{forma}</span>
                              <span className="text-base font-bold text-slate-800">
                                {formatCurrency(val as number)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ),
            },

            // ================= SUB-ABA 3: ENTREGADORES =================
            {
              key: 'entregadores',
              label: (
                <span className="flex items-center gap-2 text-base font-medium py-1">
                  <Bike className="w-4 h-4 text-blue-600" />
                  Entregadores
                </span>
              ),
              children: (
                <div className="space-y-5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">Período de Análise:</span>
                      <Select
                        className="h-10 w-44"
                        value={periodoEntregadores}
                        onChange={setPeriodoEntregadores}
                        options={[
                          { value: 'diario', label: 'Diário (Hoje)' },
                          { value: 'semanal', label: 'Últimos 7 Dias' },
                          { value: 'mensal', label: 'Últimos 30 Dias' },
                          { value: 'overall', label: 'Geral / Overall' },
                        ]}
                      />
                      <Button onClick={fetchEntregadores} loading={loading} className="h-10 rounded-xl">
                        Atualizar
                      </Button>
                    </div>

                    <Button
                      type="primary"
                      icon={<Download className="w-4 h-4" />}
                      className="bg-orange-500 hover:bg-orange-600 border-none h-10 rounded-xl font-medium"
                      onClick={exportEntregadores}
                    >
                      Exportar CSV
                    </Button>
                  </div>

                  <Table
                    dataSource={entregadoresData}
                    rowKey="id_funcionario"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: 'Funcionário / Entregador',
                        dataIndex: 'nome',
                        key: 'nome',
                        render: (n: string) => <span className="font-semibold text-slate-800">{n}</span>,
                      },
                      {
                        title: 'Função',
                        dataIndex: 'role',
                        key: 'role',
                        render: (r: string) => <Tag color="cyan">{r}</Tag>,
                      },
                      {
                        title: 'Vendas (Pedidos)',
                        dataIndex: 'pedidos_count',
                        key: 'pedidos_count',
                        align: 'center' as const,
                        render: (c: number) => <span className="font-medium">{c}</span>,
                      },
                      {
                        title: 'Cilindros / Itens',
                        dataIndex: 'itens_vendidos',
                        key: 'itens_vendidos',
                        align: 'center' as const,
                        render: (c: number) => <span className="font-semibold text-slate-800">{c} un</span>,
                      },
                      {
                        title: 'Faturamento Bruto',
                        dataIndex: 'valor_faturado',
                        key: 'valor_faturado',
                        align: 'right' as const,
                        render: (v: number) => (
                          <span className="font-bold text-slate-800">{formatCurrency(v)}</span>
                        ),
                      },
                      {
                        title: 'Sangrias',
                        dataIndex: 'valor_sangrias',
                        key: 'valor_sangrias',
                        align: 'right' as const,
                        render: (v: number) => (
                          <span className="font-medium text-red-500">- {formatCurrency(v)}</span>
                        ),
                      },
                      {
                        title: 'Saldo Líquido',
                        dataIndex: 'saldo_liquido',
                        key: 'saldo_liquido',
                        align: 'right' as const,
                        render: (v: number) => (
                          <span className="font-bold text-green-600">{formatCurrency(v)}</span>
                        ),
                      },
                      {
                        title: 'Ticket Médio',
                        dataIndex: 'ticket_medio',
                        key: 'ticket_medio',
                        align: 'right' as const,
                        render: (v: number) => <span>{formatCurrency(v)}</span>,
                      },
                    ]}
                  />
                </div>
              ),
            },

            // ================= SUB-ABA 4: PESQUISA AVANÇADA =================
            {
              key: 'avancada',
              label: (
                <span className="flex items-center gap-2 text-base font-medium py-1">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  Pesquisa Avançada
                </span>
              ),
              children: (
                <div className="space-y-5 pt-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Data Início</label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          className="w-full h-10"
                          value={dataInicioAvancada}
                          onChange={setDataInicioAvancada}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Data Fim</label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          className="w-full h-10"
                          value={dataFimAvancada}
                          onChange={setDataFimAvancada}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Funcionário</label>
                        <Select
                          className="w-full h-10"
                          placeholder="Todos"
                          allowClear
                          value={selectedFuncionario || undefined}
                          onChange={setSelectedFuncionario}
                          options={funcionarios.map((f) => ({ value: f.id, label: f.nome }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Cliente</label>
                        <Select
                          className="w-full h-10"
                          showSearch
                          optionFilterProp="label"
                          placeholder="Todos"
                          allowClear
                          value={selectedCliente || undefined}
                          onChange={setSelectedCliente}
                          options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Produto</label>
                        <Select
                          className="w-full h-10"
                          placeholder="Todos"
                          allowClear
                          value={selectedProduto || undefined}
                          onChange={setSelectedProduto}
                          options={produtos.map((p) => ({ value: p.id, label: p.nome }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                      <Button onClick={fetchAvancada} loading={loading} type="primary" className="bg-slate-800 h-10 px-5 rounded-xl">
                        Executar Filtros
                      </Button>
                      <Button
                        icon={<Download className="w-4 h-4" />}
                        className="bg-orange-500 text-white hover:!bg-orange-600 border-none h-10 px-5 rounded-xl font-medium"
                        onClick={exportAvancada}
                      >
                        Exportar Relatório CSV
                      </Button>
                    </div>
                  </div>

                  <Table
                    dataSource={avancadaData}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                    scroll={{ x: 800 }}
                    columns={[
                      {
                        title: 'Data / Hora',
                        key: 'data',
                        render: (_: any, r: any) => (
                          <div>
                            <span className="font-semibold text-slate-800">{r.data}</span>
                            <div className="text-xs text-slate-400">{r.hora}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Cliente',
                        dataIndex: 'cliente',
                        key: 'cliente',
                        render: (c: string, r: any) => (
                          <div>
                            <span className="font-semibold text-slate-800">{c}</span>
                            <div className="text-xs text-slate-400">{r.telefone}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Funcionário',
                        dataIndex: 'funcionario',
                        key: 'funcionario',
                        render: (f: string) => <span>{f}</span>,
                      },
                      {
                        title: 'Produtos e Quantidades',
                        dataIndex: 'produtos',
                        key: 'produtos',
                      },
                      {
                        title: 'Qtd Total',
                        dataIndex: 'quantidade_total',
                        key: 'quantidade_total',
                        align: 'center' as const,
                        render: (q: number) => <span className="font-bold">{q}</span>,
                      },
                      {
                        title: 'Valor Total',
                        dataIndex: 'valor_total',
                        key: 'valor_total',
                        align: 'right' as const,
                        render: (v: number) => (
                          <span className="font-bold text-orange-600">{formatCurrency(v)}</span>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}