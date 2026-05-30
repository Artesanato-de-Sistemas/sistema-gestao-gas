import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InboundItem, InboundPayload } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Truck, Plus, Check, ListChecks } from 'lucide-react';

export function Inbounds() {
  const [truckPlate, setTruckPlate] = useState('');
  const [invoice, setInvoice] = useState('');
  
  const [type, setType] = useState<InboundItem['type']>('P13');
  const [condition, setCondition] = useState<InboundItem['condition']>('NOVO');
  const [status, setStatus] = useState<InboundItem['status']>('OK');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  const [items, setItems] = useState<InboundItem[]>([]);

  const handleAddMore = () => {
    if (!quantity || !unitPrice) {
        alert("Preencha quantidade e valor unitário.");
        return;
    }
    
    const newItem: InboundItem = {
      type,
      condition,
      status,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
    };
    
    setItems([...items, newItem]);
    
    // Clear product fields
    setQuantity('');
    setUnitPrice('');
    setType('P13');
    setCondition('NOVO');
    setStatus('OK');
  };

  const handleFinalizar = () => {
    if (!truckPlate || !invoice) {
        alert("Placa e Nota Fiscal são obrigatórios para finalizar.");
        return;
    }
    if (items.length === 0) {
        alert("Adicione pelo menos um item.");
        return;
    }
    
    const payload: InboundPayload = {
      truckPlate,
      invoice,
      items,
    };
    
    console.log('Sending payload:', payload);
    alert('Entrada cadastrada com sucesso!');
    
    // Clear all
    setTruckPlate('');
    setInvoice('');
    setItems([]);
  };

  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Registro de Entrada
        </h2>
        <p className="text-slate-500 mt-1">Cadastre o recebimento de botijões e defina suas condições.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800">Dados da Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="truckPlate" className="text-slate-600">Placa do Caminhão</Label>
                <Input
                    id="truckPlate"
                    className="rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    placeholder="AAA-0000"
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value.toUpperCase())}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="invoice" className="text-slate-600">Nota Fiscal (NF)</Label>
                <Input
                    id="invoice"
                    className="rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    placeholder="Número da NF"
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                />
                </div>
            </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg text-slate-800">Adicionar Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-slate-600">Tipo de Produto</Label>
                        <Select value={type} onValueChange={(val: any) => setType(val)}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="P13">Botijão P13</SelectItem>
                            <SelectItem value="P20">Botijão P20</SelectItem>
                            <SelectItem value="P45">Cilindro P45</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-600">Condição</Label>
                        <Select value={condition} onValueChange={(val: any) => setCondition(val)}>
                        <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="NOVO">Novo</SelectItem>
                            <SelectItem value="USADO">Usado</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-600">Status</Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="DEFEITUOSO">Defeituoso</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-slate-600">Quantidade</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            className="rounded-xl border-slate-200"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unitPrice" className="text-slate-600">Valor Unitário (R$)</Label>
                        <Input
                            id="unitPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            className="rounded-xl border-slate-200"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button 
                   onClick={handleAddMore} 
                   variant="outline"
                   className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                   disabled={!quantity || !unitPrice}
                >
                    <Plus className="w-4 h-4" />
                    Adicionar à lista
                </Button>
            </CardFooter>
            </Card>
        </div>

        <div>
            <Card className="h-full flex flex-col border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800 flex items-center justify-between">
                        <span>Resumo da Carga</span>
                        <ListChecks className="w-4 h-4 text-slate-400" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {items.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center">
                            <ListChecks className="w-10 h-10 mb-3 text-slate-200" />
                            Nenhum item adicionado.<br />
                            Preencha o formulário e clique em "Adicionar à lista".
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <li key={idx} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-700">{item.quantity}x {item.type}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {item.condition} • {item.status}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-800">{formatCurrency(item.quantity * item.unitPrice)}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(item.unitPrice)}/un</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 p-5 border-t border-slate-100 bg-white">
                    <div className="flex justify-between w-full text-sm mt-2">
                        <span className="text-slate-500">Total de Itens</span>
                        <span className="font-medium text-slate-700">{totalItems} und</span>
                    </div>
                    <div className="flex justify-between w-full text-base border-t border-slate-100 pt-3">
                        <span className="text-slate-600 font-medium">Valor Total</span>
                        <span className="font-bold text-slate-900">{formatCurrency(totalValue)}</span>
                    </div>
                    <Button 
                        onClick={handleFinalizar} 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 mt-4 shadow-sm"
                        disabled={items.length === 0 || !truckPlate || !invoice}
                    >
                        <Check className="w-4 h-4" />
                        Finalizar Entrada
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
