import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { Button, Input, Card, Typography } from 'antd';
import { useAuthStore } from '@/store/useAuth';

const { Title, Text } = Typography;

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    
    // Mock login
    setTimeout(() => {
      login(
        { id: '1', name: 'Admin', email: email },
        'mock_jwt_token_123'
      );
      navigate('/');
      setLoading(false);
    }, 1000);
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
                <Text className="text-slate-500">Insira suas credenciais para gerenciar o estoque e vendas</Text>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-slate-700 font-medium block">Email</label>
                    <Input
                        id="email"
                        type="email"
                        size="large"
                        placeholder="usuario@imperiodogas.com.br"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-lg h-11"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-slate-700 font-medium block">Senha</label>
                    <Input.Password
                        id="password"
                        size="large"
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
