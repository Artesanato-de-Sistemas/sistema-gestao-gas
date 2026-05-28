import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RotateCw, 
  FileCheck, 
  Layers, 
  ArrowRightLeft, 
  Flame, 
  Server, 
  Check, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { vasilhameService } from '../services/vasilhame.service';
import { db } from '../../../services/localDb';
import { Vasilhame, StatusVasilhame } from '../../../types';

export default function VasilhamesView() {
  const [vasilhames, setVasilhames] = useState<Vasilhame[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States of the batch movement form
  const [tipoLote, setTipoLote] = useState<'P5' | 'P13' | 'P20' | 'P45'>('P13');
  const [qtdLote, setQtdLote] = useState<number>(5);
  const [deStatusLote, setDeStatusLote] = useState<StatusVasilhame>('VAZIO_ENTREPOSTO');
  const [paraStatusLote, setParaStatusLote] = useState<StatusVasilhame>('CHEIO_ENTREPOSTO');

  const [novoId, setNovoId] = useState('');
  const [novoTipo, setNovoTipo] = useState<'P5' | 'P13' | 'P20' | 'P45'>('P13');
  const [novaMarca, setNovaMarca] = useState('Ultragaz');
  const [novoStatus, setNovoStatus] = useState<StatusVasilhame>('CHEIO_ENTREPOSTO');

  const [isLoteOpen, setIsLoteOpen] = useState(false);
  const [isIndividualOpen, setIsIndividualOpen] = useState(false);
  
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const carregarVasilhames = async () => {
    try {
      setLoading(true);
      const lista = await vasilhameService.listar();
      setVasilhames(lista);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao consultar planilha de vasilhames');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVasilhames();
  }, []);

  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErroMsg('');
      await vasilhameService.criar({
        tipo: novoTipo,
        marca: novaMarca,
        status: novoStatus,
      });
      setSucessoMsg('Cilindro cadastrado individualmente com sucesso!');
      setIsIndividualOpen(false);
      setNovoId('');
      carregarVasilhames();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao registrar vasilhame.');
    }
  };

  const handleMovimentarLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtdLote <= 0) {
      setErroMsg('A quantidade mútua do lote deve ser no mínimo 1');
      return;
    }
    // Validar se existem cilindros na origem para mover
    const vaziosDisponiveis = vasilhames.filter(v => v.tipo === tipoLote && v.status === deStatusLote).length;
    if (vaziosDisponiveis < qtdLote) {
      setErroMsg(`Estoque insuficiente! Existem apenas ${vaziosDisponiveis} cilindros ${tipoLote} no status de origem.`);
      return;
    }

    try {
      setErroMsg('');
      await vasilhameService.movimentarLote(tipoLote, qtdLote, deStatusLote, paraStatusLote);
      
      // Registrar no diário de movimentações gerais também
      const movs = db.getMovimentacoes();
      movs.push({
        id: 'mov-' + Math.random().toString(36).substring(2, 7),
        tipo: paraStatusLote === 'CHEIO_ENTREPOSTO' ? 'RETORNO_CHEIO' : 'ENVIO_CARGA_SUPPLIER',
        tipoVasilhame: tipoLote,
        quantidade: qtdLote,
        detalhes: `Ajuste operacional de lote (${deStatusLote} ➔ ${paraStatusLote})`,
        usuario: 'Gestor de Estoque',
        dataHora: new Date().toISOString()
      });
      db.saveMovimentacoes(movs);

      setSucessoMsg(`Operação de Lote processada: ${qtdLote} botijões ${tipoLote} alterados no estoque.`);
      setIsLoteOpen(false);
      carregarVasilhames();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro na movimentação em lote do envasamento.');
    }
  };

  const handleMudarStatusIndividual = async (id: string, novoSt: StatusVasilhame) => {
    try {
      await vasilhameService.atualizar(id, { status: novoSt });
      setSucessoMsg('Status do cilindro alterado com sucesso!');
      carregarVasilhames();
      setTimeout(() => setSucessoMsg(''), 3000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao atualizar botijão individual');
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    if (!window.confirm('Excluir este cilindro de forma permanente?')) return;
    try {
      await vasilhameService.remover(id);
      setSucessoMsg('Cilindro baixado do acervo patrimonial permanentemente.');
      carregarVasilhames();
      setTimeout(() => setSucessoMsg(''), 3000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao deletar botijão.');
    }
  };

  // Agrupamentos estatísticos por Marca e Status
  const totaisPorStatus = {
    CHEIO_ENTREPOSTO: vasilhames.filter(v => v.status === 'CHEIO_ENTREPOSTO').length,
    VAZIO_ENTREPOSTO: vasilhames.filter(v => v.status === 'VAZIO_ENTREPOSTO').length,
    EM_CLIENTE: vasilhames.filter(v => v.status === 'EM_CLIENTE').length,
    DANIFICADO: vasilhames.filter(v => v.status === 'DANIFICADO').length,
  };

  // Contagem de marcas
  const marcasCount = vasilhames.reduce((acc: Record<string, number>, curr) => {
    acc[curr.marca] = (acc[curr.marca] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Controle de Vasilhames</h1>
          <p className="text-sm text-gray-500">Gestão patrimonial de botijões (Ativos da empresa e saldo em clientes).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setIsIndividualOpen(false); setIsLoteOpen(!isLoteOpen); }}
            className="inline-flex items-center justify-center space-x-2 border border-brand-green text-brand-green hover:bg-emerald-50/50 font-medium text-xs py-2.5 px-4 rounded-lg shadow-2xs transition-all"
          >
            <ArrowRightLeft size={16} />
            <span>Movimentação Lote</span>
          </button>
          <button
            onClick={() => { setIsLoteOpen(false); setIsIndividualOpen(!isIndividualOpen); }}
            className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-2xs transition-all animate-bounce-slow"
          >
            <Plus size={16} />
            <span>Adicionar Botijão</span>
          </button>
        </div>
      </div>

      {/* Alertas & Toasts */}
      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <ShieldAlert size={16} className="text-red-500" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* Grid de Informações dos Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Cheios no Entreposto</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-bold text-gray-900">{totaisPorStatus.CHEIO_ENTREPOSTO}</span>
            <span className="text-xs text-brand-green font-semibold">unid</span>
          </div>
          <div className="h-1 w-full bg-emerald-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-brand-green" style={{ width: `${Math.min(100, (totaisPorStatus.CHEIO_ENTREPOSTO / Math.max(1, vasilhames.length)) * 100)}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Vazios no Entreposto</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-bold text-gray-900">{totaisPorStatus.VAZIO_ENTREPOSTO}</span>
            <span className="text-xs text-brand-taupe font-semibold">unid</span>
          </div>
          <div className="h-1 w-full bg-orange-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-brand-taupe" style={{ width: `${Math.min(100, (totaisPorStatus.VAZIO_ENTREPOSTO / Math.max(1, vasilhames.length)) * 100)}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Em posse de clientes</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-bold text-gray-900">{totaisPorStatus.EM_CLIENTE}</span>
            <span className="text-xs text-gray-500 font-semibold">comodato</span>
          </div>
          <div className="h-1 w-full bg-blue-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (totaisPorStatus.EM_CLIENTE / Math.max(1, vasilhames.length)) * 100)}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Danificados / Reparos</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-bold text-red-700">{totaisPorStatus.DANIFICADO}</span>
            <span className="text-xs text-red-500 font-bold">manutenção</span>
          </div>
          <div className="h-1 w-full bg-red-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (totaisPorStatus.DANIFICADO / Math.max(1, vasilhames.length)) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Form Individual de Adição */}
      {isIndividualOpen && (
        <form onSubmit={handleCreateIndividual} className="p-5 bg-white rounded-xl border-2 border-brand-green/20 shadow-xs space-y-4 animate-fadeIn">
          <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-900 font-display">Cadastrar Cilindro Individual</h3>
            <button type="button" onClick={() => setIsIndividualOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Tamanho/Capacidade</label>
              <select 
                value={novoTipo} 
                onChange={e => setNovoTipo(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="P5">P5 (5 Kg)</option>
                <option value="P13">P13 (13 Kg)</option>
                <option value="P20">P20 (20 Kg)</option>
                <option value="P45">P45 (45 Kg)</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Marca da Distribuidora Envasadora</label>
              <select
                value={novaMarca}
                onChange={e => setNovaMarca(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="Ultragaz">Ultragaz</option>
                <option value="Liquigás">Liquigás</option>
                <option value="Supergasbras">Supergasbras</option>
                <option value="Copagaz">Copagaz</option>
                <option value="NacionalGas">NacionalGas</option>
                <option value="Consigaz">Consigaz</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Estado Atual de Carga</label>
              <select
                value={novoStatus}
                onChange={e => setNovoStatus(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="CHEIO_ENTREPOSTO">Cheio no Entreposto</option>
                <option value="VAZIO_ENTREPOSTO">Vazio no Entreposto</option>
                <option value="DANIFICADO">Danificado / Manutenção</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsIndividualOpen(false)} className="py-1.5 px-3 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="py-1.5 px-4 bg-brand-green text-white rounded-lg text-xs font-medium hover:bg-opacity-90">Salvar Item</button>
          </div>
        </form>
      )}

      {/* Form de Movimentação em Lote */}
      {isLoteOpen && (
        <form onSubmit={handleMovimentarLoteSubmit} className="p-5 bg-white rounded-xl border-2 border-brand-green/20 shadow-xs space-y-4 animate-fadeIn">
          <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-900 font-display">Painel de Movimentação em Lote (Envasamento)</h3>
            <button type="button" onClick={() => setIsLoteOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Modelo Botijão</label>
              <select 
                value={tipoLote} 
                onChange={e => setTipoLote(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="P5">P5</option>
                <option value="P13">P13</option>
                <option value="P20">P20</option>
                <option value="P45">P45</option>
              </select>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Qtd de Cilindros</label>
              <input
                type="number"
                min="1"
                value={qtdLote}
                onChange={e => setQtdLote(parseInt(e.target.value) || 0)}
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Status Origem (De)</label>
              <select
                value={deStatusLote}
                onChange={e => setDeStatusLote(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="VAZIO_ENTREPOSTO">Vazio no Entreposto</option>
                <option value="CHEIO_ENTREPOSTO">Cheio no Entreposto</option>
                <option value="DANIFICADO">Danificado</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Status Destino (Para)</label>
              <select
                value={paraStatusLote}
                onChange={e => setParaStatusLote(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="CHEIO_ENTREPOSTO">Cheio no Entreposto (Retorno do Fornecedor)</option>
                <option value="VAZIO_ENTREPOSTO">Vazio no Entreposto</option>
                <option value="DANIFICADO">Danificado / Descartado</option>
              </select>
            </div>
          </div>

          <div id="batch-alert" className="p-3 bg-blue-50 text-[11px] text-blue-800 rounded-lg flex items-start space-x-1.5 border border-blue-100">
            <Server size={14} className="shrink-0 mt-0.5" />
            <span>
              <strong>Ação em Lote:</strong> Isso pegará a quantidade informada de botijões que estão no status origem e fará a readequação de status, além de sincronizar de forma automatizada o estoque atual no catálogo de produtos.
            </span>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsLoteOpen(false)} className="py-1.5 px-3 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="py-1.5 px-5 bg-brand-green text-white rounded-lg text-xs font-medium hover:bg-opacity-90">Executar Transferência</button>
          </div>
        </form>
      )}

      {/* Distribuição por marcas */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-3xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Inventário Por Marca de Vasilhames</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(marcasCount).map(([marca, count]) => (
            <div key={marca} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-center flex-1 min-w-[120px]">
              <div className="text-[10px] text-gray-400 font-medium">{marca}</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{count as number} <span className="text-[10px] font-normal text-gray-400">unid</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Vasilhames */}
      <div id="cylinder-acquis-table" className="bg-white rounded-xl border border-gray-100 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-taupe font-medium">Lendo registros de botijões de gás...</div>
        ) : vasilhames.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Flame size={32} className="mx-auto text-gray-300" />
            <p className="text-xs mt-2">Nenhum cilindro patrimonial indexado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5 font-semibold">Código ID Ativo</th>
                  <th className="py-3 px-4 font-semibold">Tamanho / Tipo</th>
                  <th className="py-3 px-3 font-semibold">Marca Estampada</th>
                  <th className="py-3 px-4 font-semibold">Locado / Proprietário</th>
                  <th className="py-3 px-4 font-semibold">Última Escrita</th>
                  <th className="py-3 px-4 font-semibold">Estágio de Carga</th>
                  <th className="py-3 px-5 font-semibold text-right">Rápido Mudar Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {vasilhames.map((v) => {
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-5 font-mono font-bold text-gray-900">{v.id}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-700">{v.tipo} ({v.tipo === 'P13' ? '13 kg Comum' : v.tipo === 'P45' ? '45 kg Industrial' : v.tipo === 'P20' ? '20 kg Empilhadeira' : '5 kg Camping'})</span>
                      </td>
                      <td className="py-4 px-3 font-mono font-medium text-gray-500">{v.marca}</td>
                      <td className="py-4 px-4">
                        {v.status === 'EM_CLIENTE' ? (
                          <div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                              Em Cliente Comodato
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5">ID Cliente: {v.clienteId || 'c1'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No Entreposto Central</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-gray-400">
                        {new Date(v.dataMovimentacao).toLocaleDateString()} {new Date(v.dataMovimentacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          v.status === 'CHEIO_ENTREPOSTO' ? 'bg-emerald-50 text-emerald-800' :
                          v.status === 'VAZIO_ENTREPOSTO' ? 'bg-orange-50 text-orange-850' :
                          v.status === 'EM_CLIENTE' ? 'bg-blue-50 text-blue-700' :
                          'bg-red-50 text-red-700 font-bold'
                        }`}>
                          {v.status === 'CHEIO_ENTREPOSTO' && 'CHEIO (Base)'}
                          {v.status === 'VAZIO_ENTREPOSTO' && 'VAZIO (Base)'}
                          {v.status === 'EM_CLIENTE' && 'NO CLIENTE'}
                          {v.status === 'DANIFICADO' && 'DANIFICADO'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleMudarStatusIndividual(v.id, 'CHEIO_ENTREPOSTO')}
                            disabled={v.status === 'CHEIO_ENTREPOSTO'}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] border border-emerald-100 disabled:opacity-30 disabled:pointer-events-none transition"
                          >
                            Cheio
                          </button>
                          <button
                            onClick={() => handleMudarStatusIndividual(v.id, 'VAZIO_ENTREPOSTO')}
                            disabled={v.status === 'VAZIO_ENTREPOSTO'}
                            className="px-1.5 py-0.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-850 text-[10px] border border-orange-100 disabled:opacity-30 disabled:pointer-events-none transition"
                          >
                            Vazio
                          </button>
                          <button
                            onClick={() => handleMudarStatusIndividual(v.id, 'DANIFICADO')}
                            disabled={v.status === 'DANIFICADO'}
                            className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[10px] border border-red-100 disabled:opacity-30 disabled:pointer-events-none transition"
                          >
                            Reparo
                          </button>
                          <button
                            onClick={() => handleDeleteIndividual(v.id)}
                            className="p-1 rounded bg-gray-50 border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition"
                            title="Baixar Ativo"
                          >
                            ✕
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
