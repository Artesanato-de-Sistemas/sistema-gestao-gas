import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Tag,
  Divider,
} from 'antd';
import {
  User as UserIcon,
  Shield,
  Lock,
  CheckCircle2,
  KeyRound,
  IdCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export function MyProfile() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loginState = useAuthStore((state) => state.login);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Carrega os dados mais recentes do endpoint /api/users/me/
  useEffect(() => {
    async function loadProfile() {
      setFetching(true);
      try {
        const res = await api.get('/users/me/');
        const data = res.data;
        form.setFieldsValue({
          name: data.name || data.nome || '',
          username: data.login || data.username || (data.email?.split('@')[0] ?? ''),
        });
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
        // Fallback para os dados já guardados no store
        if (user) {
          form.setFieldsValue({
            name: user.name || '',
            username: user.username || user.login || (user.email?.split('@')[0] ?? ''),
          });
        }
      } finally {
        setFetching(false);
      }
    }

    loadProfile();
  }, [form, user]);

  const onFinish = async (values: {
    name: string;
    username: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => {
    const cleanUsername = values.username.trim().toLowerCase();
    const cleanName = values.name.trim();

    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      message.error('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        nome: cleanName,
        username: cleanUsername,
      };

      if (values.newPassword) {
        payload.senha = values.newPassword;
      }

      const res = await api.patch('/users/me/', payload);
      const updated = res.data;

      // Atualiza o estado global de autenticação
      if (user && token) {
        loginState(
          {
            ...user,
            name: updated.name || cleanName,
            username: updated.login || cleanUsername,
            login: updated.login || cleanUsername,
            email: updated.email || cleanUsername,
            role: updated.role || user.role,
          },
          token
        );
      }

      message.success('Seus dados foram atualizados com sucesso!');
      form.setFieldsValue({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        'Erro ao atualizar seus dados.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roleUpper = (user?.role || '').toUpperCase();
  const roleLabel =
    roleUpper === 'ADMIN'
      ? 'Administrador'
      : roleUpper === 'VENDEDOR'
      ? 'Vendedor'
      : 'Colaborador';

  const roleColor =
    roleUpper === 'ADMIN' ? 'orange' : roleUpper === 'VENDEDOR' ? 'green' : 'blue';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
          <KeyRound className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <Title level={3} className="!m-0 !text-slate-800">
            Meus Dados
          </Title>
          <Text className="text-slate-500 text-sm">
            Gerencie seu nome, login de acesso e senha de segurança
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Resumo do Usuário */}
        <Card className="rounded-2xl border-slate-100 shadow-sm md:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center mb-3">
              <UserIcon className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 m-0">
              {user?.name || 'Usuário'}
            </h3>
            <p className="text-sm text-slate-400 m-0 mb-3">
              @{user?.username || user?.login || (user?.email?.split('@')[0] ?? 'usuario')}
            </p>

            <Tag
              color={roleColor}
              className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5"
            >
              <Shield className="w-3 h-3" />
              {roleLabel}
            </Tag>

            <Divider className="my-4" />

            <div className="w-full text-left space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Identificador:</span>
                <span className="font-mono text-slate-700 font-semibold truncate max-w-[120px]">
                  {user?.id?.substring(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nível de Acesso:</span>
                <span className="text-slate-700 font-medium">{roleLabel}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card Formulário de Edição */}
        <Card className="rounded-2xl border-slate-100 shadow-sm md:col-span-2">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            disabled={fetching}
            requiredMark={false}
          >
            <div className="mb-4 flex items-center gap-2 text-slate-700 font-semibold text-base">
              <IdCard className="w-5 h-5 text-orange-500" />
              <span>Informações de Acesso</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label={<span className="font-medium text-slate-700">Nome Completo</span>}
                rules={[{ required: true, message: 'Por favor, informe seu nome completo.' }]}
              >
                <Input
                  size="large"
                  placeholder="Ex: João da Silva"
                  className="rounded-xl h-11"
                />
              </Form.Item>

              <Form.Item
                name="username"
                label={
                  <span className="font-medium text-slate-700">
                    Nome de Usuário (Login)
                  </span>
                }
                rules={[
                  { required: true, message: 'Por favor, informe o nome de usuário.' },
                  {
                    pattern: /^[a-zA-Z0-9_.-]{3,50}$/,
                    message: 'Apenas letras, números, ponto, hífen ou sublinhado (mín. 3 caracteres).',
                  },
                ]}
                extra="Não diferencia maiúsculas de minúsculas e não precisa ser e-mail."
              >
                <Input
                  size="large"
                  prefix={<span className="text-slate-400 font-medium">@</span>}
                  placeholder="Ex: joaosilva"
                  className="rounded-xl h-11 font-mono"
                  autoCapitalize="none"
                />
              </Form.Item>
            </div>

            <Divider className="my-6" />

            <div className="mb-4 flex items-center gap-2 text-slate-700 font-semibold text-base">
              <Lock className="w-5 h-5 text-orange-500" />
              <span>Alteração de Senha</span>
              <span className="text-xs font-normal text-slate-400">(Opcional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="newPassword"
                label={<span className="font-medium text-slate-700">Nova Senha</span>}
                rules={[
                  {
                    min: 4,
                    message: 'A senha deve ter no mínimo 4 caracteres.',
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Deixe em branco para não alterar"
                  className="rounded-xl h-11"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span className="font-medium text-slate-700">Confirmar Nova Senha</span>}
                dependencies={['newPassword']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      if (!getFieldValue('newPassword') && !value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('As senhas não coincidem.'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Confirme a nova senha"
                  className="rounded-xl h-11"
                />
              </Form.Item>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="h-11 px-8 rounded-xl font-medium shadow-sm"
              >
                Salvar Alterações
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
