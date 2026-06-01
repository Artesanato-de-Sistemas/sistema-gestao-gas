import { useState } from 'react';
import { Button, Card, Input, Select, Table, Tag, Modal, Space, Typography, Popconfirm, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Client } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Users, Search, Plus, AlertCircle, Edit, Trash2 } from 'lucide-react';

const { Text, Title } = Typography;

const mockClients: Client[] = [
  {
    id: '1', person_id: 'p1', payment_deadline_days: 15, active: true, person_type: 'JURIDICA',
    name: 'Restaurante Sabor de Minas', document: '12.345.678/0001-90', phone: '(11) 99999-1234',
    trade_name: 'Sabor de Minas', created_at: '2023-01-10T10:00:00Z',
    isInadimplente: false, revenue: 15000, purchasesCount: 45
  },
  {
    id: '2', person_id: 'p2', payment_deadline_days: 0, active: true, person_type: 'FISICA',
    name: 'João Carlos Silva', document: '123.456.789-00', phone: '(11) 98888-5678',
    created_at: '2023-03-22T14:30:00Z',
    isInadimplente: true, revenue: 350, purchasesCount: 3
  },
  {
    id: '3', person_id: 'p3', payment_deadline_days: 30, active: true, person_type: 'JURIDICA',
    name: 'Padaria Pão Quente', document: '98.765.432/0001-10', phone: '(11) 97777-9012',
    trade_name: 'Pão Quente', created_at: '2023-05-15T08:15:00Z',
    isInadimplente: false, revenue: 32000, purchasesCount: 120
  },
];

export function Customers() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterInadimplente, setFilterInadimplente] = useState('TODOS');
  const [minRevenue, setMinRevenue] = useState('');
  const [minPurchases, setMinPurchases] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    person_type: 'FISICA', active: true, payment_deadline_days: 0
  });

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({ person_type: 'FISICA', active: true, payment_deadline_days: 0, name: '', document: '', phone: '', trade_name: '' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } as Client : c));
    } else {
      const newClient = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        person_id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        isInadimplente: false,
        revenue: 0,
        purchasesCount: 0
      } as Client;
      setClients([...clients, newClient]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.document.includes(search) || (c.trade_name && c.trade_name.toLowerCase().includes(search.toLowerCase()));
    const matchesInadimplente = filterInadimplente === 'TODOS' || (filterInadimplente === 'SIM' && c.isInadimplente) || (filterInadimplente === 'NAO' && !c.isInadimplente);
    const matchesRevenue = !minRevenue || ((c.revenue || 0) >= Number(minRevenue));
    const matchesPurchases = !minPurchases || ((c.purchasesCount || 0) >= Number(minPurchases));
    
    return matchesSearch && matchesInadimplente && matchesRevenue && matchesPurchases;
  });

  const columns: ColumnsType<Client> = [
    {
      title: 'Cliente / Contato',
      key: 'name',
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-800 m-0">{record.trade_name || record.name}</p>
          <p className="text-sm text-slate-500 m-0">{record.document} • {record.phone}</p>
        </div>
      )
    },
    {
      title: 'Tipo',
      key: 'type',
      render: (_, record) => (
        <div>
          <Tag color="default" className="rounded border-slate-200 text-slate-600 font-medium">
            {record.person_type}
          </Tag>
          <div className="mt-1 text-xs text-slate-400">Prazo: {record.payment_deadline_days} dias</div>
        </div>
      )
    },
    {
      title: 'Financeiro / Recorrência',
      key: 'financeInfo',
      render: (_, record) => (
        <div>
          <p className="font-medium text-slate-800 m-0">{formatCurrency(record.revenue || 0)}</p>
          <p className="text-xs text-slate-500 m-0">{record.purchasesCount} pedidos</p>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.active ? (
             <Tag color="success">Ativo</Tag>
          ) : (
             <Tag>Inativo</Tag>
          )}
          {record.isInadimplente && (
             <Tag color="error" icon={<AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}>
               Inadimplente
             </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<Edit className="w-4 h-4 text-slate-400" />} onClick={() => handleOpenEdit(record)} />
          <Popconfirm title="Tem certeza que deseja excluir este cliente?" onConfirm={() => handleDelete(record.id)} okText="Sim" cancelText="Não">
            <Button type="text" icon={<Trash2 className="w-4 h-4 text-red-500" />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
             <Users className="w-6 h-6 text-orange-500" />
             Base de Clientes
          </h2>
          <p className="text-slate-500 mt-1 mb-0">Gerencie os clientes, visualize faturamento e inadimplência.</p>
        </div>
        
        <Button 
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenNew} 
          className="rounded-lg h-10 px-4 shadow-sm text-base font-medium flex items-center"
        >
          Novo Cliente
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl p-2" styles={{ body: { padding: '16px' } }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-slate-600 block">Busca Rápida</label>
            <Input
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Nome, Fantasia ou Documento"
              className="rounded-lg h-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="w-full lg:w-48 space-y-2">
            <label className="text-slate-600 block">Inadimplentes</label>
            <Select 
               value={filterInadimplente} 
               onChange={setFilterInadimplente} 
               className="w-full h-10"
               options={[
                 { value: 'TODOS', label: 'Todos' },
                 { value: 'SIM', label: 'Sim' },
                 { value: 'NAO', label: 'Não' }
               ]}
            />
          </div>

          <div className="w-full lg:w-48 space-y-2">
            <label className="text-slate-600 block">Receita Mínima (R$)</label>
            <Input
              type="number"
              placeholder="Ex: 5000"
              className="rounded-lg h-10 border-slate-200"
              value={minRevenue}
              onChange={(e) => setMinRevenue(e.target.value)}
            />
          </div>

          <div className="w-full lg:w-48 space-y-2">
            <label className="text-slate-600 block">Recorrência Mín. (Qtd)</label>
            <Input
              type="number"
              placeholder="Ex: 10"
              className="rounded-lg h-10 border-slate-200"
              value={minPurchases}
              onChange={(e) => setMinPurchases(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredClients}
          rowKey="id"
          pagination={false}
          className="w-full"
        />
      </Card>

      <Modal 
        open={isDialogOpen} 
        onCancel={() => setIsDialogOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        footer={[
          <Button key="cancel" onClick={() => setIsDialogOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button key="submit" type="primary" onClick={handleSave} className="rounded-full h-10 px-6 font-medium">
            Salvar
          </Button>
        ]}
        width={600}
        centered
      >
        <div className="grid gap-6 py-4 mt-2 mb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-600 block font-medium">Tipo de Pessoa</label>
              <Select 
                 value={formData.person_type} 
                 onChange={(val: 'FISICA'|'JURIDICA') => setFormData({...formData, person_type: val})}
                 className="w-full h-10"
                 options={[
                   { value: 'FISICA', label: 'Física' },
                   { value: 'JURIDICA', label: 'Jurídica' }
                 ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-600 block font-medium">Documento (CPF/CNPJ)</label>
              <Input 
                className="h-10 border-slate-300"
                value={formData.document || ''} 
                onChange={e => setFormData({...formData, document: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-600 block font-medium">Nome / Razão Social</label>
            <Input 
               className="h-10 border-slate-300"
               value={formData.name || ''} 
               onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          {formData.person_type === 'JURIDICA' && (
            <div className="space-y-2">
              <label className="text-slate-600 block font-medium">Nome Fantasia</label>
              <Input 
                 className="h-10 border-slate-300"
                 value={formData.trade_name || ''} 
                 onChange={e => setFormData({...formData, trade_name: e.target.value})} 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-600 block font-medium">Telefone</label>
              <Input 
                 className="h-10 border-slate-300"
                 value={formData.phone || ''} 
                 onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-600 block font-medium">Prazo de Pagamento (Dias)</label>
              <Input 
                 type="number"
                 className="h-10 border-slate-300"
                 value={formData.payment_deadline_days || 0} 
                 onChange={e => setFormData({...formData, payment_deadline_days: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-600 block font-medium">Status</label>
            <Select 
              value={formData.active} 
              onChange={(val) => setFormData({...formData, active: val})}
              className="w-full h-10"
              options={[
                { value: true, label: 'Ativo' },
                { value: false, label: 'Inativo' }
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
