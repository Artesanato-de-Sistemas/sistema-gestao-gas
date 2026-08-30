import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Popconfirm, message,
} from 'antd';
import { PlusCircle, Settings2, Shield, User as UserIcon } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { api } from '@/services/api';

const { Title, Text } = Typography;

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
  created_at?: string;
}

type ModalMode = 'create' | 'edit';

export function SystemSettings() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 403) {
        message.error('Acesso negado: apenas administradores podem ver os usuários.');
      } else {
        message.error('Erro ao carregar usuários.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: SystemUser) => {
    setModalMode('edit');
    setEditingUser(user);
    form.setFieldsValue({ name: user.name, role: user.role });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (modalMode === 'create') {
        await api.post('/users/', values);
        message.success('Usuário criado com sucesso!');
      } else if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, { name: values.name, role: values.role });
        message.success('Usuário atualizado!');
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<SystemUser> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <UserIcon className="w-4 h-4 text-orange-500" />
          </div>
          <span className="font-medium text-slate-800">{name}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text className="text-slate-600">{email}</Text>,
    },
    {
      title: 'Perfil',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) =>
        role === 'ADMIN' ? (
          <Tag icon={<Shield className="inline w-3 h-3 mr-1" />} color="orange">
            Administrador
          </Tag>
        ) : (
          <Tag color="blue">Colaborador</Tag>
        ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: SystemUser) => (
        <Space>
          <Button
            size="small"
            onClick={() => openEdit(record)}
            className="rounded-lg"
          >
            Editar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <Title level={3} className="!m-0 !text-slate-800">Definições do Sistema</Title>
            <Text className="text-slate-500 text-sm">Gestão de usuários e perfis de acesso</Text>
          </div>
        </div>

        <Button
          id="btn-novo-usuario"
          type="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={openCreate}
          className="rounded-xl h-10 flex items-center gap-2"
        >
          Novo Usuário
        </Button>
      </div>

      {/* Stats badges */}
      <div className="flex gap-3">
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-2xl font-bold text-slate-800">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-orange-400 uppercase tracking-wide font-medium">Admins</p>
          <p className="text-2xl font-bold text-orange-500">
            {users.filter((u) => u.role === 'ADMIN').length}
          </p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-xs text-blue-400 uppercase tracking-wide font-medium">Colaboradores</p>
          <p className="text-2xl font-bold text-blue-500">
            {users.filter((u) => u.role === 'COLABORADOR').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className="rounded-2xl overflow-hidden"
          locale={{ emptyText: 'Nenhum usuário cadastrado.' }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-orange-500" />
            {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={modalMode === 'create' ? 'Criar' : 'Salvar'}
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          {modalMode === 'create' && (
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email é obrigatório.' },
                { type: 'email', message: 'Email inválido.' },
              ]}
            >
              <Input id="input-user-email" placeholder="usuario@empresa.com" size="large" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Nome é obrigatório.' }]}
          >
            <Input id="input-user-name" placeholder="Nome completo" size="large" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Perfil de Acesso"
            rules={[{ required: true, message: 'Perfil é obrigatório.' }]}
          >
            <Select
              id="select-user-role"
              size="large"
              placeholder="Selecione o perfil"
              options={[
                { value: 'ADMIN', label: '🛡️ Administrador — Acesso total' },
                { value: 'COLABORADOR', label: '👤 Colaborador — Acesso restrito' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
