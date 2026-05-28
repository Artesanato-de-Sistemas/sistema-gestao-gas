import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  User, 
  Trash2, 
  Check, 
  Truck, 
  Plus, 
  X, 
  DollarSign, 
  RefreshCw, 
  PackageMinus, 
  Layers,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { pedidoService } from '../services/pedido.service';
import { clienteService } from '../../cliente/services/cliente.service';
import { produtoService } from '../../produto/services/produto.service';
import { Pedido, Cliente, Produto, ItemPedido, StatusPedido } from '../../../types';

export default function PedidosView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tab State
  const [activeTab, setActiveTab] = useState<StatusPedido | 'TODOS'>('TODOS');

  // Order Creator form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [cartItens, setCartItens] = useState<ItemPedido[]>([]);
  const [formaPagto, setFormaPagto] = useState<Pedido['formaPagamento']>('PIX');
  
  // Auxiliary item inputs
  const [selectedProdId, setSelectedProdId] = useState('');
  const [inputQtd, setInputQtd] = useState<number>(1);
  const [inputTroca, setInputTroca] = useState<boolean>(true);

  // Escalação de entregador modal/state
  const [dispatchOrderId, setDispatchOrderId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('Marcos Almeida (Caminhão 01)');

  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const carregarDadosForm = async () => {
    try {
      setLoading(true);
      const [listPeds, listClis, listProds] = await Promise.all([
        pedidoService.listar(),
        clienteService.listar(),
        produtoService.listar(),
      ]);
      setPedidos(listPeds);
      setClientes(listClis);
      setProdutos(listProds);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao carregar dados operacionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosForm();
  }, []);

  // Adicionar item ao carrinho de compra
  const handleAddItemToCart = () => {
    if (!selectedProdId) {
      setErroMsg('Selecione um gás do catálogo!');
      return;
    }
    const targetProd = produtos.find(p => p.id === selectedProdId);
    if (!targetProd) return;

    // Verificar se já está no carrinho
    const checkExisIdx = cartItens.findIndex(item => item.produtoId === selectedProdId);
    if (checkExisIdx !== -1) {
      const updated = [...cartItens];
      updated[checkExisIdx].quantidade += inputQtd;
      setCartItens(updated);
    } else {
      setCartItens([
        ...cartItens,
        {
          produtoId: targetProd.id,
          produtoNome: targetProd.nome,
          quantidade: inputQtd,
          valorUnitario: targetProd.precoVenda,
          trocaVasilhame: inputTroca
        }
      ]);
    }
    // Limpar mensagens
    setErroMsg('');
    setSelectedProdId('');
    setInputQtd(1);
    setInputTroca(true);
  };

  const handleRemoveItemFromCart = (prodId: string) => {
    setCartItens(cartItens.filter(item => item.produtoId !== prodId));
  };

  // Calcular total do carrinho
  const cartTotal = cartItens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);

  // Gravar o pedido
  const handleSavePedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');
    if (!selectedClienteId) {
      setErroMsg('Por favor, informe a comarca/ficha do cliente!');
      return;
    }
    if (cartItens.length === 0) {
      setErroMsg('Adicione no mínimo um produto/botijão ao pedido!');
      return;
    }

    const targetCli = clientes.find(c => c.id === selectedClienteId);
    if (!targetCli) return;

    try {
      await pedidoService.criar({
        clienteId: targetCli.id,
        clienteNome: targetCli.nome,
        itens: cartItens,
        formaPagamento: formaPagto,
        valorTotal: cartTotal,
      });

      setSucessoMsg('Pedido de Gás criado com sucesso! Status: PENDENTE.');
      setIsFormOpen(false);
      setSelectedClienteId('');
      setCartItens([]);
      carregarDadosForm();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao registrar pedido.');
    }
  };

  // Despachar pedido (Mudar para EM_ROTA)
  const handleDispatchOrder = async () => {
    if (!dispatchOrderId) return;
    try {
      await pedidoService.atualizar(dispatchOrderId, {
        status: 'EM_ROTA',
        entregador: driverName,
      });
      setSucessoMsg(`Pedido despachado! Encarregado: ${driverName}.`);
      setDispatchOrderId(null);
      carregarDadosForm();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao despachar entrega.');
    }
  };

  // Concluir / Finalizar Entrega (Mudar para ENTREGUE)
  const handleDeliverOrder = async (id: string, deliveryPerson?: string) => {
    try {
      await pedidoService.atualizar(id, {
        status: 'ENTREGUE',
        entregador: deliveryPerson || 'Motorista Padrão',
      });
      setSucessoMsg(`Entrega do pedido ${id} efetuada! Estoques baixados e saldo financeiro gerado.`);
      carregarDadosForm();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao consolidar entrega.');
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!window.confirm('Deseja realmente cancelar este pedido de gás?')) return;
    try {
      await pedidoService.atualizar(id, { status: 'CANCELADO' });
      setSucessoMsg(`Pedido ${id} cancelado com sucesso.`);
      carregarDadosForm();
      setTimeout(() => setSucessoMsg(''), 3000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao cancelar o pedido');
    }
  };

  // Filter orders by active status tab
  const filteredPedidos = pedidos.filter(p => {
    if (activeTab === 'TODOS') return true;
    return p.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Pedidos e Logística</h1>
          <p className="text-sm text-gray-500">Abertura de ordens de vendas e monitoramento de cargas em rota de entrega.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all"
        >
          <ShoppingBag size={16} />
          <span>Novo Pedido (Venda)</span>
        </button>
      </div>

      {/* Declarative Notification Banner */}
      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* FORM DE CRIAR PEDIDO */}
      {isFormOpen && (
        <form onSubmit={handleSavePedido} className="p-5 bg-white border-2 border-brand-green/20 rounded-xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 font-display">Digitação de Novo Pedido</h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Cliente */}
            <div className="md:col-span-6 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Ficha do Cliente *</label>
              <select
                value={selectedClienteId}
                onChange={e => setSelectedClienteId(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              >
                <option value="">-- Selecione o Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.endereco.bairro})</option>
                ))}
              </select>
            </div>

            {/* Forma Pagamento */}
            <div className="md:col-span-6 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Forma de Pagamento Base</label>
              <select
                value={formaPagto}
                onChange={e => setFormaPagto(e.target.value as any)}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              >
                <option value="PIX">PIX (Rápido)</option>
                <option value="DINHEIRO">Dinheiro físico</option>
                <option value="DEBITO">Débito Cartão</option>
                <option value="CREDITO">Crédito Cartão</option>
                <option value="FATURADO">Faturado quinzenal (Boleto)</option>
              </select>
            </div>

            {/* SELEÇÃO DO PRODUTO PARA ADICIONAR AO CARRINHO */}
            <div className="md:col-span-12 p-3 bg-gray-50 border border-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              
              {/* Produto */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Escolher Produto Gás</label>
                <select
                  value={selectedProdId}
                  onChange={e => setSelectedProdId(e.target.value)}
                  className="p-2 border border-gray-200 rounded-md text-xs bg-white"
                >
                  <option value="">-- Selecione --</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.estoqueCheio})</option>
                  ))}
                </select>
              </div>

              {/* Quantidade */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={inputQtd}
                  onChange={e => setInputQtd(parseInt(e.target.value) || 1)}
                  className="p-2 border border-gray-200 rounded-md text-xs bg-white text-center focus:outline-hidden"
                />
              </div>

              {/* Troca de vasilhame */}
              <div className="flex items-center space-x-2 py-2 md:py-3.5">
                <input
                  type="checkbox"
                  id="chk-troca-vasilhame"
                  checked={inputTroca}
                  onChange={e => setInputTroca(e.target.checked)}
                  className="w-4 h-4 text-brand-green border-gray-200 rounded-md shrink-0"
                />
                <label htmlFor="chk-troca-vasilhame" className="text-xs text-gray-600 font-medium select-none cursor-pointer">
                  Haverá troca (Devolver vazio)
                </label>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddItemToCart}
                className="w-full inline-flex items-center justify-center space-x-1 py-2 bg-brand-taupe text-white hover:bg-opacity-90 rounded-md text-xs font-semibold"
              >
                <Plus size={14} />
                <span>Adicionar Item</span>
              </button>

            </div>

            {/* GRID DO CARRINHO DE ITENS SELECIONADOS */}
            <div className="md:col-span-12 space-y-2">
              <span className="text-xs font-bold text-gray-700">Ítens inseridos no pedido:</span>
              
              {cartItens.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400">
                  Carrinho de entrega vazio. Adicione botijões acima.
                </div>
              ) : (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-cool-gray-700">
                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-400 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2">Nome do Gás</th>
                        <th className="p-2 text-center">Quantidade</th>
                        <th className="p-2 text-right">Valor Unitário</th>
                        <th className="p-2 text-center">Controle Vasilhame</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cartItens.map(item => (
                        <tr key={item.produtoId} className="bg-white">
                          <td className="p-2 font-medium text-gray-900">{item.produtoNome}</td>
                          <td className="p-2 text-center font-mono font-bold">{item.quantidade}</td>
                          <td className="p-2 text-right">R$ {item.valorUnitario.toFixed(2)}</td>
                          <td className="p-2 text-center">
                            {item.trocaVasilhame ? (
                              <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                                Retornará cilindro vazio
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                                Sem retorno (Debitar comodato)
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right font-semibold font-mono">
                            R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromCart(item.produtoId)}
                              className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded-sm hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-150 space-y-2 sm:space-y-0">
            <div className="flex items-baseline space-x-1">
              <span className="text-xs text-gray-400">Total do Pedido:</span>
              <span className="text-lg font-bold text-gray-900 font-sans">
                R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="py-1.5 px-3 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
              <button type="submit" className="py-1.5 px-5 bg-brand-green text-white rounded-lg text-xs font-semibold hover:bg-opacity-90 transition">Avançar e Emitir</button>
            </div>
          </div>
        </form>
      )}

      {/* DISPATCH/DRIVER ASSIGNMENT INLINE SELECTION BOX */}
      {dispatchOrderId && (
        <div className="p-4 bg-brand-cream/30 border-2 border-brand-taupe/40 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center pb-1">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center">
              <Truck size={14} className="mr-1.5 text-brand-taupe" />
              Escalar Entregador para o Pedido {dispatchOrderId}
            </h4>
            <button onClick={() => setDispatchOrderId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col space-y-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-gray-500">Selecione o Entregador / Motorista de Veículo</label>
              <select
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="p-2 border border-gray-200 bg-white rounded-lg text-xs text-gray-800"
              >
                <option value="Marcos Almeida (Caminhão 01)">Marcos Almeida (Caminhão Mercedes 01)</option>
                <option value="Claudio Motoqueiro (Moto-entrega 02)">Claudio Motoqueiro (Moto-entrega 02)</option>
                <option value="Josias de Souza (Caminhão 02)">Josias de Souza (Caminhão Ford 02)</option>
                <option value="Venda Balcão (Sem veículo)">Venda direta Balcão / Retira</option>
              </select>
            </div>
            <button
              onClick={handleDispatchOrder}
              className="w-full py-2 bg-brand-green text-white text-xs font-bold rounded-lg hover:bg-opacity-90"
            >
              Gravar Saída para Entrega
            </button>
          </div>
        </div>
      )}

      {/* TABS DE FILTRO DE STATUS */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg self-start overflow-x-auto shrink-0 max-w-full">
        {['TODOS', 'PENDENTE', 'PREPARANDO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-white text-gray-900 shadow-2xs font-bold' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ORDER CARDS GRID */}
      {loading ? (
        <div className="text-center py-10 text-xs font-medium text-brand-taupe">Carregando painel de entregas GLP...</div>
      ) : filteredPedidos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-100 text-gray-400 space-y-2">
          <ShoppingBag size={32} className="mx-auto text-gray-300" />
          <p className="text-xs">Nenhum pedido de gás encontrado neste estágio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPedidos.map(pedido => {
            return (
              <div
                key={pedido.id}
                className={`bg-white rounded-xl border border-gray-100 shadow-3xs p-4 flex flex-col justify-between space-y-3 hover:shadow-2xs transition-all duration-300`}
              >
                
                {/* ID e Badge de Status */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <span className="text-xs font-mono font-bold text-gray-950 flex items-center">
                    <ShoppingBag size={12} className="text-brand-green mr-1" />
                    {pedido.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pedido.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    pedido.status === 'PREPARANDO' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    pedido.status === 'EM_ROTA' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                    pedido.status === 'ENTREGUE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {pedido.status}
                  </span>
                </div>

                {/* Nome Cliente */}
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight">{pedido.clienteNome}</h3>
                  <span className="text-[10px] text-gray-400 flex items-center">
                    <MapPin size={10} className="mr-1" />
                    Logística cadastrada na ficha
                  </span>
                </div>

                {/* Lista de botijões */}
                <div className="bg-gray-50/50 p-2.5 rounded-lg space-y-1 border border-gray-100/50">
                  {pedido.itens.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">{it.quantidade}x P{it.produtoNome.split(' ')[2] || '13'}</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {it.trocaVasilhame ? 'C/ Troca' : 'S/ Troca (Comod)'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Detalhes de Entregador / Escalação */}
                {pedido.status === 'EM_ROTA' || pedido.status === 'ENTREGUE' ? (
                  <div className="flex items-center text-[10px] text-gray-500 bg-indigo-50/35 border border-indigo-100/40 p-1.5 rounded-lg">
                    <Truck size={12} className="text-brand-taupe mr-1.5 shrink-0" />
                    <span className="truncate"><strong>Condutor:</strong> {pedido.entregador}</span>
                  </div>
                ) : null}

                {/* Total e Ações Rápidas */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-400">Total</span>
                    <span className="font-bold text-gray-955 text-sm font-sans">
                      R$ {pedido.valorTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* BOTÕES DE TRANSIÇÃO OPERACIONAL */}
                  <div className="flex items-center space-x-1">
                    
                    {pedido.status === 'PENDENTE' && (
                      <button
                        onClick={() => {
                          // Passar para PREPARANDO
                          pedidoService.atualizar(pedido.id, { status: 'PREPARANDO' });
                          carregarDadosForm();
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-800 text-[10px] font-semibold rounded-md border border-blue-200 hover:bg-blue-100"
                      >
                        Engarrafar
                      </button>
                    )}

                    {pedido.status === 'PREPARANDO' && (
                      <button
                        onClick={() => {
                          setDispatchOrderId(pedido.id);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-brand-taupe text-white text-[10px] font-semibold rounded-md hover:bg-opacity-95"
                      >
                        <Truck size={10} className="mr-1" />
                        Despachar
                      </button>
                    )}

                    {pedido.status === 'EM_ROTA' && (
                      <button
                        onClick={() => handleDeliverOrder(pedido.id, pedido.entregador)}
                        className="inline-flex items-center px-2 py-1 bg-brand-green text-white text-[10px] font-semibold rounded-md hover:bg-opacity-95 shadow-2xs"
                      >
                        <Check size={10} className="mr-1" />
                        Concluir
                      </button>
                    )}

                    {pedido.status === 'PENDENTE' || pedido.status === 'PREPARANDO' ? (
                      <button
                        onClick={() => handleCancelOrder(pedido.id)}
                        className="p-1 px-1.5 text-xs text-cool-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"
                        title="Cancelar Venda"
                      >
                        ✕
                      </button>
                    ) : null}

                    {pedido.status === 'ENTREGUE' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800">
                        <FileCheck2 size={10} className="mr-1" /> CONCLUÍDO
                      </span>
                    )}

                    {pedido.status === 'CANCELADO' && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-50 text-gray-400 uppercase">
                        Cancelado
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
