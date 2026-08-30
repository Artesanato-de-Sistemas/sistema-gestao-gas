import { KeyRound } from 'lucide-react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

export function MyProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <Title level={3} className="!m-0 !text-slate-800">Meus Dados</Title>
          <Text className="text-slate-500 text-sm">Edição de Email e Senha</Text>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-center gap-4 min-h-64">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-slate-400" />
        </div>
        <Title level={4} className="!m-0 !text-slate-600">Em Breve</Title>
        <Text className="text-slate-400 max-w-sm">
          A funcionalidade de alteração de email e senha está planejada para uma próxima versão.
        </Text>
      </div>
    </div>
  );
}
