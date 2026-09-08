import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, User as UserIcon, Lock } from 'lucide-react';
import { Button, Input, Card, Typography, message } from 'antd';
import { useAuthStore } from '@/store/useAuth';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      message.warning('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login/', {
        email: cleanUsername,
        username: cleanUsername,
        password,
      });
      const apiUser = res.data.user || {};
      const displayLogin = apiUser.username || apiUser.login || cleanUsername;
      login(
        {
          id: apiUser.id || '1',
          name: apiUser.name || displayLogin,
          email: apiUser.email || cleanUsername,
          username: displayLogin,
          login: displayLogin,
          role: apiUser.role || 'COLABORADOR',
        },
        res.data.access_token
      );
      message.success(`Bem-vindo, ${apiUser.name || displayLogin}!`);
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; error?: string } } };
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Erro ao fazer login. Verifique o usuário e a senha.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex items-center gap-3 text-orange-500">
        <Flame className="w-10 h-10" />
        <h1 className="text-3xl font-bold m-0 text-slate-800">Império do Gás</h1>
      </div>

      <Card
        className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <div className="h-1.5 w-full bg-orange-500" />

        <div className="p-8">
          <div className="text-center mb-8">
            <Title level={3} className="m-0 mb-2">Acesso ao Sistema</Title>
            <Text className="text-slate-500">Insira suas credenciais para acessar o painel</Text>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-slate-700 font-medium block">
                Usuário
              </label>
              <Input
                id="username"
                size="large"
                prefix={<UserIcon className="w-4 h-4 text-slate-400 mr-1" />}
                placeholder="Ex: admin ou seu_usuario"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-slate-700 font-medium block">
                Senha
              </label>
              <Input.Password
                id="password"
                size="large"
                prefix={<Lock className="w-4 h-4 text-slate-400 mr-1" />}
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg h-11"
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full h-11 rounded-lg font-medium text-base mt-4 shadow-sm"
              loading={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
