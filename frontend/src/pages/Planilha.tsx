import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Input,
  Tag,
  Typography,
  Tabs,
  Modal,
  Popconfirm,
  message,
} from 'antd';
import {
  Handshake,
  Calendar,
  Users,
  Plus,
  ShoppingCart,
  Wallet,
  TrendingDown,
  FileSpreadsheet,
  Package,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore } from '@/store/useAuth';

const { Text, Title } = Typography;

interface Funcionario {
  id: string;
  nome: string;
  role: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  saldo_devedor?: number;
}

interface Produto {
  id: string;
  nome: string;
  valor_padrao: number;
  quantidade_disponivel?: number;
}

interface VendaItem {
  id: string;
  cliente_nome?: string;
  funcionario_nome?: string;
  valor_total: number;
  created_at: string;
  itens_venda?: Array<{
    produtos?: { nome: string };
    quantidade: number;
    valor_unitario: number;
    valor_subtotal: number;
  }>;
}

interface PagamentoItem {
  id: string;
  cliente_nome?: string;
  valor: number;
  forma_pagamento: string;
  created_at: string;
}

interface SangriaItem {
  id: string;
  funcionario_nome?: string;
  tipo: string;
  descricao: string;
  valor: number;
  created_at: string;
}

interface SaidaItem {
  id: string;
  produtos?: { nome: string };
  tipo: string;
  quantidade: number;
  created_at: string;
}

interface TotaisPlanilha {
  DINHEIRO: number;
  PIX: number;
  CREDITO: number;
  DEBITO: number;
  CHEQUE: number;
  A_PRAZO: number;
  TOTAL_VENDAS: number;
  TOTAL_PAGAMENTOS: number;
  TOTAL_SANGRIAS: number;
  SALDO_CAIXA: number;
}

export function Planilha() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [selectedFuncionario, setSelectedFuncionario] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState<boolean>(false);

  // Dados da Planilha
  const [vendas, setVendas] = useState<VendaItem[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [sangrias, setSangrias] = useState<SangriaItem[]>([]);
  const [saidas, setSaidas] = useState<SaidaItem[]>([]);
  const [totais, setTotais] = useState<TotaisPlanilha>({
    DINHEIRO: 0,
    PIX: 0,
    CREDITO: 0,
    DEBITO: 0,
    CHEQUE: 0,
    A_PRAZO: 0,
    TOTAL_VENDAS: 0,
    TOTAL_PAGAMENTOS: 0,
    TOTAL_SANGRIAS: 0,
    SALDO_CAIXA: 0,
  });

  // Modais de Criação
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Nova Venda
  const [vendaCliente, setVendaCliente] = useState<string>('');
  const [vendaProduto, setVendaProduto] = useState<string>('');
  const [vendaQuantidade, setVendaQuantidade] = useState<number>(1);
  const [vendaValorUnitario, setVendaValorUnitario] = useState<number>(0);
  const [vendaFormaPagamento, setVendaFormaPagamento] = useState<string>('DINHEIRO');

  // Form State: Novo Pagamento
  const [pagCliente, setPagCliente] = useState<string>('');
  const [pagValor, setPagValor] = useState<number | null>(null);
  const [pagForma, setPagForma] = useState<string>('DINHEIRO');

  // Form State: Nova Sangria
  const [sangriaTipo, setSangriaTipo] = useState<string>('DESPESA');
  const [sangriaDesc, setSangriaDesc] = useState<string>('');
  const [sangriaValor, setSangriaValor] = useState<number | null>(null);

  const isAdmin = useAuthStore((state) => state.isAdmin);
  const currentUser = useAuthStore((state) => state.user);

  // Carrega opções iniciais (funcionários, clientes, produtos)
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [funcsRes, cliRes, prodsRes] = await Promise.all([
          api.get('/funcionarios/'),
          api.get('/clientes/'),
          api.get('/produtos/'),
        ]);
        const funcs = funcsRes.data || [];
        setFuncionarios(funcs);
        setClientes(cliRes.data || []);
        setProdutos(prodsRes.data || []);

        // Seleciona o funcionário atual por padrão se existir
        if (currentUser?.id && funcs.some((f: any) => f.id === currentUser.id)) {
          setSelectedFuncionario(currentUser.id);
        } else if (funcs.length > 0) {
          setSelectedFuncionario(funcs[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados base:', err);
      }
    };
    loadInitial();
  }, []);

  // Ao mudar o funcionário ou a data, busca os dados da planilha
  const fetchPlanilha = async () => {
    setLoading(true);
    try {
      const res = await api.get('/planilha/', {
        params: {
          date: selectedDate.format('YYYY-MM-DD'),
          id_funcionario: selectedFuncionario || undefined,
        },
      });

      setVendas(res.data.vendas || []);
      setPagamentos(res.data.pagamentos || []);
      setSangrias(res.data.sangrias || []);
      setSaidas(res.data.saidas || []);
      if (res.data.totals) {
        setTotais(res.data.totals);
      }
    } catch (err) {
      console.error('Erro ao buscar planilha:', err);
      message.error('Erro ao carregar dados da planilha.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanilha();
  }, [selectedDate, selectedFuncionario]);

  // Atualiza preço unitário ao escolher produto e cliente
  const handleSelectProduto = async (prodId: string) => {
    setVendaProduto(prodId);
    const prod = produtos.find((p) => p.id === prodId);
    let price = prod ? Number(prod.valor_padrao) : 0;

    // Checa se cliente tem valor específico
    if (vendaCliente) {
      try {
        const pRes = await api.get(`/clientes/${vendaCliente}/precos/`);
        const precos = pRes.data || [];
        const custom = precos.find((cp: any) => cp.id_produto === prodId);
        if (custom) {
          price = Number(custom.valor_especifico);
        }
      } catch (e) {
        // Fallback para preço padrão
      }
    }
    setVendaValorUnitario(price);
  };

  const handleCreateVenda = async () => {
    if (!vendaCliente || !vendaProduto || !vendaQuantidade || vendaQuantidade <= 0) {
      message.warning('Preencha todos os campos obrigatórios da venda.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/vendas/', {
        id_cliente: vendaCliente,
        id_funcionario: selectedFuncionario || currentUser?.id,
        created_at: `${selectedDate.format('YYYY-MM-DD')}T12:00:00`,
        itens: [
          {
            id_produto: vendaProduto,
            quantidade: vendaQuantidade,
            valor_unitario: vendaValorUnitario,
          },
        ],
        forma_pagamento: vendaFormaPagamento,
        valor_recebido:
          vendaFormaPagamento === 'A PRAZO (VENDA)'
            ? 0
            : vendaQuantidade * vendaValorUnitario,
      });

      message.success('Venda registrada com sucesso!');
      setIsVendaModalOpen(false);
      setVendaProduto('');
      setVendaQuantidade(1);
      setVendaValorUnitario(0);
      fetchPlanilha();
    } catch (error: any) {
      console.error('Erro ao registrar venda:', error);
      message.error(error.response?.data?.error || 'Erro ao registrar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePagamento = async () => {
    if (!pagCliente || !pagValor || pagValor <= 0) {
      message.warning('Informe o cliente e o valor pago.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/pagamentos/', {
        id_cliente: pagCliente,
        valor: pagValor,
        forma_pagamento: pagForma,
        created_at: `${selectedDate.format('YYYY-MM-DD')}T12:00:00`,
      });

      message.success('Pagamento registrado com sucesso!');
      setIsPagamentoModalOpen(false);
      setPagValor(null);
      fetchPlanilha();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      message.error(error.response?.data?.error || 'Erro ao registrar pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSangria = async () => {
    if (!sangriaValor || sangriaValor <= 0) {
      message.warning('Informe um valor válido para a sangria.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sangrias/', {
        id_funcionario: selectedFuncionario || currentUser?.id,
        tipo: sangriaTipo,
        descricao: sangriaDesc.trim() || 'Sangria de caixa',
        valor: sangriaValor,
        created_at: `${selectedDate.format('YYYY-MM-DD')}T12:00:00`,
      });

      message.success('Sangria registrada com sucesso!');
      setIsSangriaModalOpen(false);
      setSangriaDesc('');
      setSangriaValor(null);
      fetchPlanilha();
    } catch (error: any) {
      console.error('Erro ao registrar sangria:', error);
      message.error(error.response?.data?.error || 'Erro ao registrar sangria.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVenda = async (id: string) => {
    try {
      await api.delete(`/vendas/${id}/`);
      message.success('Venda cancelada.');
      fetchPlanilha();
    } catch (err: any) {
      message.error('Erro ao cancelar venda.');
    }
  };

  const handleDeletePagamento = async (id: string) => {
    try {
      await api.delete(`/pagamentos/${id}/`);
      message.success('Pagamento removido.');
      fetchPlanilha();
    } catch (err: any) {
      message.error('Erro ao excluir pagamento.');
    }
  };

  const handleDeleteSangria = async (id: string) => {
    try {
      await api.delete(`/sangrias/${id}/`);
      message.success('Sangria removida.');
      fetchPlanilha();
    } catch (err: any) {
      message.error('Erro ao excluir sangria.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Seletores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <Handshake className="w-6 h-6 text-orange-500" />
            Planilha de Fechamento do Dia
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Preencha e visualize vendas, pagamentos recebidos, sangrias e saídas de estoque.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsVendaModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 border-none font-medium h-10 rounded-xl"
          >
            Lançar Venda
          </Button>
          <Button
            onClick={() => setIsPagamentoModalOpen(true)}
            className="border-green-600 text-green-700 hover:bg-green-50 font-medium h-10 rounded-xl"
          >
            Lançar Pagamento
          </Button>
          <Button
            onClick={() => setIsSangriaModalOpen(true)}
            className="border-red-500 text-red-600 hover:bg-red-50 font-medium h-10 rounded-xl"
          >
            Lançar Sangria
          </Button>
        </div>
      </div>

      {/* Barra de Filtros: Funcionário e Data */}
      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '16px 20px' } }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Funcionário / Entregador
            </label>
            <Select
              className="w-full h-10"
              placeholder="Todos os funcionários"
              value={selectedFuncionario || undefined}
              onChange={setSelectedFuncionario}
              allowClear
              options={funcionarios.map((f) => ({
                value: f.id,
                label: `${f.nome} (${f.role})`,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Data de Fechamento
            </label>
            <DatePicker
              className="w-full h-10"
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(d) => setSelectedDate(d || dayjs())}
            />
          </div>

          <div className="flex justify-end items-end h-full">
            <Button
              type="default"
              onClick={fetchPlanilha}
              loading={loading}
              className="h-10 px-6 rounded-xl font-medium"
            >
              Atualizar Dados
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards de Resumo e Balanço do Caixa */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '16px' } }}>
          <div className="text-xs font-medium text-slate-500">Total em Vendas</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {formatCurrency(totais.TOTAL_VENDAS || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{vendas.length} venda(s) registrada(s)</div>
        </Card>

        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '16px' } }}>
          <div className="text-xs font-medium text-slate-500">Total Recebido</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totais.TOTAL_PAGAMENTOS || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{pagamentos.length} recebimento(s)</div>
        </Card>

        <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '16px' } }}>
          <div className="text-xs font-medium text-slate-500">Total em Sangrias</div>
          <div className="text-2xl font-bold text-red-500 mt-1">
            {formatCurrency(totais.TOTAL_SANGRIAS || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{sangrias.length} retirada(s)</div>
        </Card>

        <Card className="border-slate-100 shadow-sm rounded-2xl bg-orange-50/50" styles={{ body: { padding: '16px' } }}>
          <div className="text-xs font-medium text-orange-600">Saldo Líquido em Caixa</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {formatCurrency(totais.SALDO_CAIXA || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">(Recebido - Sangrias)</div>
        </Card>
      </div>

      {/* Tabs com Detalhamento de Vendas, Pagamentos, Sangrias e Saídas */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: '12px 20px 24px 20px' } }}>
        <Tabs
          defaultActiveKey="vendas"
          items={[
            {
              key: 'vendas',
              label: (
                <span className="flex items-center gap-2 font-medium">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  Vendas do Dia ({vendas.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={vendas}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 700 }}
                  columns={[
                    {
                      title: 'Cliente',
                      key: 'cliente',
                      render: (_: any, r: VendaItem) => (
                        <span className="font-semibold text-slate-800">{r.cliente_nome}</span>
                      ),
                    },
                    {
                      title: 'Itens / Produtos',
                      key: 'itens',
                      render: (_: any, r: VendaItem) => {
                        const items = r.itens_venda || [];
                        if (!items.length) return <span className="text-slate-400">-</span>;
                        return (
                          <div className="space-y-0.5">
                            {items.map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-700">
                                <strong>{it.quantidade}x</strong> {it.produtos?.nome || 'Gás'} (
                                {formatCurrency(it.valor_unitario)})
                              </div>
                            ))}
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Valor Total',
                      dataIndex: 'valor_total',
                      key: 'valor_total',
                      align: 'right' as const,
                      render: (v: number) => (
                        <span className="font-bold text-slate-800">{formatCurrency(v)}</span>
                      ),
                    },
                    {
                      title: 'Hora',
                      key: 'hora',
                      align: 'center' as const,
                      render: (_: any, r: VendaItem) => (
                        <span className="text-xs text-slate-500">
                          {(r.created_at || '').slice(11, 16)}
                        </span>
                      ),
                    },
                    ...(isAdmin
                      ? [
                          {
                            title: 'Ações',
                            key: 'actions',
                            align: 'center' as const,
                            render: (_: any, r: VendaItem) => (
                              <Popconfirm
                                title="Cancelar venda"
                                description="Deseja realmente cancelar esta venda?"
                                onConfirm={() => handleDeleteVenda(r.id)}
                              >
                                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} />
                              </Popconfirm>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
            {
              key: 'pagamentos',
              label: (
                <span className="flex items-center gap-2 font-medium">
                  <Wallet className="w-4 h-4 text-green-600" />
                  Pagamentos Recebidos ({pagamentos.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={pagamentos}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'Cliente',
                      dataIndex: 'cliente_nome',
                      key: 'cliente_nome',
                      render: (nome: string) => <span className="font-semibold">{nome}</span>,
                    },
                    {
                      title: 'Forma de Pagamento',
                      dataIndex: 'forma_pagamento',
                      key: 'forma_pagamento',
                      render: (f: string) => <Tag color="blue">{f}</Tag>,
                    },
                    {
                      title: 'Valor Pago',
                      dataIndex: 'valor',
                      key: 'valor',
                      align: 'right' as const,
                      render: (v: number) => (
                        <span className="font-bold text-green-600">{formatCurrency(v)}</span>
                      ),
                    },
                    ...(isAdmin
                      ? [
                          {
                            title: 'Ações',
                            key: 'actions',
                            align: 'center' as const,
                            render: (_: any, r: PagamentoItem) => (
                              <Popconfirm
                                title="Remover pagamento"
                                onConfirm={() => handleDeletePagamento(r.id)}
                              >
                                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} />
                              </Popconfirm>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
            {
              key: 'sangrias',
              label: (
                <span className="flex items-center gap-2 font-medium">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Sangrias / Despesas ({sangrias.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={sangrias}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'Tipo',
                      dataIndex: 'tipo',
                      key: 'tipo',
                      render: (t: string) => <Tag color="orange">{t}</Tag>,
                    },
                    {
                      title: 'Descrição',
                      dataIndex: 'descricao',
                      key: 'descricao',
                    },
                    {
                      title: 'Valor Retirado',
                      dataIndex: 'valor',
                      key: 'valor',
                      align: 'right' as const,
                      render: (v: number) => (
                        <span className="font-bold text-red-600">- {formatCurrency(v)}</span>
                      ),
                    },
                    ...(isAdmin
                      ? [
                          {
                            title: 'Ações',
                            key: 'actions',
                            align: 'center' as const,
                            render: (_: any, r: SangriaItem) => (
                              <Popconfirm
                                title="Remover sangria"
                                onConfirm={() => handleDeleteSangria(r.id)}
                              >
                                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} />
                              </Popconfirm>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
            {
              key: 'saidas',
              label: (
                <span className="flex items-center gap-2 font-medium">
                  <Package className="w-4 h-4 text-slate-500" />
                  Saídas de Estoque ({saidas.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={saidas}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'Produto',
                      key: 'prod',
                      render: (_: any, r: SaidaItem) => <span>{r.produtos?.nome || 'Gás'}</span>,
                    },
                    {
                      title: 'Tipo da Saída',
                      dataIndex: 'tipo',
                      key: 'tipo',
                      render: (t: string) => <Tag color="purple">{t}</Tag>,
                    },
                    {
                      title: 'Quantidade',
                      dataIndex: 'quantidade',
                      key: 'quantidade',
                      align: 'center' as const,
                      render: (q: number) => <span className="font-semibold">{q} un</span>,
                    },
                    {
                      title: 'Hora',
                      key: 'hora',
                      align: 'center' as const,
                      render: (_: any, r: SaidaItem) => (
                        <span className="text-xs text-slate-400">
                          {(r.created_at || '').slice(11, 16)}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Modal: Nova Venda */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            Lançar Nova Venda
          </div>
        }
        open={isVendaModalOpen}
        onCancel={() => setIsVendaModalOpen(false)}
        onOk={handleCreateVenda}
        confirmLoading={submitting}
        okText="Salvar Venda"
        cancelText="Cancelar"
        okButtonProps={{ className: 'bg-orange-500 hover:bg-orange-600 border-none' }}
      >
        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Cliente *</label>
            <Select
              className="w-full h-10"
              showSearch
              placeholder="Selecione o cliente"
              optionFilterProp="label"
              value={vendaCliente || undefined}
              onChange={(cid) => {
                setVendaCliente(cid);
                if (vendaProduto) handleSelectProduto(vendaProduto);
              }}
              options={clientes.map((c) => ({
                value: c.id,
                label: `${c.nome} ${c.telefone ? `(${c.telefone})` : ''} ${
                  c.saldo_devedor && c.saldo_devedor > 0
                    ? `[Débito: ${formatCurrency(c.saldo_devedor)}]`
                    : ''
                }`,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Produto *</label>
            <Select
              className="w-full h-10"
              placeholder="Selecione o produto"
              value={vendaProduto || undefined}
              onChange={handleSelectProduto}
              options={produtos.map((p) => ({
                value: p.id,
                label: `${p.nome} (Padrão: ${formatCurrency(p.valor_padrao)})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Quantidade *</label>
              <InputNumber
                className="w-full h-10"
                min={1}
                value={vendaQuantidade}
                onChange={(val) => setVendaQuantidade(val || 1)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Valor Unitário (R$) *</label>
              <InputNumber
                className="w-full h-10"
                min={0}
                step={0.5}
                value={vendaValorUnitario}
                onChange={(val) => setVendaValorUnitario(val || 0)}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
            <span className="text-sm text-slate-500 font-medium">Subtotal da Venda:</span>
            <span className="text-lg font-bold text-orange-600">
              {formatCurrency(vendaQuantidade * vendaValorUnitario)}
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Forma de Pagamento *</label>
            <Select
              className="w-full h-10"
              value={vendaFormaPagamento}
              onChange={setVendaFormaPagamento}
              options={[
                { value: 'DINHEIRO', label: 'Dinheiro (À Vista)' },
                { value: 'PIX', label: 'PIX (À Vista)' },
                { value: 'DEBITO', label: 'Cartão de Débito' },
                { value: 'CREDITO', label: 'Cartão de Crédito' },
                { value: 'A PRAZO (VENDA)', label: 'A Prazo (Fiado / Pendente)' },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Novo Pagamento */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800">
            <Wallet className="w-5 h-5 text-green-600" />
            Lançar Pagamento Recebido
          </div>
        }
        open={isPagamentoModalOpen}
        onCancel={() => setIsPagamentoModalOpen(false)}
        onOk={handleCreatePagamento}
        confirmLoading={submitting}
        okText="Salvar Pagamento"
        cancelText="Cancelar"
      >
        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Cliente que pagou *</label>
            <Select
              className="w-full h-10"
              showSearch
              placeholder="Selecione o cliente"
              optionFilterProp="label"
              value={pagCliente || undefined}
              onChange={setPagCliente}
              options={clientes.map((c) => ({
                value: c.id,
                label: `${c.nome} ${c.saldo_devedor ? `[Débito: ${formatCurrency(c.saldo_devedor)}]` : ''}`,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Valor Pago (R$) *</label>
            <InputNumber
              className="w-full h-10"
              min={0.01}
              step={1}
              value={pagValor}
              onChange={(v) => setPagValor(v)}
              placeholder="Ex: 95.00"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Forma de Pagamento *</label>
            <Select
              className="w-full h-10"
              value={pagForma}
              onChange={setPagForma}
              options={[
                { value: 'DINHEIRO', label: 'Dinheiro' },
                { value: 'PIX', label: 'PIX' },
                { value: 'DEBITO', label: 'Cartão de Débito' },
                { value: 'CREDITO', label: 'Cartão de Crédito' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Nova Sangria */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Lançar Sangria / Retirada
          </div>
        }
        open={isSangriaModalOpen}
        onCancel={() => setIsSangriaModalOpen(false)}
        onOk={handleCreateSangria}
        confirmLoading={submitting}
        okText="Salvar Sangria"
        cancelText="Cancelar"
      >
        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Tipo / Categoria *</label>
            <Select
              className="w-full h-10"
              value={sangriaTipo}
              onChange={setSangriaTipo}
              options={[
                { value: 'DESPESA', label: 'Despesa Geral' },
                { value: 'COMBUSTIVEL', label: 'Combustível' },
                { value: 'ALIMENTACAO', label: 'Alimentação / Almoço' },
                { value: 'ADIANTAMENTO', label: 'Adiantamento / Vale' },
                { value: 'RETIRADA', label: 'Retirada de Caixa' },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Descrição</label>
            <Input
              className="w-full h-10"
              placeholder="Ex: Abastecimento moto entrega"
              value={sangriaDesc}
              onChange={(e) => setSangriaDesc(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Valor Retirado (R$) *</label>
            <InputNumber
              className="w-full h-10"
              min={0.01}
              step={1}
              value={sangriaValor}
              onChange={(v) => setSangriaValor(v)}
              placeholder="Ex: 50.00"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}