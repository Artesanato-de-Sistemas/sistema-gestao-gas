import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  RotateCcw, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  Clock, 
  TrendingDown, 
  PackageCheck,
  UserCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { produtoService } from '../../produto/services/produto.service';
import { pedidoService } from '../../pedido/services/pedido.service';
import { vasilhameService } from '../../vasilhame/services/vasilhame.service';
import { movimentacaoService } from '../../movimentacao/services/movimentacao.service';
import { financeiroService } from '../../financeiro/services/financeiro.service';
import { Produto, Pedido, Vasilhame, MovimentacaoEstoque, RegistroFinanceiro } from '../../../types';

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [vasilhames, setVasilhames] = useState<Vasilhame[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [financeiro, setFinanceiro] = useState<RegistroFinanceiro[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [prodList, pedList, vasList, movList, finList] = await Promise.all([
          produtoService.listar(),
          pedidoService.listar(),
          vasilhameService.listar(),
          movimentacaoService.listar(),
          financeiroService.listar(),
        ]);
        setProdutos(prodList);
        setPedidos(pedList);
        setVasilhames(vasList);
        setMovimentacoes(movList);
        setFinanceiro(finList);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-brand-taupe">Carregando painel operacional...</p>
      </div>
    );
  }

  // --- CALCULOS DOS INDICADORES (KPIs) ---
  const totalCheio = produtos.reduce((acc, p) => acc + p.estoqueCheio, 0);
  const totalVazio = produtos.reduce((acc, p) => acc + p.estoqueVazio, 0);
  
  // Vasilhames com clientes (Status EM_CLIENTE)
  const totalEmClientes = vasilhames.filter(v => v.status === 'EM_CLIENTE').length;
  const totalDanificados = vasilhames.filter(v => v.status === 'DANIFICADO').length;

  // Faturamento total (PAGO) e faturamento de vendas de gás
  const faturamentoTotal = financeiro
    .filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO')
    .reduce((acc, f) => acc + f.valor, 0);

  const despesaTotal = financeiro
    .filter(f => f.tipo === 'DESPESA' && f.status === 'PAGO')
    .reduce((acc, f) => acc + f.valor, 0);

  const saldoDisponivel = faturamentoTotal - despesaTotal;

  // Pedidos pendentes/em andamento
  const pedidosAndamento = pedidos.filter(p => p.status === 'PENDENTE' || p.status === 'PREPARANDO' || p.status === 'EM_ROTA');
  const pedidosHojeNum = pedidos.filter(p => {
    const hoje = new Date().toISOString().split('T')[0];
    return p.dataPedido.startsWith(hoje);
  }).length;

  // Alertas: Produtos com estoque cheio abaixo do limite mínimo
  const alertasEstoque = produtos.filter(p => p.estoqueCheio < p.limiteEstoqueMinimo);

  // --- DADOS PARA O GRAFICO RECHARTS DE EVOLUÇÃO ---
  // Mock ou cálculo com base nos pedidos reais dos últimos dias
  const ultimosSeteDias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartDataFaturamento = ultimosSeteDias.map(dia => {
    // faturamento naquele dia
    const totalDia = financeiro
      .filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO' && f.dataHora.startsWith(dia))
      .reduce((acc, f) => acc + f.valor, 0);

    const totalDespesa = financeiro
      .filter(f => f.tipo === 'DESPESA' && f.status === 'PAGO' && f.dataHora.startsWith(dia))
      .reduce((acc, f) => acc + f.valor, 0);

    // Formata o dia como "DD/MM"
    const [_, mes, diaStr] = dia.split('-');
    return {
      name: `${diaStr}/${mes}`,
      Receita: totalDia,
      Despesa: totalDespesa
    };
  });

  // --- DADOS PARA O GRAFICO DE ROSCA DE VASILHAMES ---
  const pieDataVasilhames = [
    { name: 'Cheios no Estoque', value: totalCheio },
    { name: 'Vazios no Estoque', value: totalVazio },
    { name: 'Em Clientes', value: totalEmClientes },
    { name: 'Danificados/Manutenção', value: totalDanificados },
  ];

  // Paleta de cores específica:
  // Verde: #839788, Creme escuro/Taupe: #BAA898, Azul suave: #BFD7EA, Alerta: #E2B18E
  const COLORS = ['#839788', '#BAA898', '#BFD7EA', '#E07A5F'];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Dashboard Operacional</h1>
          <p className="text-sm text-gray-500">Monitoramento e indicadores de estoque, cilindros e entregas de GLP.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 bg-white px-3 py-1.5 rounded-lg shadow-2xs border border-gray-100">
          <Clock size={14} className="text-brand-green mr-1" />
          <span>Sincronizado: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Alertas Críticos de Estoque */}
      {alertasEstoque.length > 0 && (
        <div id="dashboard-alerts" className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-start space-x-3 transition-all">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Atenção: Alerta de Estoque Mínimo Atingido!</h3>
            <p className="text-xs text-amber-800 mt-1">
              Os seguintes produtos encontram-se abaixo da capacidade crítica garantida de contingência: {alertasEstoque.map(p => `${p.nome} (${p.estoqueCheio} cheios / mín ${p.limiteEstoqueMinimo})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Cards de KPIs em Linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estoque Total */}
        <div id="kpi-estoque" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Estoque de Cheios</p>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">{totalCheio} <span className="text-xs font-normal text-gray-500">unid</span></h3>
            <span className="flex items-center text-[10px] text-brand-green font-medium">
              <PackageCheck size={11} className="mr-0.5" />
              {totalVazio} cilindros vazios
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-brand-green">
            <Package size={22} />
          </div>
        </div>

        {/* Em Clientes */}
        <div id="kpi-comodato" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Em Posse de Clientes</p>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">{totalEmClientes} <span className="text-xs font-normal text-gray-500">unid</span></h3>
            <span className="flex items-center text-[10px] text-brand-taupe font-medium">
              <RotateCcw size={11} className="mr-0.5" />
              Garantia e empréstimos
            </span>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-brand-sky">
            <UserCheck size={22} className="text-sky-700" />
          </div>
        </div>

        {/* Faturamento Financeiro */}
        <div id="kpi-faturamento" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Caixa Operacional</p>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              R$ {saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="flex items-center text-[10px] text-gray-500">
              Receitas: R$ {faturamentoTotal.toFixed(0)} | Despesas: R$ {despesaTotal.toFixed(0)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 text-amber-700">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Pedidos Hoje */}
        <div id="kpi-entregas" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Logística de Entregas</p>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">{pedidosAndamento.length} <span className="text-xs font-normal text-gray-500">ativas</span></h3>
            <span className="flex items-center text-[10px] text-brand-green font-medium">
              <Activity size={11} className="mr-0.5 text-brand-green animate-pulse" />
              {pedidosHojeNum} novos pedidos hoje
            </span>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 text-gray-600">
            <Truck size={22} />
          </div>
        </div>
      </div>

      {/* Grid de Gráficos e Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Evolução de Caixa (2/3 da largura em desktop) */}
        <div id="chart-receitas" className="lg:col-span-2 p-5 bg-white rounded-xl shadow-2xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 font-display">Fluxo Financeiro Semanal</h2>
              <p className="text-xs text-gray-400">Gráfico consolidado de receitas e despesas operacionais.</p>
            </div>
            <div className="flex space-x-4 text-xs font-medium text-gray-500">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-xs bg-brand-green mr-1.5 block"></span>
                <span>Receitas</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-xs bg-brand-taupe mr-1.5 block"></span>
                <span>Despesas</span>
              </div>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataFaturamento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#839788" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#839788" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BAA898" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#BAA898" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]}
                />
                <Area type="monotone" dataKey="Receita" stroke="#839788" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                <Area type="monotone" dataKey="Despesa" stroke="#BAA898" strokeWidth={2} fillOpacity={1} fill="url(#colorDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição e Localização de Vasilhames */}
        <div id="chart-vasilhames" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 font-display">Localização dos Vasilhames</h2>
            <p className="text-xs text-gray-400 mb-2">Composição dos vasilhames cadastrados da distribuidora.</p>
          </div>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataVasilhames}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieDataVasilhames.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} cilindros`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pieDataVasilhames.map((item, index) => (
              <div key={item.name} className="flex justify-between text-xs">
                <span className="flex items-center text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index] }}></span>
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linha Inferior: Alertas Operacionais e Timeline de Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Pedidos Ativos / Em Rota */}
        <div id="panel-recent-deliveries" className="lg:col-span-2 p-5 bg-white rounded-xl shadow-2xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 font-display">Pedidos Operacionais Recentes</h2>
              <p className="text-xs text-gray-400">Entregas em processamento no momento.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {pedidosAndamento.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Sem pedidos pendentes no momento. Prontos para receber novas vendas!
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 font-semibold">Código</th>
                    <th className="pb-2 font-semibold">Cliente</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Logística</th>
                    <th className="pb-2 font-semibold text-right font-sans">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {pedidosAndamento.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono font-bold text-gray-900">{p.id}</td>
                      <td className="py-3">
                        <div className="font-semibold text-gray-900">{p.clienteNome}</div>
                        <div className="text-[10px] text-gray-400">
                          {p.itens.map(it => `${it.quantidade}x ${it.produtoNome.split(' ')[2]}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          p.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          p.status === 'PREPARANDO' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 font-mono text-[10px]">
                        {p.entregador || 'Aguardando escalação'}
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-900 font-sans">
                        R$ {p.valorTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Timeline / Diário de Movimentações Recentes */}
        <div id="panel-warehouse-timeline" className="p-5 bg-white rounded-xl shadow-2xs border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 font-display">Timeline das Movimentações</h2>
            <p className="text-xs text-gray-400">Atividades recentes verificadas pelo encarregado de estoque.</p>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[250px] pr-1">
            {movimentacoes.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">Nenhuma movimentação registrada no diário.</div>
            ) : (
              movimentacoes.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start space-x-2.5 text-xs">
                  <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${
                    item.tipo.startsWith('ENTRADA') || item.tipo.startsWith('RETORNO') 
                      ? 'bg-brand-green' 
                      : item.tipo === 'PERDA_DANIFICADO' ? 'bg-red-500' : 'bg-brand-taupe'
                  }`}></div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">{item.tipo.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(item.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-500 break-words">{item.detalhes}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                      <span>Ref: {item.tipoVasilhame} ({item.quantidade} unid)</span>
                      <span>Resp: {item.usuario.split(' ')[1] || item.usuario}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
