import { useState, useEffect } from 'react';
import { Card, Input, Button, Select, Table, Tag, Modal, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Product, StockMovement } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Box, History, ArrowDownToLine, ArrowUpFromLine, Settings2, Search } from 'lucide-react';
import { api } from '@/services/api';

const { Text, Title } = Typography;

export function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Adjustment Form
  const [adjType, setAdjType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      message.error('Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await api.get('/stock/movements');
      setMovements(res.data);
    } catch (error) {
      console.error(error);
      message.error('Erro ao buscar movimentações');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const openAdjustment = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjType('ENTRADA');
    setAdjQuantity('');
    setAdjNotes('');
    setIsAdjustmentOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedProduct || !adjQuantity) return;
    
    let diff = Number(adjQuantity);
    if (adjType === 'SAIDA' || (adjType === 'AJUSTE' && diff < 0)) {
        diff = -Math.abs(diff);
    } else {
        diff = Math.abs(diff);
    }
    
    const payload = {
      product_id: selectedProduct.id,
      movement_type: adjType,
      quantity: diff,
      notes: adjNotes
    };

    try {
      await api.post(`/products/${selectedProduct.id}/movements`, payload);
      message.success('Movimentação registrada com sucesso!');
      setIsAdjustmentOpen(false);
      fetchProducts();
      fetchMovements();
    } catch (error) {
      console.error(error);
      message.error('Erro ao registrar movimentação');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const columns: ColumnsType<Product> = [
    {
      title: 'Produto',
      key: 'name',
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-800 m-0">{record.name}</p>
          <p className="text-xs text-slate-500 m-0 mt-1">Atualizado em {formatDate(record.updated_at || new Date().toISOString())}</p>
        </div>
      )
    },
    {
      title: 'Preço Atual',
      key: 'price',
      render: (_, record) => (
        <span className="font-medium text-slate-800">{formatCurrency(record.current_price)}</span>
      )
    },
    {
      title: 'Saldo em Estoque',
      key: 'stock',
      render: (_, record) => (
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold ${record.stock_quantity < 10 ? 'text-orange-600' : 'text-slate-800'}`}>
              {record.stock_quantity}
          </span>
          <span className="text-xs text-slate-500">und</span>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        record.active ? (
          <Tag color="success">Ativo</Tag>
        ) : (
          <Tag>Inativo</Tag>
        )
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button 
          type="default" 
          size="middle" 
          onClick={() => openAdjustment(record)} 
          className="rounded-lg text-slate-600 hover:text-orange-500 hover:border-orange-500 flex items-center justify-center transition-colors shadow-none float-right"
          icon={<Settings2 className="w-4 h-4 ml-0.5" />}
        >
          Ajustar
        </Button>
      )
    }
  ];

  const historyColumns: ColumnsType<StockMovement> = [
    {
      title: 'Data',
      key: 'date',
      render: (_, record) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">
          {formatDate(record.created_at)}
        </span>
      )
    },
    {
      title: 'Tipo',
      key: 'type',
      render: (_, record) => {
        if (record.movement_type === 'ENTRADA') return <Tag color="success" icon={<ArrowDownToLine className="w-3 h-3 inline -mt-0.5" />}>Entrada</Tag>;
        if (record.movement_type === 'SAIDA') return <Tag color="warning" icon={<ArrowUpFromLine className="w-3 h-3 inline -mt-0.5" />}>Saída</Tag>;
        return <Tag color="default">Ajuste</Tag>;
      }
    },
    {
      title: 'Qtd',
      key: 'qty',
      align: 'right',
      render: (_, record) => (
        <span className="font-medium text-slate-800 text-sm">
          {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
        </span>
      )
    },
    {
      title: 'Obs',
      key: 'notes',
      render: (_, record) => {
        const p = products.find(prod => prod.id === record.product_id);
        return (
          <div className="text-sm text-slate-500">
            <div className="font-medium text-slate-700 text-xs mb-0.5">{p?.name || record.product_id}</div>
            {record.notes}
          </div>
        )
      }
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
             <Box className="w-6 h-6 text-orange-500" />
             Controle de Estoque
          </h2>
          <p className="text-slate-500 mt-1 mb-0">Gerencie saldos, produtos ativos e visualize o histórico de movimentações.</p>
        </div>
        
        <Button 
          type="default"
          size="middle"
          onClick={() => setIsHistoryOpen(true)} 
          className="rounded-lg h-10 px-4 shadow-sm text-base font-medium flex items-center bg-white"
          icon={<History className="w-5 h-5 ml-1" />}
        >
          Histórico Global
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl p-2" styles={{ body: { padding: '16px' } }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-slate-600 block">Buscar Produto</label>
            <Input
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Nome do produto"
              className="rounded-lg h-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="w-full"
        />
      </Card>

      {/* Adjustment Dialog */}
      <Modal 
        open={isAdjustmentOpen} 
        onCancel={() => setIsAdjustmentOpen(false)}
        title={
          <div>
            <div className="text-xl">Ajuste Manual de Estoque</div>
            <div className="text-sm font-normal text-white opacity-80 mt-1">Lançamento para o produto: <strong>{selectedProduct?.name}</strong></div>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={() => setIsAdjustmentOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSaveAdjustment} 
            disabled={!adjQuantity || isNaN(Number(adjQuantity))} 
            className="rounded-full h-10 px-6 font-medium"
          >
            Confirmar Ajuste
          </Button>
        ]}
        width={450}
        centered
      >
        <div className="grid gap-6 py-4 mt-2 mb-2">
          <div className="space-y-1.5">
            <label className="text-slate-800 block font-medium">Tipo de Movimentação</label>
            <Select 
              value={adjType} 
              onChange={setAdjType}
              className="w-full h-10"
              options={[
                { value: 'ENTRADA', label: 'Entrada (+)' },
                { value: 'SAIDA', label: 'Saída (-)' },
                { value: 'AJUSTE', label: 'Ajuste (+ ou -)' }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-800 block font-medium">Quantidade</label>
            <Input 
               type="number"
               placeholder="Ex: 5"
               className="h-10 rounded-lg border-slate-300"
               value={adjQuantity} 
               onChange={e => setAdjQuantity(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-slate-800 block font-medium">Observações (Opcional)</label>
            <Input 
               placeholder="Motivo do ajuste..."
               className="h-10 rounded-lg border-slate-300"
               value={adjNotes} 
               onChange={e => setAdjNotes(e.target.value)} 
            />
          </div>
        </div>
      </Modal>

      {/* History Dialog */}
      <Modal 
        open={isHistoryOpen} 
        onCancel={() => setIsHistoryOpen(false)}
        title={<div className="text-xl">Histórico Recente de Movimentações</div>}
        footer={null}
        width={700}
        centered
        styles={{ body: { padding: 0 } }}
        className="overflow-hidden"
      >
        <div className="max-h-[60vh] overflow-y-auto w-full pt-4">
          <Table
            columns={historyColumns}
            dataSource={movements}
            rowKey="id"
            pagination={false}
            className="w-full font-sans"
            size="middle"
          />
        </div>
      </Modal>
    </div>
  );
}
