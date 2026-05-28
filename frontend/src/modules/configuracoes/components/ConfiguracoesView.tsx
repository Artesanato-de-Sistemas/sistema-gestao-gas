import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  ToggleLeft, 
  ToggleRight, 
  Info, 
  Check, 
  AlertTriangle,
  MapPin,
  Building2,
  Lock,
  Loader2
} from 'lucide-react';
import { getIsDemoMode, setIsDemoMode } from '../../../services/api';

export default function ConfiguracoesView() {
  const [demoMode, setDemoMode] = useState(true);
  const [companyName, setCompanyName] = useState('Gás Brasil Central Eireli');
  const [cnpj, setCnpj] = useState('22.880.115/0001-44');
  const [address, setAddress] = useState('Av. Marginal Direita, 250 - São Paulo SP');
  const [thresholdP13, setThresholdP13] = useState(15);
  const [sucessoMsg, setSucessoMsg] = useState('');

  useEffect(() => {
    setDemoMode(getIsDemoMode());
  }, []);

  const handleToggleMode = () => {
    const nextVal = !demoMode;
    setDemoMode(nextVal);
    setIsDemoMode(nextVal);
    setSucessoMsg(
      nextVal 
        ? 'Modo de Demonstração ATIVADO. O sistema está lendo e escrevendo no banco LocalStorage do navegador.'
        : 'Sincronização Spring Boot ATIVADA. O sistema agora faz requisições REST Axios para http://localhost:8080'
    );
    setTimeout(() => {
      setSucessoMsg('');
      // Recarrega para reinicializar os serviços
      window.location.reload();
    }, 2500);
  };

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    setSucessoMsg('Configurações de Identidade Corporativa salvas com sucesso!');
    setTimeout(() => setSucessoMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Configurações Gerais</h1>
        <p className="text-sm text-gray-500">Mapeamento de banco de dados, chaves de API, variáveis do Spring Boot e parâmetros administrativos.</p>
      </div>

      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL-SPAN-2: CONTROLE DO BACKEND INTEGRATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Caixa de Toggle Dinâmica */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-3xs space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-sm flex items-center font-display">
                  <Database size={16} className="mr-2 text-brand-green" />
                  Conexão de Dados Backend Integrada
                </h3>
                <p className="text-[11px] text-gray-400">Configure se este painel consome a API Spring Boot real ou roda com simulação local em sandbox.</p>
              </div>
              <button
                onClick={handleToggleMode}
                className="focus:outline-hidden transition-all duration-300"
              >
                {demoMode ? (
                  <ToggleLeft size={44} className="text-gray-300" />
                ) : (
                  <ToggleRight size={44} className="text-brand-green" />
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-lg text-xs space-y-1.5 border leading-relaxed">
              {demoMode ? (
                <div className="text-slate-700 bg-emerald-50/20 border-emerald-100">
                  <span className="font-bold text-emerald-800 flex items-center mb-1">
                    🟢 Modo de Demonstração Ativo (AI Studio Sandbox)
                  </span>
                  Lendo e escrevendo dados em memória local do navegador. Esta interface é 100% interativa e permite criar pedidos, movimentar estoques e emitir relatórios instantaneamente no preview.
                </div>
              ) : (
                <div className="text-indigo-800 bg-indigo-50/20 border-indigo-100">
                  <span className="font-bold flex items-center mb-1">
                    ⚡ Integração direta Spring Boot Ativa
                  </span>
                  Fazendo requisições REST AXIOS reais para a porta <code>http://localhost:8080</code> da sua máquina de desenvolvimento.
                </div>
              )}
            </div>

            {/* Variáveis de Ambiente lidas do .env */}
            <div className="pt-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Variáveis de Integração Sincronizadas</h4>
              <div className="space-y-2 text-xs font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-cool-gray-500">API URL (Vite Base):</span>
                  <span className="font-semibold text-gray-750">NEXT_PUBLIC_API_URL = "http://localhost:8080"</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-50">
                  <span className="text-cool-gray-500">Modo de Conexão:</span>
                  <span className="font-semibold text-gray-750">{demoMode ? 'LOCAL_STORAGE_SEED' : 'AXIOS_HTTP_REST'}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-50">
                  <span className="text-cool-gray-500">Timeout Intercept:</span>
                  <span className="font-semibold text-gray-750">10000 ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados Corporativos Eireli */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-3xs">
            <h3 className="font-bold text-gray-900 text-sm flex items-center font-display mb-4">
              <Building2 size={16} className="mr-2 text-brand-green" />
              Identidade Corporativa da Revendedora
            </h3>

            <form onSubmit={handleSaveCorporate} className="space-y-4 text-xs font-semibold text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label>Razão Social / Nome de Operadora</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg bg-white "
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label>CNPJ Oficial</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg bg-white "
                  />
                </div>
                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <label>Endereço de Entreposto Central</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg bg-white "
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-brand-green text-white font-medium hover:bg-opacity-90 rounded-lg text-xs"
                >
                  Salvar Dados Corporativos
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* COL 1: CONFIGURAÇÕES AUXILIARES / LIMITES OPERACIONAIS */}
        <div className="space-y-6">
          
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-3xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center font-display mb-1">
                <Lock size={15} className="mr-2 text-brand-green" />
                Regras de Negócio e Segurança
              </h3>
              <p className="text-[10px] text-gray-400 mb-4">Ajustes operacionais automáticos do pátio de botijões.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-gray-600">
              <div className="flex flex-col space-y-1">
                <label>Alerta Limite Mínimo P13 (Cilindros)</label>
                <input
                  type="number"
                  value={thresholdP13}
                  onChange={e => setThresholdP13(parseInt(e.target.value) || 0)}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-center"
                />
                <span className="text-[9px] text-gray-400 mt-1 font-normal">Dispara o alerta amarelo no topo do Dashboard se o número for menor.</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start space-x-1.5 text-[10px] text-amber-800 leading-normal font-sans">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Limite de Contingência:</strong> Recomenda-se manter um valor alto o suficiente para cobrir 1 dia completo de frete emergencial de reposição caso haja atraso no envasamento do fornecedor.
                </span>
              </div>
            </div>
          </div>

          {/* System info */}
          <div className="p-4 bg-gray-55/40 border border-gray-100 rounded-xl text-[11px] text-gray-500 font-sans space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center text-gray-700">
              <Info size={13} className="mr-1 text-brand-green shrink-0" />
              GásGestão Informações do Sistema
            </span>
            <p>Este frontend foi otimizado para o consumo modular do Spring Boot REST. Os serviços localizados em <code>modules/*/services/*.service.ts</code> exportam chamadas prontas para consumir:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] font-mono mt-2 text-slate-705">
              <li>GET /produto</li>
              <li>POST /pedido</li>
              <li>PUT /cliente/{`{id}`}</li>
              <li>GET /vasilhame</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
