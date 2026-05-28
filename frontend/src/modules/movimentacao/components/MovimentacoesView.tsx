import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  User, 
  Clock, 
  SlidersHorizontal, 
  ClipboardList, 
  Check, 
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { movimentacaoService } from '../services/movimentacao.service';
import { produtoService } from '../../produto/services/produto.service';
import { MovimentacaoEstoque, Produto } from '../../../types';

export default function MovimentacoesView() {
  const [movs, setMovs] = useState<MovimentacaoEstoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<MovimentacaoEstoque['tipo']>('ENTRADA_COMPRA');
  const [prodId, setProdId] = useState('');
  const [tipoVasilhame, setTipoVasilhame] = useState<'P5' | 'P13' | 'P20' | 'P45'>('P13');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [detalhes, setDetalhes] = useState('');
  const [usuario, setUsuario] = useState('Encarregado Carlos');

  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const carregarTudo = async () => {
    try {
      setLoading(true);
      const [lista, listProds] = await Promise.all([
        movimentacaoService.listar(),
        produtoService.listar(),
      ]);
      setMovs(lista);
      setProdutos(listProds);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');

    if (quantidade <= 0) {
      setErroMsg('A quantidade deve ser maior do que zero!');
      return;
    }

    try {
      await movimentacaoService.criar({
        tipo: tipoMov,
        produtoId: prodId || undefined,
        tipoVasilhame,
        quantidade,
        detalhes: detalhes || `Ajuste manual de ${tipoMov.replace('_', ' ')}`,
        usuario,
      });

      setSucessoMsg('Movimentação manual registrada e estoque sincronizado!');
      setIsOpen(false);
      // Limpa inputs
      setDetalhes('');
      setQuantidade(10);
      carregarTudo();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Falha ao registrar movimentação.');
    }
  };

  // Filtered movements
  const filteredMovs = movs.filter(m => {
    if (filtroTipo === 'TODOS') return true;
    if (filtroTipo === 'ENTRADAS') return m.tipo.startsWith('ENTRADA') || m.tipo.startsWith('RETORNO');
    if (filtroTipo === 'SAIDAS') return m.tipo.startsWith('SAIDA') || m.tipo === 'ENVIO_CARGA_SUPPLIER' || m.tipo === 'PERDA_DANIFICADO';
    return m.tipo === filtroTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Movimentações de Estoque</h1>
          <p className="text-sm text-gray-500">Acompanhamento e auditoria de entradas e saídas físicas de cilindros cheios e vazios.</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-green/20"
        >
          <PlusCircle size={16} />
          <span>Registrar Ajuste de Estoque</span>
        </button>
      </div>

      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <Check size={16} className="text-emerald-500" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-00 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <HelpCircle size={16} className="text-red-500" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* FORM DE REGISTRO MANUAL */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 bg-white border-2 border-brand-green/20 rounded-xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 font-display">Registrar Movimento / Ajuste de Pátio</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Tipo de Movimento */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-650">Natureza do Movimento</label>
              <select
                value={tipoMov}
                onChange={e => setTipoMov(e.target.value as any)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs text-gray-800 focus:outline-hidden"
              >
                <option value="ENTRADA_COMPRA">Entrada por Compra (Carga Cheia)</option>
                <option value="SAIDA_VENDA">Saída por Venda</option>
                <option value="RETORNO_VAZIO">Retorno Vazio do Cliente</option>
                <option value="ENVIO_CARGA_SUPPLIER">Remessa Vazio para Fornecedor (Envasamento)</option>
                <option value="RETORNO_CHEIO">Entrada Cheio do Fornecedor</option>
                <option value="PERDA_DANIFICADO">Baixa por Perda / Danificado</option>
              </select>
            </div>

            {/* Vasilhame Tipo */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Modelo do Botijão</label>
              <select
                value={tipoVasilhame}
                onChange={e => setTipoVasilhame(e.target.value as any)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs text-gray-800"
              >
                <option value="P5">P5 (5 Kg)</option>
                <option value="P13">P13 (13 Kg)</option>
                <option value="P20">P20 (20 Kg)</option>
                <option value="P45">P45 (45 Kg)</option>
              </select>
            </div>

            {/* Quantidade */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Quantidade Movimentada *</label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(parseInt(e.target.value) || 0)}
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
            </div>

            {/* Assinado por */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655 font-sans">Encarregado / Operador</label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
            </div>

            {/* Detalhes / Justificativa */}
            <div className="md:col-span-4 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-655">Histórico / Descrição Justificativa</label>
              <input
                type="text"
                placeholder="Exemplo: Carga de 10 garrafas enviado à distribuidora de envasamento Liquigás"
                value={detalhes}
                onChange={e => setDetalhes(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
            <button type="button" onClick={() => setIsOpen(false)} className="py-1.5 px-3 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="py-1.5 px-5 bg-brand-green text-white rounded-lg text-xs font-semibold hover:bg-opacity-90">Salvar Ajuste</button>
          </div>
        </form>
      )}

      {/* FILTROS LATERAL */}
      <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-lg shrink-0 overflow-x-auto self-start">
        {[
          { key: 'TODOS', label: 'Todas as Ações' },
          { key: 'ENTRADAS', label: 'Apenas Entradas' },
          { key: 'SAIDAS', label: 'Apenas Saídas' },
          { key: 'RETORNO_VAZIO', label: 'Retorno Vazio (Troca)' },
          { key: 'ENVIO_CARGA_SUPPLIER', label: 'Remessas Fornecedor' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFiltroTipo(item.key)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              filtroTipo === item.key
                ? 'bg-white text-gray-950 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* DIÁRIO LEDGER TABELA */}
      <div id="movements-audit-grid" className="bg-white rounded-xl border border-gray-100 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-taupe font-medium">Lendo registros de pátio...</div>
        ) : filteredMovs.length === 0 ? (
          <div className="p-12 text-center text-gray-450 space-y-2">
            <ClipboardList size={32} className="mx-auto text-gray-300" />
            <p className="text-xs">Nenhum evento registrado sob o filtro escolhido.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5 font-semibold">Cód Evento</th>
                  <th className="py-3 px-4 font-semibold">Tipo de Ação</th>
                  <th className="py-3 px-4 font-semibold">Modelo Gás</th>
                  <th className="py-3 px-4 font-semibold text-center">Quantidade</th>
                  <th className="py-3 px-4 font-semibold">Descrição do Histórico</th>
                  <th className="py-3 px-4 font-semibold">Sincronizado Por</th>
                  <th className="py-3 px-5 font-semibold text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredMovs.map((m) => {
                  const isEntrada = m.tipo.startsWith('ENTRADA') || m.tipo.startsWith('RETORNO');
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-5 font-mono text-[10px] text-gray-400 font-semibold">#{m.id}</td>
                      <td className="py-4 px-4 font-semibold">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isEntrada 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                            : m.tipo === 'PERDA_DANIFICADO' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {isEntrada ? (
                            <ArrowDownLeft size={10} className="mr-1 text-emerald-600" />
                          ) : (
                            <ArrowUpRight size={10} className="mr-1 text-gray-500" />
                          )}
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-750 font-mono text-xs">P{m.tipoVasilhame}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-gray-900">
                        {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`} un
                      </td>
                      <td className="py-4 px-4 text-gray-600 max-w-[260px] truncate" title={m.detalhes}>
                        {m.detalhes}
                      </td>
                      <td className="py-4 px-4 text-gray-500 font-medium">
                        <span className="flex items-center">
                          <User size={12} className="mr-1 text-gray-400" />
                          {m.usuario}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-[10px] text-gray-400">
                        <span className="flex items-center justify-end">
                          <Clock size={11} className="mr-1 text-gray-400" />
                          {new Date(m.dataHora).toLocaleDateString()} {new Date(m.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
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
