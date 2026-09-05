import { useState, useEffect } from 'react';
import { Card, Select, InputNumber, Input, Button, Table, message, Tag, Typography, Popconfirm, Space } from 'antd';
import { Truck, Plus, PackageCheck, AlertCircle, Trash2, Layers } from 'lucide-react';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuth';

const { Title, Text } = Typography;

interface Product {
  id: string;
  nome: string;
  categoria?: string;
  valor_padrao: number;
}

interface EntradaItem {
  id: string;
  id_produto: string;
  produto_nome?: string;
  categoria?: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  placa_caminhao?: string;
  lote_nf?: string;
  created_at: string;
}

export function Entrada() {
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<EntradaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Formulário de Entrada
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [placaCaminhao, setPlacaCaminhao] = useState<string>('');
  const [loteNf, setLoteNf] = useState<string>('');

  const isAdmin = useAuthStore((state) => state.isAdmin);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsRes, entriesRes] = await Promise.all([
        api.get('/produtos/'),
        api.get('/entradas/'),
      ]);
      setProducts(prodsRes.data || []);
      setEntries(entriesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados de entrada:', error);
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEntrada = async () => {
    if (!selectedProduct) {
      message.warning('Selecione um produto.');
      return;
    }
    if (!quantidade || quantidade <= 0) {
      message.warning('Informe uma quantidade válida.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/entradas/', {
        id_produto: selectedProduct,
        quantidade_inicial: quantidade,
        placa_caminhao: placaCaminhao ? placaCaminhao.toUpperCase().trim() : null,
        lote_nf: loteNf ? loteNf.trim() : null,
      });

      message.success('Entrada de mercadoria registrada com sucesso!');
      // Limpa formulário
      setSelectedProduct('');
      setQuantidade(null);
      setPlacaCaminhao('');
      setLoteNf('');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao registrar entrada:', error);
      message.error(error.response?.data?.error || 'Erro ao registrar entrada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntrada = async (id: string) => {
    try {
      await api.delete(`/entradas/${id}/`);
      message.success('Entrada cancelada com sucesso.');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao excluir entrada:', error);
      message.error(error.response?.data?.error || 'Erro ao excluir.');
    }
  };

  const columns = [
    {
      title: 'Data / Hora',
      key: 'created_at',
      width: 160,
      render: (_: any, record: EntradaItem) => (
        <div>
          <span className="font-semibold text-slate-800">{formatDate(record.created_at)}</span>
          <div className="text-xs text-slate-400">
            {(record.created_at || '').slice(11, 16)}
          </div>
        </div>
      ),
    },
    {
      title: 'Produto',
      key: 'produto',
      render: (_: any, record: EntradaItem) => (
        <div>
          <span className="font-medium text-slate-800">{record.produto_nome || 'Produto'}</span>
          {record.categoria && (
            <div className="text-xs text-slate-400">Cat: {record.categoria}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Placa Caminhão',
      dataIndex: 'placa_caminhao',
      key: 'placa_caminhao',
      render: (placa: string) => (
        <span className="font-mono text-sm">{placa || '-'}</span>
      ),
    },
    {
      title: 'Lote / NF',
      dataIndex: 'lote_nf',
      key: 'lote_nf',
      render: (lote: string) => (
        <span className="text-slate-600">{lote || '-'}</span>
      ),
    },
    {
      title: 'Qtd Inicial',
      dataIndex: 'quantidade_inicial',
      key: 'quantidade_inicial',
      align: 'center' as const,
      render: (qty: number) => <span className="font-semibold">{qty} un</span>,
    },
    {
      title: 'Saldo Atual',
      key: 'quantidade_atual',
      align: 'center' as const,
      render: (_: any, record: EntradaItem) => {
        const saldo = record.quantidade_atual;
        if (saldo === 0) {
          return <Tag color="default">Esgotado</Tag>;
        }
        return (
          <Tag color="green" className="font-bold text-sm">
            {saldo} un
          </Tag>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            title: 'Ações',
            key: 'actions',
            align: 'center' as const,
            render: (_: any, record: EntradaItem) => (
              <Popconfirm
                title="Cancelar entrada"
                description="Tem certeza que deseja cancelar esta entrada de estoque?"
                onConfirm={() => handleDeleteEntrada(record.id)}
                okText="Sim"
                cancelText="Não"
              >
                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} title="Excluir" />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
          <Truck className="w-6 h-6 text-orange-500" />
          Registro de Entradas de Estoque
        </h2>
        <p className="text-slate-500 mt-1 mb-0">
          Cadastre novos lotes e cargas de botijões que entram no estoque da distribuidora.
        </p>
      </div>

      {/* Formulário de Nova Entrada */}
      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: '24px' } }}>
        <div className="flex items-center gap-2 mb-4 font-semibold text-slate-700 text-base">
          <Plus className="w-5 h-5 text-orange-500" />
          Nova Entrada de Mercadoria
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Produto *</label>
            <Select
              className="w-full h-11"
              placeholder="Selecione o produto"
              value={selectedProduct || undefined}
              onChange={setSelectedProduct}
              options={products.map((p) => ({
                value: p.id,
                label: p.nome,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Quantidade (unidades) *</label>
            <InputNumber
              className="w-full h-11"
              placeholder="Ex: 50"
              min={1}
              value={quantidade}
              onChange={(val) => setQuantidade(val)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Placa do Caminhão</label>
            <Input
              className="w-full h-11 uppercase"
              placeholder="Ex: ABC-1234"
              value={placaCaminhao}
              onChange={(e) => setPlacaCaminhao(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">Lote / Nota Fiscal</label>
            <Input
              className="w-full h-11"
              placeholder="Ex: NF 10423 / Lote 09"
              value={loteNf}
              onChange={(e) => setLoteNf(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="primary"
            size="large"
            icon={<PackageCheck className="w-5 h-5" />}
            className="h-11 px-6 rounded-xl font-medium shadow-sm bg-orange-500 hover:bg-orange-600 border-none text-white"
            loading={submitting}
            onClick={handleCreateEntrada}
          >
            Registrar Entrada
          </Button>
        </div>
      </Card>

      {/* Tabela de Histórico de Entradas */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: '20px' } }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-lg">
            <Layers className="w-5 h-5 text-orange-500" />
            Histórico de Entradas
          </div>
          <div className="text-sm text-slate-500">
            {entries.length} registro(s) encontrado(s)
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 750 }}
          locale={{ emptyText: 'Nenhuma entrada registrada ainda.' }}
        />
      </Card>
    </div>
  );
}