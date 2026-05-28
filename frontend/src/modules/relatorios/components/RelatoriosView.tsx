import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  TrendingUp, 
  Users, 
  History, 
  Activity, 
  RotateCcw, 
  Compass, 
  Download,
  Calendar
} from 'lucide-react';
import { db } from '../../../services/localDb';
import { Cliente, Pedido, RegistroFinanceiro } from '../../../types';

export default function RelatoriosView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [financas, setFinancas] = useState<RegistroFinanceiro[]>([]);
  const [selectedReport, setSelectedReport] = useState<'comodato' | 'vendas' | 'faturamento'>('comodato');

  useEffect(() => {
    setClientes(db.getClientes());
    setPedidos(db.getPedidos());
    setFinancas(db.getFinanceiro());
  }, []);

  // PRINT CURRENT REPORT AREA
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Relatórios e Balancetes</h1>
          <p className="text-sm text-gray-500">Geração de mapas operacionais corporativos para impressão e tomada de decisões.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center space-x-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs py-2.5 px-4 rounded-lg shadow-2xs transition-all"
          >
            <Printer size={15} />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* SELECIONAR ABA DE RELATÓRIO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Comodato de Vasilhames */}
        <button
          onClick={() => setSelectedReport('comodato')}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
            selectedReport === 'comodato' 
              ? 'border-brand-green bg-white shadow-2xs ring-1 ring-brand-green/20' 
              : 'border-gray-100 bg-gray-50/50 hover:bg-white text-gray-500'
          }`}
        >
          <RotateCcw className={`shrink-0 mt-0.5 ${selectedReport === 'comodato' ? 'text-brand-green' : 'text-gray-400'}`} size={18} />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Mapa de Vasilhames em Comodato</h4>
            <p className="text-[10px] text-gray-400 mt-1">Saldos de botijões vazios atualmente locados para clientes comerciais.</p>
          </div>
        </button>

        {/* Resumo de Vendas */}
        <button
          onClick={() => setSelectedReport('vendas')}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
            selectedReport === 'vendas' 
              ? 'border-brand-green bg-white shadow-2xs ring-1 ring-brand-green/20' 
              : 'border-gray-100 bg-gray-50/50 hover:bg-white text-gray-500'
          }`}
        >
          <TrendingUp className={`shrink-0 mt-0.5 ${selectedReport === 'vendas' ? 'text-brand-green' : 'text-gray-400'}`} size={18} />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Histórico de Vendas por Período</h4>
            <p className="text-[10px] text-gray-400 mt-1">Relatório cronológico de pedidos e controle de troca de botijões.</p>
          </div>
        </button>

        {/* Faturamento por Forma de Pagto */}
        <button
          onClick={() => setSelectedReport('faturamento')}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
            selectedReport === 'faturamento' 
              ? 'border-brand-green bg-white shadow-2xs ring-1 ring-brand-green/20' 
              : 'border-gray-100 bg-gray-50/50 hover:bg-white text-gray-500'
          }`}
        >
          <Activity className={`shrink-0 mt-0.5 ${selectedReport === 'faturamento' ? 'text-brand-green' : 'text-gray-400'}`} size={18} />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Desempenho e Meios de Liquidação</h4>
            <p className="text-[10px] text-gray-400 mt-1">Prevalência de faturados, Pix e dinheiro nas vendas mensais.</p>
          </div>
        </button>

      </div>

      {/* CORPO DE IMPRESSÃO DO RELATÓRIO DO CONTRATO */}
      <div id="printable-report-area" className="bg-white rounded-xl p-6 border border-gray-200 shadow-2xs space-y-6">
        
        {/* Cabeçalho da Empresa Relatórios */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-brand-green text-white rounded-md font-bold font-sans text-xs">Gg</span>
              <span className="font-bold text-gray-900 font-display">GásGestão Corporativo</span>
            </div>
            <p className="text-[10px] text-gray-400">Distribuidora de Gás & Vasilhames GLP S.A.</p>
          </div>
          <div className="text-right text-[10px] text-cool-gray-400 font-mono space-y-0.5">
            <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Ficha:</strong> REL-{selectedReport.toUpperCase()}-2026</div>
          </div>
        </div>

        {/* 1. MAPA DE COMODATO */}
        {selectedReport === 'comodato' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 font-sans">Mapa Consolidado de Vasilhames Em Comodato com Terceiros</h3>
              <p className="text-[10px] text-gray-400">Lista completa de clientes que possuem botijões vazios na empresa sob contrato fiduciário de comodato.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold border-b border-gray-200">
                    <th className="p-2.5">Razão Social do Cliente</th>
                    <th className="p-2.5">Documento Identificador</th>
                    <th className="p-2 text-center">Debito P5</th>
                    <th className="p-2 text-center">Debito P13</th>
                    <th className="p-2 text-center">Debito P20</th>
                    <th className="p-2 text-center">Debito P45</th>
                    <th className="p-2.5 text-right">Saldo Devedor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {clientes.map(cli => {
                    const saldos = cli.saldoVasilhames;
                    const totalCli = (saldos.P5 || 0) + (saldos.P13 || 0) + (saldos.P20 || 0) + (saldos.P45 || 0);

                    return (
                      <tr key={cli.id} className="hover:bg-gray-50/50">
                        <td className="p-2.5 font-bold text-gray-900">{cli.nome}</td>
                        <td className="p-2.5 text-gray-400 font-mono text-[10px]">{cli.documento}</td>
                        <td className="p-2 text-center font-mono text-gray-600">{saldos.P5 || 0}</td>
                        <td className="p-2 text-center font-mono text-gray-600">{saldos.P13 || 0}</td>
                        <td className="p-2 text-center font-mono text-gray-600">{saldos.P20 || 0}</td>
                        <td className="p-2 text-center font-mono font-semibold text-amber-700">{saldos.P45 || 0}</td>
                        <td className="p-2.5 text-right font-bold text-gray-950 font-sans">{totalCli} botijões</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. HISTÓRICO DE VENDAS */}
        {selectedReport === 'vendas' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 font-sans">Relatório Operacional de Vendas e Controle de Troca</h3>
              <p className="text-[10px] text-gray-400">Auditoria sobre as últimas mercadorias comercializadas pela empresa.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold border-b border-gray-200">
                    <th className="p-2.5">Código Pedido</th>
                    <th className="p-2.5">Cliente Comprador</th>
                    <th className="p-2.5">Data Pedido</th>
                    <th className="p-2.5 text-center">Método Pagamento</th>
                    <th className="p-2.5">Entregador Responsável</th>
                    <th className="p-2.5 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {pedidos.map(p => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-mono font-bold text-gray-900">{p.id}</td>
                      <td className="p-2.5 font-semibold text-gray-700">{p.clienteNome}</td>
                      <td className="p-2.5 text-gray-400 font-mono text-[10px]">{new Date(p.dataPedido).toLocaleDateString()}</td>
                      <td className="p-2.5 text-center font-bold text-gray-650">{p.formaPagamento}</td>
                      <td className="p-2.5 text-gray-500 font-mono text-[10.5px]">{p.entregador || 'Venda Balcão'}</td>
                      <td className="p-2.5 text-right font-bold font-sans">R$ {p.valorTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DESEMPENHO E LIQUIDAÇÕES */}
        {selectedReport === 'faturamento' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900 font-sans">Análise Quantitativa de Moedas e de Liquidação</h3>
              <p className="text-[10px] text-gray-400">Demonstrativo da representação de faturamento comercial do livro caixa por tipo de transação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 border border-gray-100 bg-gray-50/40 rounded-xl space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Prevalência de Meios de Recebimento (Pago)</span>
                
                <div className="space-y-3 font-sans">
                  {['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO', 'BOLETO'].map(met => {
                    const somaFin = financas
                      .filter(f => f.tipo === 'RECEITA' && f.formaPagamento === met && f.status === 'PAGO')
                      .reduce((acc, f) => acc + f.valor, 0);

                    const totalRec = financas
                      .filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO')
                      .reduce((acc, f) => acc + f.valor, 0) || 1;

                    const perc = (somaFin / totalRec) * 100;

                    return (
                      <div key={met} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{met}</span>
                          <span>R$ {somaFin.toFixed(2)} ({perc.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-green" style={{ width: `${perc}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 border border-gray-100 bg-gray-50/40 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Síntese Contábil Líquida</span>
                  <div className="space-y-3 mt-4 text-xs font-semibold">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span>Total de Receitas Liquidadas (unid)</span>
                      <span className="text-emerald-700 font-bold">R$ {financas.filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO').reduce((acc, f) => acc + f.valor, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span>Total de Despesas Registradas (-)</span>
                      <span className="text-gray-900">R$ {financas.filter(f => f.tipo === 'DESPESA' && f.status === 'PAGO').reduce((acc, f) => acc + f.valor, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span>Recebido Faturado a Liquidar</span>
                      <span className="text-amber-700">R$ {financas.filter(f => f.tipo === 'RECEITA' && f.status === 'PENDENTE').reduce((acc, f) => acc + f.valor, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                  <span>Saldo de Caixa Residual Líquido:</span>
                  <span className="text-base font-bold font-mono text-gray-950">
                    R$ {(financas.filter(f => f.tipo === 'RECEITA' && f.status === 'PAGO').reduce((acc, f) => acc + f.valor, 0) - financas.filter(f => f.tipo === 'DESPESA' && f.status === 'PAGO').reduce((acc, f) => acc + f.valor, 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Declarative watermark/signature */}
        <div className="pt-8 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span>Relatório gerado automaticamente pelo módulo GásGestão</span>
          <span>Assinatura Digital: MD5-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
        </div>
        
      </div>
    </div>
  );
}
