import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Popconfirm,
  message,
  Card,
  Tooltip,
} from 'antd';
import {
  PlusCircle,
  Settings2,
  Shield,
  User as UserIcon,
  Search,
  Lock,
  Trash2,
  Edit2,
  Briefcase,
  Users,
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuth';

const { Title, Text } = Typography;

export interface SystemUser {
  id: string;
  nome: string;
  name: string;
  email: string;
  login: string;
  username: string;
  role: 'ADMIN' | 'COLABORADOR' | 'VENDEDOR';
  cpf?: string;
  telefone?: string;
  ativo: boolean;
  created_at?: string;
}

type ModalMode = 'create' | 'edit';

export function SystemSettings() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(res.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error?.response?.status === 403) {
        message.error('Acesso negado: apenas administradores podem ver as definições.');
      } else {
        message.error(error?.response?.data?.error || 'Erro ao carregar usuários.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const term = searchText.toLowerCase();
    return users.filter(
      (u) =>
        (u.nome || u.name || '').toLowerCase().includes(term) ||
        (u.login || u.username || u.email || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term)
    );
  }, [users, searchText]);

  const openCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'COLABORADOR' });
    setModalOpen(true);
  };

  const openEdit = (user: SystemUser) => {
    setModalMode('edit');
    setEditingUser(user);
    form.resetFields();
    form.setFieldsValue({
      name: user.nome || user.name,
      username: user.login || user.username || (user.email?.split('@')[0] ?? ''),
      role: user.role,
      telefone: user.telefone,
      cpf: user.cpf,
      senha: '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (user: SystemUser) => {
    if (currentUser && currentUser.id === user.id) {
      message.warning('Você não pode excluir sua própria conta logada.');
      return;
    }

    try {
      await api.delete(`/users/${user.id}/`);
      message.success(`Usuário ${user.nome || user.name} removido com sucesso.`);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error || 'Erro ao excluir usuário.');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const cleanLogin = (values.username || '').trim().toLowerCase();
      const cleanName = (values.name || '').trim();

      if (modalMode === 'create') {
        const payload = {
          nome: cleanName,
          username: cleanLogin,
          login: cleanLogin,
          role: values.role,
          senha: values.senha,
          telefone: values.telefone || null,
          cpf: values.cpf || null,
        };

        await api.post('/users/', payload);
        message.success('Novo usuário criado com sucesso!');
      } else if (editingUser) {
        const payload: Record<string, unknown> = {
          nome: cleanName,
          username: cleanLogin,
          login: cleanLogin,
          role: values.role,
          telefone: values.telefone || null,
          cpf: values.cpf || null,
        };

        if (values.senha) {
          payload.senha = values.senha;
        }

        await api.patch(`/users/${editingUser.id}/`, payload);
        message.success('Cadastro do usuário atualizado com sucesso!');
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error || 'Erro ao salvar informações do usuário.');
    } finally {
      setSaving(false);
    }
  };

  const renderRoleTag = (role: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') {
      return (
        <Tag
          icon={<Shield className="inline w-3 h-3 mr-1" />}
          color="orange"
          className="font-semibold px-2.5 py-0.5 rounded-full"
        >
          Administrador
        </Tag>
      );
    }
    if (r === 'VENDEDOR') {
      return (
        <Tag
          icon={<Briefcase className="inline w-3 h-3 mr-1" />}
          color="green"
          className="font-semibold px-2.5 py-0.5 rounded-full"
        >
          Vendedor
        </Tag>
      );
    }
    return (
      <Tag
        icon={<UserIcon className="inline w-3 h-3 mr-1" />}
        color="blue"
        className="font-semibold px-2.5 py-0.5 rounded-full"
      >
        Colaborador
      </Tag>
    );
  };

  const columns: ColumnsType<SystemUser> = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (_: unknown, record: SystemUser) => {
        const displayName = record.nome || record.name || 'Sem nome';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                {displayName}
                {currentUser?.id === record.id && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    Você
                  </span>
                )}
              </div>
              {record.telefone && (
                <div className="text-xs text-slate-400">{record.telefone}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Usuário (Login)',
      dataIndex: 'login',
      key: 'login',
      render: (_: unknown, record: SystemUser) => {
        const displayLogin = record.login || record.username || (record.email?.split('@')[0] ?? '');
        return (
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            @{displayLogin}
          </span>
        );
      },
    },
    {
      title: 'Perfil',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => renderRoleTag(role),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo: boolean) =>
        ativo !== false ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            Inativo
          </span>
        ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_: unknown, record: SystemUser) => {
        const isSelf = currentUser?.id === record.id;
        return (
          <Space>
            <Tooltip title="Editar dados e perfil">
              <Button
                size="small"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => openEdit(record)}
                className="rounded-lg text-slate-600 hover:text-orange-600"
              />
            </Tooltip>

            {isSelf ? (
              <Tooltip title="Você não pode excluir sua própria conta logada">
                <Button
                  size="small"
                  disabled
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="rounded-lg opacity-40"
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Desativar este usuário?"
                description={`Tem certeza que deseja desativar o acesso de ${record.nome || record.name}?`}
                onConfirm={() => handleDelete(record)}
                okText="Sim, desativar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Excluir/Desativar usuário">
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    className="rounded-lg"
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
            <Settings2 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <Title level={3} className="!m-0 !text-slate-800">
              Definições do Sistema
            </Title>
            <Text className="text-slate-500 text-sm">
              Gestão de usuários, perfis de acesso e credenciais
            </Text>
          </div>
        </div>

        <Button
          id="btn-novo-usuario"
          type="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={openCreate}
          size="large"
          className="rounded-xl h-11 px-5 flex items-center gap-2 font-medium shadow-sm"
        >
          Novo Usuário
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold m-0">Total</p>
              <p className="text-2xl font-bold text-slate-800 m-0 mt-1">{users.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-500 uppercase tracking-wider font-semibold m-0">Admins</p>
              <p className="text-2xl font-bold text-orange-600 m-0 mt-1">
                {users.filter((u) => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 uppercase tracking-wider font-semibold m-0">Colaboradores</p>
              <p className="text-2xl font-bold text-blue-600 m-0 mt-1">
                {users.filter((u) => u.role === 'COLABORADOR').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-500 uppercase tracking-wider font-semibold m-0">Vendedores</p>
              <p className="text-2xl font-bold text-emerald-600 m-0 mt-1">
                {users.filter((u) => u.role === 'VENDEDOR').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Busca e Tabela */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden" styles={{ body: { padding: '20px' } }}>
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Input
            placeholder="Pesquisar por nome, usuário ou perfil..."
            prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:max-w-md rounded-xl h-10"
            allowClear
          />
          <Text className="text-xs text-slate-400">
            Exibindo {filteredUsers.length} de {users.length} usuários
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'Nenhum usuário encontrado.' }}
        />
      </Card>

      {/* Modal Criar / Editar Usuário */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg">
            {modalMode === 'create' ? (
              <>
                <PlusCircle className="w-5 h-5 text-orange-500" />
                <span>Novo Usuário</span>
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5 text-orange-500" />
                <span>Editar Usuário: {editingUser?.nome || editingUser?.name}</span>
              </>
            )}
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={modalMode === 'create' ? 'Cadastrar Usuário' : 'Salvar Alterações'}
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnHidden
        className="rounded-2xl"
        width={540}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="font-medium text-slate-700">Nome Completo</span>}
            rules={[{ required: true, message: 'Por favor, insira o nome completo.' }]}
          >
            <Input size="large" placeholder="Ex: Carlos de Souza" className="rounded-xl h-11" />
          </Form.Item>

          <Form.Item
            name="username"
            label={
              <span className="font-medium text-slate-700">
                Nome de Usuário (Login)
              </span>
            }
            rules={[
              { required: true, message: 'Por favor, insira o nome de usuário para login.' },
              {
                pattern: /^[a-zA-Z0-9_.-]{3,50}$/,
                message: 'Apenas letras, números, ponto, hífen ou sublinhado (mínimo 3 caracteres).',
              },
            ]}
            extra="Alfanumérico case-insensitive (não precisa ser e-mail)."
          >
            <Input
              size="large"
              prefix={<span className="text-slate-400 font-medium font-mono">@</span>}
              placeholder="Ex: carlossouza"
              className="rounded-xl h-11 font-mono"
              autoCapitalize="none"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span className="font-medium text-slate-700">Perfil de Acesso (Role)</span>}
            rules={[{ required: true, message: 'Selecione o perfil de acesso.' }]}
          >
            <Select
              size="large"
              className="rounded-xl"
              options={[
                {
                  value: 'ADMIN',
                  label: (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-500" />
                      <span>Administrador — Acesso irrestrito a todas as funções</span>
                    </div>
                  ),
                },
                {
                  value: 'COLABORADOR',
                  label: (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-blue-500" />
                      <span>Colaborador — Operações de rotina (Estoque e Planilha)</span>
                    </div>
                  ),
                },
                {
                  value: 'VENDEDOR',
                  label: (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                      <span>Vendedor — Lançamento de vendas e atendimento a clientes</span>
                    </div>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="senha"
            label={
              <span className="font-medium text-slate-700">
                {modalMode === 'create' ? 'Senha de Acesso' : 'Redefinir Senha (Opcional)'}
              </span>
            }
            rules={[
              {
                required: modalMode === 'create',
                message: 'Por favor, defina a senha para este usuário.',
              },
              {
                min: 4,
                message: 'A senha deve ter no mínimo 4 caracteres.',
              },
            ]}
            extra={
              modalMode === 'edit'
                ? 'Deixe em branco caso não queira alterar a senha do usuário.'
                : undefined
            }
          >
            <Input.Password
              size="large"
              prefix={<Lock className="w-4 h-4 text-slate-400 mr-1" />}
              placeholder={modalMode === 'create' ? 'Defina a senha inicial' : 'Nova senha (opcional)'}
              className="rounded-xl h-11"
            />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="telefone"
              label={<span className="font-medium text-slate-700">Telefone (Opcional)</span>}
            >
              <Input size="large" placeholder="(32) 99999-9999" className="rounded-xl h-11" />
            </Form.Item>

            <Form.Item
              name="cpf"
              label={<span className="font-medium text-slate-700">CPF (Opcional)</span>}
            >
              <Input size="large" placeholder="000.000.000-00" className="rounded-xl h-11" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
