import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Check, 
  PlusCircle, 
  SlidersHorizontal,
  FileCheck,
  CreditCard,
  QrCode,
  Coins,
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react';
import { financeiroService } from '../services/financeiro.service';
import { RegistroFinanceiro } from '../../../types';

export default function FinanceiroView() {
  const [financas, setFinancas] = useState<RegistroFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [isOpen, setIsOpen] = useState(false);
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [categoria, setCategoria] = useState('Venda de Gás');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [formaPagto, setFormaPagto] = useState<RegistroFinanceiro['formaPagamento']>('PIX');
  const [status, setStatus] = useState<RegistroFinanceiro['status']>('PAGO');

  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEITAS' | 'DESPESAS' | 'PENDENTES'>('TODOS');

  const carregarFinancas = async () => {
    try {
      setLoading(true);
      const lista = await financeiroService.listar();
      setFinancas(lista);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao carregar livro caixa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFinancas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');

    if (valor <= 0) {
      setErroMsg('O valor do lançamento deve ser maior que zero!');
      return;
    }
    if (!descricao) {
      setErroMsg('Insira uma breve descrição para o lançamento!');
      return;
    }

    try {
      await financeiroService.criar({
        tipo,
        categoria,
        descricao,
        valor,
        formaPagamento: formaPagto,
        status,
      });

      setSucessoMsg('Lançamento financeiro gravado com sucesso!');
      setIsOpen(false);
      
      // Limpar campos
      setDescricao('');
      setValor(0);
      carregarFinancas();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao emitir lançamento financeiro.');
    }
  };

  const handleConciliar = async (id: string) => {
    try {
      await financeiroService.conciliar(id);
      setSucessoMsg('Lançamento conciliado e marcado como PAGO.');
      carregarFinancas();
      setTimeout(() => setSucessoMsg(''), 3000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao conciliar recebimento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este registro permanentemente do livro caixa?')) return;
    try {
      await financeiroService.remover(id);
      setSucessoMsg('Registro excluído com sucesso.');
      carregarFinancas();
      setTimeout(() => setSucessoMsg(''), 3500);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao excluir o registro.');
    }
  };

  // --- CALCULOS DOS BALANÇOS CONSOLIDADOS ---
  const receitasPagas = financas
    .filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO')
    .reduce((acc, f) => acc + f.valor, 0);

  const despesasPagas = financas
    .filter(f => f.tipo === 'DESPESA' && f.status === 'PAGO')
    .reduce((acc, f) => acc + f.valor, 0);

  const pendentesReceber = financas
    .filter(f => f.tipo === 'RECEITA' && f.status === 'PENDENTE')
    .reduce((acc, f) => acc + f.valor, 0);

  const caixaLiquidoFlutuante = receitasPagas - despesasPagas;

  // Filtragem da tabela
  const filteredFinancas = financas.filter(f => {
    if (filtroTipo === 'TODOS') return true;
    if (filtroTipo === 'RECEITAS') return f.tipo === 'RECEITA';
    if (filtroTipo === 'DESPESAS') return f.tipo === 'DESPESA';
    if (filtroTipo === 'PENDENTES') return f.status === 'PENDENTE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Controle Financeiro (Livro Caixa)</h1>
          <p className="text-sm text-gray-500">Fluxo de caixa de vendas de botijões, despesas operacionais e conciliação de faturados.</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-green/20"
        >
          <PlusCircle size={16} />
          <span>Fazer Lançamento Manual</span>
        </button>
      </div>

      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-00 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <X size={16} className="text-red-500" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* QUADRO DE KPI FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Caixa Líquido Realizado */}
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Caixa Operacional Realizado</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className={`text-xl font-bold ${caixaLiquidoFlutuante >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              R$ {caixaLiquidoFlutuante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2">Receitas menos despesas pagas</span>
        </div>

        {/* Receitas Pagas */}
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Receitas Liquidadas</span>
            <h4 className="text-xl font-bold text-emerald-800">
              R$ {receitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="p-2 bg-emerald-50 text-brand-green rounded-full">
            <ArrowUpCircle size={20} />
          </div>
        </div>

        {/* Despesas Gastas */}
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Despesas Pagas</span>
            <h4 className="text-xl font-bold text-gray-700">
              R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="p-2 bg-gray-100 text-brand-taupe rounded-full">
            <ArrowDownCircle size={20} />
          </div>
        </div>

        {/* Contas a Receber (Faturados Pendentes) */}
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Contas a Receber</span>
            <h4 className="text-xl font-bold text-amber-800">
              R$ {pendentesReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-full animate-pulse">
            <CreditCard size={20} />
          </div>
        </div>

      </div>

      {/* FORM DE CRIAR LANÇAMENTO FINANCEIRO MANUAL */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 bg-white border-2 border-brand-green/20 rounded-xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 font-display">Lançamento de Entrada ou Saída</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Tipo */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Tipo de Lançamento</label>
              <select
                value={tipo}
                onChange={e => {
                  const val = e.target.value as 'RECEITA' | 'DESPESA';
                  setTipo(val);
                  setCategoria(val === 'RECEITA' ? 'Venda de Gás' : 'Combustível');
                }}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs"
              >
                <option value="RECEITA">Entrada (+) Receita</option>
                <option value="DESPESA">Saída (-) Despesa</option>
              </select>
            </div>

            {/* Categoria */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs"
              >
                {tipo === 'RECEITA' ? (
                  <>
                    <option value="Venda de Gás">Venda de Gás (Residencial/Comercial)</option>
                    <option value="Serviços Entrega">Comissão de Entrega Adicional</option>
                    <option value="Outras Receitas">Reposição de Ativos / Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Combustível">Combustível veículos / Frota</option>
                    <option value="Compra de Gás">Compra de Carregamento GLP Fornecedor</option>
                    <option value="Manutenção">Manutenção de Pátio ou Veículo</option>
                    <option value="Comunicação">Marketing e Telefone</option>
                    <option value="Impostos">Encargos e Taxas administrativas</option>
                  </>
                )}
              </select>
            </div>

            {/* Valor */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Valor em R$ *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={valor}
                onChange={e => setValor(parseFloat(e.target.value) || 0)}
                className="p-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>

            {/* Forma de Pagto */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Método de Liquidação</label>
              <select
                value={formaPagto}
                onChange={e => setFormaPagto(e.target.value as any)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs"
              >
                <option value="PIX">Pix Dinâmico</option>
                <option value="DINHEIRO">Moeda física / Dinheiro</option>
                <option value="BOLETO">Boleto Cobrança faturado</option>
                <option value="DEBITO">Cartão Débito</option>
                <option value="CREDITO">Cartão Crédito</option>
              </select>
            </div>

            {/* Descricao */}
            <div className="md:col-span-9 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Histórico / Descrição Geral *</label>
              <input
                type="text"
                placeholder="Exemplo: Recarga de combustível Caminhão Ford Cargo Lapa"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Situação Operacional</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs"
              >
                <option value="PAGO">Liquidado / Pago (Concluído)</option>
                <option value="PENDENTE">Lançado Pendente (A Receber)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
            <button type="button" onClick={() => setIsOpen(false)} className="py-1.5 px-3 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="py-1.5 px-5 bg-brand-green text-white rounded-lg text-xs font-semibold hover:bg-opacity-90">Efetivar Lançamento</button>
          </div>
        </form>
      )}

      {/* FILTROS DO LIVRO CAIXA */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg shrink-0 overflow-x-auto self-start">
        {[
          { key: 'TODOS', label: 'Ver Livro Caixa' },
          { key: 'RECEITAS', label: 'Somente Entradas' },
          { key: 'DESPESAS', label: 'Somente Saídas' },
          { key: 'PENDENTES', label: 'Contas a Receber / Pendentes' }
        ].map(filt => (
          <button
            key={filt.key}
            onClick={() => setFiltroTipo(filt.key as any)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              filtroTipo === filt.key
                ? 'bg-white text-gray-950 shadow-2xs'
                : 'text-gray-500 hover:text-gray-850'
            }`}
          >
            {filt.label}
          </button>
        ))}
      </div>

      {/* METRIC CONTROLLER TABLE */}
      <div id="financial-journal-table" className="bg-white rounded-xl border border-gray-100 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-taupe font-medium">Reorganizando livro financeiro...</div>
        ) : filteredFinancas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Coins size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs">Nenhum registro de livro caixa sob o filtro de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5 font-semibold">Cód Doc</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Categoria</th>
                  <th className="py-3 px-4 font-semibold">Descrição do Histórico</th>
                  <th className="py-3 px-4 font-semibold">Método</th>
                  <th className="py-3 px-4 font-semibold text-right">Valor em R$</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold text-right font-sans">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredFinancas.map((fin) => {
                  const isReceita = fin.tipo === 'RECEITA';
                  return (
                    <tr key={fin.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-5 font-mono text-[10px] text-gray-400">#{fin.id}</td>
                      <td className="py-4 px-4 font-semibold">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isReceita ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-850'
                        }`}>
                          {isReceita ? '+' : '-'} {fin.tipo}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900 font-sans">{fin.categoria}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-gray-650 max-w-[220px] truncate" title={fin.descricao}>
                        {fin.descricao}
                      </td>
                      <td className="py-4 px-4 text-gray-400 font-mono text-[10px]">
                        <span className="flex items-center">
                          {fin.formaPagamento === 'PIX' && <QrCode size={11} className="mr-1 text-teal-600" />}
                          {fin.formaPagamento === 'DINHEIRO' && <Coins size={11} className="mr-1 text-amber-600" />}
                          {fin.formaPagamento === 'BOLETO' && <FileCheck size={11} className="mr-1 text-purple-600" />}
                          {fin.formaPagamento}
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-bold font-mono text-xs ${isReceita ? 'text-emerald-700' : 'text-gray-900'}`}>
                        R$ {fin.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        {fin.status === 'PAGO' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            PAGO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PENDENTE
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {fin.status === 'PENDENTE' && (
                            <button
                              onClick={() => handleConciliar(fin.id)}
                              className="inline-flex items-center space-x-1 px-2 py-1 border border-brand-green rounded text-[10px] font-semibold text-brand-green hover:bg-emerald-50/50"
                              title="Conciliar recebimento"
                            >
                              <Check size={10} />
                              <span>Conciliar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(fin.id)}
                            className="p-1 px-2 border border-gray-100 rounded hover:text-red-500 hover:border-red-200 transition"
                            title="Remover Registro"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
