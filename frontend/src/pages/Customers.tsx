import { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  Modal,
  Drawer,
  Tabs,
  Typography,
  InputNumber,
  Select,
  Popconfirm,
  message,
  Space,
} from 'antd';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Wallet,
  Tag as TagIcon,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { maskCPF, maskCNPJ, maskPhone } from '@/utils/masks';
import { useAuthStore } from '@/store/useAuth';

const { Text, Title } = Typography;

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  rua_numero?: string;
  bairro?: string;
  cidade?: string;
  limite_credito?: number;
  total_vendas?: number;
  total_pago?: number;
  saldo_devedor?: number;
  isInadimplente?: boolean;
}

interface Produto {
  id: string;
  nome: string;
  valor_padrao: number;
}

export function Customers() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filtros
  const [search, setSearch] = useState<string>('');
  const [filterDebito, setFilterDebito] = useState<string>('TODOS');

  // Modal Novo / Edição
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Cataguases');
  const [limiteCredito, setLimiteCredito] = useState<number>(0);

  // Drawer de Detalhes / Histórico
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientHistory, setClientHistory] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Form Preço Específico (valor_cliente)
  const [novoPrecoProduto, setNovoPrecoProduto] = useState<string>('');
  const [novoPrecoValor, setNovoPrecoValor] = useState<number | null>(null);
  const [savingPreco, setSavingPreco] = useState(false);

  const isAdmin = useAuthStore((state) => state.isAdmin);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes/');
      setClients(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    api.get('/produtos/').then((res) => setProdutos(res.data || [])).catch(() => {});
  }, []);

  const handleOpenNew = () => {
    setEditingClient(null);
    setNome('');
    setCpfCnpj('');
    setTelefone('');
    setRuaNumero('');
    setBairro('');
    setCidade('Cataguases');
    setLimiteCredito(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingClient(c);
    setNome(c.nome || '');
    setCpfCnpj(c.cpf_cnpj || '');
    setTelefone(c.telefone || '');
    setRuaNumero(c.rua_numero || '');
    setBairro(c.bairro || '');
    setCidade(c.cidade || 'Cataguases');
    setLimiteCredito(c.limite_credito || 0);
    setIsModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!nome.trim()) {
      message.warning('O nome do cliente é obrigatório.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nome: nome.trim(),
        cpf_cnpj: cpfCnpj ? cpfCnpj.trim() : null,
        telefone: telefone ? telefone.trim() : null,
        rua_numero: ruaNumero ? ruaNumero.trim() : null,
        bairro: bairro ? bairro.trim() : null,
        cidade: cidade.trim() || 'Cataguases',
        limite_credito: limiteCredito || 0,
      };

      if (editingClient) {
        await api.put(`/clientes/${editingClient.id}/`, payload);
        message.success('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clientes/', payload);
        message.success('Cliente cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || 'Erro ao salvar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await api.delete(`/clientes/${id}/`);
      message.success('Cliente removido.');
      fetchClients();
    } catch (err: any) {
      message.error('Erro ao excluir cliente.');
    }
  };

  // Abre gaveta de detalhes do cliente
  const handleOpenDetails = async (client: Cliente) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/clientes/${client.id}/historico/`);
      setClientHistory(res.data);
    } catch (err) {
      message.error('Erro ao carregar histórico do cliente.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveValorCliente = async () => {
    if (!selectedClient || !novoPrecoProduto || !novoPrecoValor) {
      message.warning('Selecione o produto e informe o valor diferenciado.');
      return;
    }
    setSavingPreco(true);
    try {
      await api.post(`/clientes/${selectedClient.id}/precos/`, {
        id_produto: novoPrecoProduto,
        valor_especifico: novoPrecoValor,
      });
      message.success('Preço específico cadastrado com sucesso!');
      setNovoPrecoProduto('');
      setNovoPrecoValor(null);
      // Recarrega histórico
      const res = await api.get(`/clientes/${selectedClient.id}/historico/`);
      setClientHistory(res.data);
    } catch (err) {
      message.error('Erro ao salvar preço específico.');
    } finally {
      setSavingPreco(false);
    }
  };

  // Filtro na tabela
  const filteredClients = clients.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch =
      (c.nome || '').toLowerCase().includes(s) ||
      (c.telefone || '').includes(s) ||
      (c.cpf_cnpj || '').includes(s) ||
      (c.bairro || '').toLowerCase().includes(s);

    const hasDebito = (c.saldo_devedor || 0) > 0;
    const matchDebito =
      filterDebito === 'TODOS' ||
      (filterDebito === 'COM_DEBITO' && hasDebito) ||
      (filterDebito === 'SEM_DEBITO' && !hasDebito);

    return matchSearch && matchDebito;
  });

  const columns = [
    {
      title: 'Cliente',
      key: 'nome',
      render: (_: any, r: Cliente) => (
        <div>
          <span className="font-semibold text-slate-800 text-base">{r.nome}</span>
          <div className="text-xs text-slate-400 mt-0.5">
            {r.cpf_cnpj ? `Doc: ${r.cpf_cnpj}` : 'Sem documento'} •{' '}
            {r.telefone ? `Tel: ${r.telefone}` : 'Sem telefone'}
          </div>
        </div>
      ),
    },
    {
      title: 'Endereço',
      key: 'endereco',
      render: (_: any, r: Cliente) => (
        <div className="text-sm text-slate-600">
          <span>{r.rua_numero || '-'}</span>
          {(r.bairro || r.cidade) && (
            <div className="text-xs text-slate-400">
              {r.bairro ? `${r.bairro}, ` : ''}{r.cidade || 'Cataguases'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Total Comprado',
      dataIndex: 'total_vendas',
      key: 'total_vendas',
      align: 'right' as const,
      render: (v: number) => <span>{formatCurrency(v || 0)}</span>,
    },
    {
      title: 'Total Pago',
      dataIndex: 'total_pago',
      key: 'total_pago',
      align: 'right' as const,
      render: (v: number) => <span className="text-green-600">{formatCurrency(v || 0)}</span>,
    },
    {
      title: 'Saldo Devedor (Débito)',
      key: 'saldo_devedor',
      align: 'right' as const,
      render: (_: any, r: Cliente) => {
        const deb = r.saldo_devedor || 0;
        if (deb > 0) {
          return (
            <Tag color="error" className="font-bold text-sm px-2 py-0.5">
              {formatCurrency(deb)}
            </Tag>
          );
        }
        return <Tag color="success">Em dia</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, r: Cliente) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Eye className="w-4 h-4 text-blue-600" />}
            title="Ver Histórico & Débitos"
            onClick={() => handleOpenDetails(r)}
          />
          {isAdmin && (
            <>
              <Button
                type="text"
                icon={<Edit className="w-4 h-4 text-slate-600" />}
                title="Editar Cliente"
                onClick={() => handleOpenEdit(r)}
              />
              <Popconfirm
                title="Excluir cliente"
                description="Tem certeza que deseja inativar este cliente?"
                onConfirm={() => handleDeleteClient(r.id)}
              >
                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} title="Excluir" />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <Users className="w-6 h-6 text-orange-500" />
            Gestão de Clientes
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Cadastre clientes, consulte históricos de compras, débitos pendentes e preços específicos.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNew}
          className="bg-orange-500 hover:bg-orange-600 border-none font-medium h-10 px-5 rounded-xl text-white shadow-sm"
        >
          Novo Cliente
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '16px 20px' } }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <Input
              prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
              placeholder="Buscar por nome, telefone, CPF/CNPJ ou bairro..."
              className="h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>

          <div>
            <Select
              className="w-full h-10"
              value={filterDebito}
              onChange={setFilterDebito}
              options={[
                { value: 'TODOS', label: 'Todos os Clientes' },
                { value: 'COM_DEBITO', label: 'Apenas com Débitos (Inadimplentes)' },
                { value: 'SEM_DEBITO', label: 'Clientes em Dia' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Tabela de Clientes */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: '16px' } }}>
        <Table
          dataSource={filteredClients}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 12 }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'Nenhum cliente cadastrado.' }}
        />
      </Card>

      {/* Modal: Cadastro / Edição de Cliente */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800">
            <Users className="w-5 h-5 text-orange-500" />
            {editingClient ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveClient}
        confirmLoading={submitting}
        okText="Salvar Cliente"
        cancelText="Cancelar"
        okButtonProps={{ className: 'bg-orange-500 hover:bg-orange-600 border-none' }}
      >
        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Nome do Cliente *</label>
            <Input
              className="h-10 rounded-lg"
              placeholder="Ex: João da Silva / Padaria Central"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">CPF / CNPJ</label>
              <Input
                className="h-10 rounded-lg"
                placeholder="Ex: 000.000.000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Telefone / WhatsApp</label>
              <Input
                className="h-10 rounded-lg"
                placeholder="Ex: (32) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Rua e Número</label>
              <Input
                className="h-10 rounded-lg"
                placeholder="Ex: Rua Direita, 120"
                value={ruaNumero}
                onChange={(e) => setRuaNumero(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Bairro</label>
              <Input
                className="h-10 rounded-lg"
                placeholder="Ex: Centro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Cidade</label>
              <Input
                className="h-10 rounded-lg"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 block">Limite de Crédito (R$)</label>
              <InputNumber
                className="w-full h-10 rounded-lg"
                min={0}
                value={limiteCredito}
                onChange={(v) => setLimiteCredito(v || 0)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Drawer: Detalhes, Vendas, Pagamentos e Preços Específicos */}
      <Drawer
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800">
            <Users className="w-5 h-5 text-orange-500" />
            {selectedClient?.nome || 'Detalhes do Cliente'}
          </div>
        }
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={680}
      >
        {loadingHistory ? (
          <div className="flex justify-center items-center h-64">
            <Text type="secondary">Carregando histórico...</Text>
          </div>
        ) : clientHistory ? (
          <div className="space-y-6">
            {/* Balanço Rápido do Cliente */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Total Comprado</span>
                <span className="text-lg font-bold text-slate-800">
                  {formatCurrency(clientHistory.total_vendas || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Total Pago</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(clientHistory.total_pago || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Débito Atual</span>
                <span className={`text-lg font-bold ${clientHistory.saldo_devedor > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatCurrency(clientHistory.saldo_devedor || 0)}
                </span>
              </div>
            </div>

            {/* Abas com Vendas, Pagamentos e Preços Customizados */}
            <Tabs
              defaultActiveKey="vendas"
              items={[
                {
                  key: 'vendas',
                  label: `Vendas (${(clientHistory.vendas || []).length})`,
                  children: (
                    <Table
                      dataSource={clientHistory.vendas || []}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                      columns={[
                        {
                          title: 'Data',
                          key: 'data',
                          render: (_: any, r: any) => <span>{formatDate(r.created_at)}</span>,
                        },
                        {
                          title: 'Itens',
                          key: 'itens',
                          render: (_: any, r: any) => {
                            const items = r.itens_venda || [];
                            return (
                              <div className="text-xs">
                                {items.map((it: any, idx: number) => (
                                  <div key={idx}>
                                    {it.quantidade}x {it.produtos?.nome || 'Gás'}
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
                            <span className="font-semibold">{formatCurrency(v)}</span>
                          ),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'pagamentos',
                  label: `Pagamentos (${(clientHistory.pagamentos || []).length})`,
                  children: (
                    <Table
                      dataSource={clientHistory.pagamentos || []}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                      columns={[
                        {
                          title: 'Data',
                          key: 'data',
                          render: (_: any, r: any) => <span>{formatDate(r.created_at)}</span>,
                        },
                        {
                          title: 'Forma',
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
                      ]}
                    />
                  ),
                },
                {
                  key: 'precos',
                  label: `Preços Específicos (${(clientHistory.precos_especificos || []).length})`,
                  children: (
                    <div className="space-y-4 pt-1">
                      {/* Formulário de Adicionar Preço Diferenciado */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <div className="text-xs font-semibold text-slate-700 uppercase">
                          Cadastrar Preço Especial para este Cliente
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Select
                            className="w-full"
                            placeholder="Selecione o produto"
                            value={novoPrecoProduto || undefined}
                            onChange={setNovoPrecoProduto}
                            options={produtos.map((p) => ({
                              value: p.id,
                              label: `${p.nome} (Padrão: ${formatCurrency(p.valor_padrao)})`,
                            }))}
                          />
                          <InputNumber
                            className="w-full"
                            placeholder="Valor Especial (R$)"
                            min={0}
                            step={0.5}
                            value={novoPrecoValor}
                            onChange={(v) => setNovoPrecoValor(v)}
                          />
                          <Button
                            type="primary"
                            className="bg-orange-500 hover:bg-orange-600 border-none"
                            onClick={handleSaveValorCliente}
                            loading={savingPreco}
                          >
                            Salvar Preço
                          </Button>
                        </div>
                      </div>

                      <Table
                        dataSource={clientHistory.precos_especificos || []}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          {
                            title: 'Produto',
                            key: 'prod',
                            render: (_: any, r: any) => (
                              <span>{r.produtos?.nome || 'Produto'}</span>
                            ),
                          },
                          {
                            title: 'Preço Padrão',
                            key: 'padrao',
                            render: (_: any, r: any) => (
                              <span className="text-slate-400">
                                {formatCurrency(r.produtos?.valor_padrao || 0)}
                              </span>
                            ),
                          },
                          {
                            title: 'Preço Específico',
                            dataIndex: 'valor_especifico',
                            key: 'especifico',
                            render: (v: number) => (
                              <Tag color="green" className="font-bold text-sm">
                                {formatCurrency(v)}
                              </Tag>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
