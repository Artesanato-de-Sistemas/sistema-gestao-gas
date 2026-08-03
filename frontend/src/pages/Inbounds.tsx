import { useState } from 'react';
import { Card, Input, Button, Select, List, Typography, message } from 'antd';
import { InboundItem, InboundPayload } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { maskPlate, maskNFInput, maskCurrency, parseCurrency } from '@/utils/masks';
import { Truck, Plus, Check, ListChecks } from 'lucide-react';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export function Inbounds() {
  const [truckPlate, setTruckPlate] = useState('');
  const [invoice, setInvoice] = useState('');
  
  const [category, setCategory] = useState<InboundItem['category']>('P13');
  const [quantity, setQuantity] = useState('');
  const [unitCostStr, setUnitCostStr] = useState('');
  
  const [items, setItems] = useState<InboundItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddMore = () => {
    const parsedCost = parseCurrency(unitCostStr);
    if (!quantity || parsedCost <= 0) {
        message.warning("Preencha quantidade e valor unitário válido.");
        return;
    }
    
    const newItem: InboundItem = {
      category,
      quantity: Number(quantity),
      unit_cost: parsedCost,
    };
    
    setItems([...items, newItem]);
    
    // Clear product fields
    setQuantity('');
    setUnitCostStr('');
    setCategory('P13');
  };

  const handleFinalizar = async () => {
    if (!truckPlate || !invoice) {
        message.warning("Placa e Nota Fiscal são obrigatórios para finalizar.");
        return;
    }
    if (items.length === 0) {
        message.warning("Adicione pelo menos um item.");
        return;
    }
    
    const payload: InboundPayload = {
      truckPlate,
      invoice,
      items,
    };
    
    try {
      setLoading(true);
      await api.post('/inbounds', payload);
      message.success('Entrada cadastrada com sucesso!');
      
      // Clear all
      setTruckPlate('');
      setInvoice('');
      setItems([]);
    } catch (error) {
      console.error(error);
      message.error('Erro ao cadastrar entrada');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <Truck className="w-6 h-6 text-orange-500" />
            Registro de Entrada
        </h2>
        <p className="text-slate-500 mt-1 mb-0">Cadastre o recebimento de botijões.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
            <Card title="Dados da Entrega" className="border-slate-100 shadow-sm rounded-2xl">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-slate-600 font-medium">Placa do Caminhão</label>
                        <Input
                            className="h-10 rounded-lg"
                            placeholder="AAA-0000"
                            value={truckPlate}
                            onChange={(e) => setTruckPlate(maskPlate(e.target.value))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-600 font-medium">Nota Fiscal (NF)</label>
                        <Input
                            className="h-10 rounded-lg"
                            placeholder="NF00000000"
                            value={invoice}
                            onChange={(e) => setInvoice(maskNFInput(e.target.value))}
                            onBlur={() => {
                               if (invoice && invoice !== 'NF') {
                                 setInvoice(`NF${invoice.replace(/\D/g, '').padStart(8, '0')}`);
                               }
                            }}
                        />
                    </div>
                </div>
            </Card>

            <Card title="Adicionar Item" className="border-slate-100 shadow-sm rounded-2xl">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-slate-600 font-medium">Tipo/Categoria de Produto</label>
                        <Select 
                            value={category} 
                            onChange={setCategory}
                            className="w-full h-10"
                            options={[
                                { value: 'P13', label: 'Botijão P13 (Cheio)' },
                                { value: 'P20', label: 'Botijão P20 (Cheio)' },
                                { value: 'P45', label: 'Cilindro P45 (Cheio)' },
                                { value: 'CASCO', label: 'Casco P13 (Vazio)' },
                                { value: 'CASCO_P20', label: 'Casco P20 (Vazio)' },
                                { value: 'CASCO_P45', label: 'Casco P45 (Vazio)' }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-slate-600 font-medium">Quantidade</label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Qtd"
                                className="h-10 rounded-lg"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-slate-600 font-medium">Custo Unitário (R$)</label>
                            <Input
                                placeholder="0,00"
                                className="h-10 rounded-lg"
                                value={unitCostStr}
                                onChange={(e) => setUnitCostStr(maskCurrency(e.target.value))}
                            />
                        </div>
                    </div>

                    <Button 
                        onClick={handleAddMore} 
                        className="w-full h-10 rounded-lg mt-2 font-medium"
                        disabled={!quantity || !unitCostStr}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar à lista
                    </Button>
                </div>
            </Card>
        </div>

        <div>
            <Card 
                title={
                    <div className="flex items-center justify-between pointer-events-none">
                        <span>Resumo da Carga</span>
                        <ListChecks className="w-4 h-4 text-slate-400" />
                    </div>
                } 
                className="h-full flex flex-col border-slate-100 shadow-sm rounded-2xl overflow-hidden"
                styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0 } }}
            >
                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center">
                            <ListChecks className="w-10 h-10 mb-3 text-slate-200" />
                            Nenhum item adicionado.<br />
                            Preencha o formulário e clique em "Adicionar à lista".
                        </div>
                    ) : (
                        <List<InboundItem>
                            dataSource={items}
                            className="bg-white"
                            renderItem={(item) => (
                                <List.Item className="px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex justify-between w-full items-center">
                                        <div>
                                            <p className="font-semibold text-slate-700 m-0">{item.quantity}x {item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-800 m-0">{formatCurrency(item.quantity * item.unit_cost)}</p>
                                            <p className="text-xs text-slate-400 mt-1 m-0">{formatCurrency(item.unit_cost)}/un</p>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </div>
                
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    <div className="flex justify-between w-full text-sm mb-3">
                        <span className="text-slate-500">Total de Itens</span>
                        <span className="font-medium text-slate-700">{totalItems} und</span>
                    </div>
                    <div className="flex justify-between w-full text-base mb-5">
                        <span className="text-slate-600 font-medium">Valor Total</span>
                        <span className="font-bold text-slate-900">{formatCurrency(totalValue)}</span>
                    </div>
                    <Button 
                        type="primary"
                        onClick={handleFinalizar} 
                        className="w-full h-11 rounded-lg font-medium text-base shadow-sm"
                        disabled={items.length === 0 || !truckPlate || !invoice || loading}
                        loading={loading}
                        icon={<Check className="w-4 h-4" />}
                    >
                        Finalizar Entrada
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
