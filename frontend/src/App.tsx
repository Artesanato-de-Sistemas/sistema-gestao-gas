import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  RotateCcw, 
  Users, 
  ShoppingBag, 
  ArrowRightLeft, 
  Coins, 
  FileText, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  Flame
} from 'lucide-react';

// Import our core Modular Views
import DashboardView from './modules/dashboard/components/DashboardView';
import ProdutosView from './modules/produto/components/ProdutosView';
import VasilhamesView from './modules/vasilhame/components/VasilhamesView';
import ClientesView from './modules/cliente/components/ClientesView';
import PedidosView from './modules/pedido/components/PedidosView';
import MovimentacoesView from './modules/movimentacao/components/MovimentacoesView';
import FinanceiroView from './modules/financeiro/components/FinanceiroView';
import RelatoriosView from './modules/relatorios/components/RelatoriosView';
import ConfiguracoesView from './modules/configuracoes/components/ConfiguracoesView';

// Import Demo check helper
import { getIsDemoMode } from './services/api';

type TabType = 
  | 'dashboard' 
  | 'produtos' 
  | 'vasilhames' 
  | 'clientes' 
  | 'pedidos' 
  | 'movimentacoes' 
  | 'financeiro' 
  | 'relatorios' 
  | 'configuracoes';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setIsDemo(getIsDemoMode());
    
    // Live update clock
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos (GLP)', icon: Package },
    { id: 'vasilhames', label: 'Vasilhames', icon: RotateCcw },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'pedidos', label: 'Pedidos / Vendas', icon: ShoppingBag },
    { id: 'movimentacoes', label: 'Movimentações', icon: ArrowRightLeft },
    { id: 'financeiro', label: 'Financeiro / Caixa', icon: Coins },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  // Render current active layout
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'produtos':
        return <ProdutosView />;
      case 'vasilhames':
        return <VasilhamesView />;
      case 'clientes':
        return <ClientesView />;
      case 'pedidos':
        return <PedidosView />;
      case 'movimentacoes':
        return <MovimentacoesView />;
      case 'financeiro':
        return <FinanceiroView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col font-sans text-gray-900 selection:bg-brand-green/20">
      
      {/* Top Banner indicating Sandbox / Connected Stage */}
      <div className={`py-1 px-4 text-center text-[10px] sm:text-[11px] font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${
        isDemo ? 'bg-brand-cream/30 text-[#6B5A4D] border-b border-brand-cream/60' : 'bg-[#E3EDEB] text-brand-green border-b border-brand-green/20'
      }`}>
        <Database size={12} className="shrink-0" />
        {isDemo ? (
          <span>
            <strong>Modo Demo Ativado:</strong> Armazenando dados localmente no navegador para o preview. Altere no menu de <strong>Configurações</strong>
          </span>
        ) : (
          <span>
            <strong>Modo Sincronizado Spring Boot Ativo:</strong> Conectado a <code>http://localhost:8080</code>
          </span>
        )}
      </div>

      <div className="flex flex-1 relative">
        
        {/* DESKTOP SIDEBAR - COLLAPSIBLE */}
        <aside 
          className={`hidden md:flex flex-col bg-white text-gray-700 border-r border-gray-200/80 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Logo Brand area */}
          <div className="p-3 flex items-center justify-between border-b border-gray-200/80">
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="p-1.5 bg-brand-green rounded-md text-white font-bold tracking-tight shrink-0 flex items-center shadow-xs">
                <Flame size={14} />
              </span>
              {!isSidebarCollapsed && (
                <div className="flex flex-col animate-fadeIn">
                  <span className="font-bold text-xs tracking-tight text-gray-900 leading-tight">Botijas</span>
                  <span className="text-[8px] uppercase tracking-wider text-brand-taupe font-extrabold leading-none">Admin Pro</span>
                </div>
              )}
            </div>
            
            {/* Collapse button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition hidden sm:block"
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center p-2 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-brand-green/10 text-brand-green border-r-3 border-brand-green rounded-r-none font-bold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-r-3 border-transparent'
                  } ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5'}`}
                  title={item.label}
                >
                  <IconComp size={14} className={isActive ? 'text-brand-green' : 'text-gray-400'} />
                  {!isSidebarCollapsed && <span className="animate-fadeIn">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Custom Footer on Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-gray-200 bg-gray-50/50 text-[9px] text-gray-500 font-mono space-y-0.5 animate-fadeIn">
              <p>Usuário: fsdemarque</p>
              <p>Local: São Paulo/SP</p>
            </div>
          )}
        </aside>

        {/* MOBILE SIDEBAR DRAWER (OVERLAY) */}
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Black overlay */}
            <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)}></div>
            
            {/* Drawer body */}
            <aside className="relative w-56 bg-white text-gray-800 flex flex-col z-10 border-r border-[#E5E7EB] animate-slideRight">
              <div className="p-3 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-brand-green text-white rounded-md font-bold font-sans text-xs">Gg</span>
                  <span className="font-bold text-xs tracking-tight text-gray-900">Botijas</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:bg-[#313633] transition"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center p-2 rounded-md text-[11px] font-semibold cursor-pointer space-x-2.5 transition-all ${
                        isActive
                          ? 'bg-brand-green/10 text-brand-green border-r-3 border-brand-green rounded-r-none'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-r-3 border-transparent'
                      }`}
                    >
                      <IconComp size={14} className={isActive ? 'text-brand-green' : 'text-gray-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-gray-200 bg-gray-50/50 text-[9px] text-gray-500 font-mono">
                <p>Módulo Operacional Gás</p>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN VISUAL LAYOUT WORKSPACE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* HEADER NAV */}
          <header className="h-12 bg-white border-b border-gray-200/80 px-4 flex items-center justify-between shrink-0">
            
            {/* Menu trigger button for Mobile */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition md:hidden"
              >
                <Menu size={16} />
              </button>
              <div className="md:hidden font-bold text-gray-900 font-display text-xs">
                GásGestão Reseller OS
              </div>
              
              {/* Dynamic Screen Marker for desktop */}
              <div className="hidden md:flex items-center space-x-2 text-[11px] font-semibold text-gray-400 font-sans select-none">
                <span>Distribuição</span>
                <span>/</span>
                <span className="text-gray-700 capitalize">
                  {activeTab === 'produtos' ? 'Estoque de Produtos' : activeTab}
                </span>
              </div>
            </div>

            {/* Right widgets */}
            <div className="flex items-center space-x-4">
              
              {/* Live Clock widget */}
              <div className="flex items-center space-x-2 px-2.5 py-0.5 bg-gray-50 border border-gray-100 rounded-md shadow-3xs">
                <Calendar size={12} className="text-brand-taupe" />
                <span className="text-[10px] font-semibold text-gray-600 font-sans">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
                <span className="text-[10px] font-mono font-medium text-brand-green border-l border-gray-200 pl-1.5">
                  {currentTime} UTC
                </span>
              </div>

              {/* User Avatar tag */}
              <div className="flex items-center space-x-2 cursor-pointer p-0.5 rounded-md hover:bg-gray-50 transition">
                <div className="w-6 h-6 bg-brand-green/20 text-brand-green font-bold text-[10px] flex items-center justify-center rounded-full shadow-2xs">
                  FD
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] font-semibold text-gray-900 leading-tight">Demarque Resell</span>
                  <span className="text-[8px] text-gray-400 leading-none">Supervisor de Pátio</span>
                </div>
              </div>

            </div>

          </header>

          {/* SCROLLABLE MAIN LAYOUT VIEW */}
          <main className="flex-1 overflow-y-auto p-3 md:p-4 pb-10">
            <div className="max-w-7xl mx-auto animate-fadeIn duration-200">
              {renderContent()}
            </div>
          </main>

        </div>

      </div>

    </div>
  );
}
