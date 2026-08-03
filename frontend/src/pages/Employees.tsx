import { useState, useEffect } from "react";
import { Button, Card, Input, Select, Table, Tag, Modal, Space, Typography, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeliveryDriver } from "@/types";
import { Users, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { maskCPF, maskPhone } from "@/utils/masks";
import { api } from "@/services/api";

export function Employees() {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Registration Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState<number>(10);
  const [active, setActive] = useState(true);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (error) {
      console.error(error);
      message.error('Erro ao buscar entregadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenForm = (driver?: DeliveryDriver) => {
    if (driver) {
      setEditingId(driver.id);
      setName(driver.name);
      setDocument(driver.document || "");
      setPhone(driver.phone || "");
      setCommissionPercentage(driver.commission_percentage);
      setActive(driver.active);
    } else {
      setEditingId(null);
      setName("");
      setDocument("");
      setPhone("");
      setCommissionPercentage(10);
      setActive(true);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name || !document) {
       message.warning('Nome e CPF são obrigatórios');
       return;
    }

    const payload = {
      name,
      document,
      phone,
      commission_percentage: commissionPercentage,
      active
    };

    try {
      if (editingId) {
        await api.put(`/drivers/${editingId}`, payload);
        message.success('Entregador atualizado');
      } else {
        await api.post('/drivers', payload);
        message.success('Entregador cadastrado');
      }
      setIsOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error(error);
      message.error('Erro ao salvar entregador');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/drivers/${id}`);
      message.success('Entregador removido');
      fetchDrivers();
    } catch (error) {
      console.error(error);
      message.error('Erro ao remover entregador');
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.document && d.document.includes(search))
  );

  const columns: ColumnsType<DeliveryDriver> = [
    {
      title: 'Entregador',
      key: 'name',
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-800 m-0">{record.name}</p>
          <p className="text-xs text-slate-500 m-0">CPF: {record.document}</p>
        </div>
      )
    },
    {
      title: 'Comissão',
      key: 'commission',
      render: (_, record) => (
        <div className="font-medium text-slate-700">
          {record.commission_percentage}%
        </div>
      )
    },
    {
      title: 'Telefone',
      key: 'phone',
      render: (_, record) => (
        <div className="text-sm text-slate-700">{record.phone || "-"}</div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
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
        <Space>
          <Button type="text" icon={<Edit2 className="w-4 h-4 text-slate-400" />} onClick={() => handleOpenForm(record)} />
          {record.active && (
            <Popconfirm title="Tem certeza que deseja remover este entregador?" onConfirm={() => handleDelete(record.id)} okText="Sim" cancelText="Não">
              <Button type="text" icon={<Trash2 className="w-4 h-4 text-red-500" />} />
            </Popconfirm>
          )}
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
            Entregadores
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Cadastre e gerencie os entregadores e suas comissões.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenForm()}
          className="rounded-lg h-10 px-4 shadow-sm text-base font-medium flex items-center"
        >
          Novo Entregador
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100 p-2" styles={{ body: { padding: '16px' } }}>
        <div className="flex-1 space-y-2 max-w-md">
          <label className="text-slate-600 block">Buscar Entregador</label>
          <Input
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Nome ou CPF"
            className="rounded-lg h-10 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredDrivers}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="w-full"
        />
      </Card>

      <Modal
        title={editingId ? "Editar Entregador" : "Novo Entregador"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            disabled={!name || !document} 
            onClick={handleSave} 
            className="rounded-full h-10 px-6 font-medium"
          >
            {editingId ? "Salvar Edição" : "Cadastrar Entregador"}
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="grid gap-5 py-4 mt-2 mb-2">
          
          <div className="space-y-1.5 flex flex-col">
            <label className="text-slate-800 font-medium text-base">Nome Completo *</label>
            <Input
              placeholder="Nome do entregador"
              className="h-10 border-slate-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">CPF *</label>
              <Input
                placeholder="000.000.000-00"
                className="h-10 border-slate-300"
                value={document}
                onChange={(e) => setDocument(maskCPF(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">Telefone</label>
              <Input
                placeholder="(11) 90000-0000"
                className="h-10 border-slate-300"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">Comissão (%)</label>
              <Input
                type="number"
                placeholder="Ex: 10"
                className="h-10 border-slate-300"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">Status</label>
              <Select
                value={active}
                onChange={setActive}
                className="w-full h-10"
                options={[
                  { value: true, label: 'Ativo' },
                  { value: false, label: 'Inativo' }
                ]}
              />
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
