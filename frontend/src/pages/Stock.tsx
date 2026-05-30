import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Product, StockMovement } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Box, Plus, History, ArrowDownToLine, ArrowUpFromLine, Settings2, Search } from 'lucide-react';

const mockProducts: Product[] = [
  { id: '1', name: 'Botijão P13 (Cheio)', current_price: 115.00, active: true, stock_quantity: 245, updated_at: '2023-10-05T14:30:00Z' },
  { id: '2', name: 'Botijão P20 (Cheio)', current_price: 180.00, active: true, stock_quantity: 12, updated_at: '2023-10-06T09:15:00Z' },
  { id: '3', name: 'Cilindro P45 (Cheio)', current_price: 450.00, active: true, stock_quantity: 3, updated_at: '2023-10-02T11:00:00Z' },
  { id: '4', name: 'Casco P13 (Vazio)', current_price: 0, active: true, stock_quantity: 89, updated_at: '2023-10-07T16:45:00Z' },
];

const mockMovements: StockMovement[] = [
  { id: 'm1', product_id: '1', movement_type: 'ENTRADA', quantity: 50, notes: 'Recebimento NF 1234', created_at: '2023-10-07T08:00:00Z' },
  { id: 'm2', product_id: '1', movement_type: 'SAIDA', quantity: 15, notes: 'Vendas do dia', created_at: '2023-10-07T18:00:00Z' },
  { id: 'm3', product_id: '3', movement_type: 'AJUSTE', quantity: -1, notes: 'Produto danificado', created_at: '2023-10-06T14:20:00Z' },
];

export function Stock() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Adjustment Form
  const [adjType, setAdjType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  const openAdjustment = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjType('ENTRADA');
    setAdjQuantity('');
    setAdjNotes('');
    setIsAdjustmentOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (!selectedProduct || !adjQuantity) return;
    
    let diff = Number(adjQuantity);
    if (adjType === 'SAIDA' || (adjType === 'AJUSTE' && diff < 0)) {
        diff = -Math.abs(diff); // ensure negative if it's a reduction
    } else {
        diff = Math.abs(diff);
    }
    
    setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, stock_quantity: p.stock_quantity + diff } : p
    ));
    
    setIsAdjustmentOpen(false);
    alert('Movimentação registrada com sucesso!');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
             <Box className="w-6 h-6 text-blue-600" />
             Controle de Estoque
          </h2>
          <p className="text-slate-500 mt-1">Gerencie saldos, produtos ativos e visualize o histórico de movimentações.</p>
        </div>
        
        <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="text-slate-700 bg-white rounded-xl gap-2 shadow-sm border-slate-200">
          <History className="w-5 h-5" />
          Histórico Global
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-600">Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome do produto"
                  className="pl-9 rounded-xl border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 pl-6 h-12">Produto</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Preço Atual</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Saldo em Estoque</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 pr-6 h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Atualizado em {formatDate(product.updated_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-slate-800">
                      {formatCurrency(product.current_price)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${product.stock_quantity < 10 ? 'text-orange-600' : 'text-slate-800'}`}>
                            {product.stock_quantity}
                        </span>
                        <span className="text-xs text-slate-500">und</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {product.active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-none font-medium">Ativo</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 shadow-none font-medium">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openAdjustment(product)} className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200 rounded-lg">
                          <Settings2 className="w-4 h-4 mr-2" />
                          Ajustar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                       Nenhum produto encontrado.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Ajuste Manual de Estoque</DialogTitle>
            <CardDescription className="pt-2">Lançamento para o produto: <strong className="text-slate-700">{selectedProduct?.name}</strong></CardDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-slate-600">Tipo de Movimentação</Label>
              <Select value={adjType} onValueChange={(val: any) => setAdjType(val)}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ENTRADA">Entrada (+)</SelectItem>
                  <SelectItem value="SAIDA">Saída (-)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste (+ ou -)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Quantidade</Label>
              <Input 
                 type="number"
                 placeholder="Ex: 5"
                 className="rounded-xl border-slate-200"
                 value={adjQuantity} 
                 onChange={e => setAdjQuantity(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-600">Observações (Opcional)</Label>
              <Input 
                 placeholder="Motivo do ajuste..."
                 className="rounded-xl border-slate-200"
                 value={adjNotes} 
                 onChange={e => setAdjNotes(e.target.value)} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentOpen(false)} className="rounded-xl border-slate-200">
              Cancelar
            </Button>
            <Button onClick={handleSaveAdjustment} disabled={!adjQuantity || isNaN(Number(adjQuantity))} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 pb-4">
            <DialogTitle className="text-xl text-slate-800">Histórico Recente de Movimentações</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow className="border-slate-100">
                  <TableHead className="font-semibold text-slate-600 h-10">Data</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-10">Tipo</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-10 text-right">Qtd</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-10">Obs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMovements.map((mov) => {
                  const p = products.find(prod => prod.id === mov.product_id);
                  return (
                    <TableRow key={mov.id} className="border-slate-100">
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {formatDate(mov.created_at)}
                      </TableCell>
                      <TableCell>
                        {mov.movement_type === 'ENTRADA' && <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 shadow-none border-none"><ArrowDownToLine className="w-3 h-3 mr-1"/> Entrada</Badge>}
                        {mov.movement_type === 'SAIDA' && <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50 shadow-none border-none"><ArrowUpFromLine className="w-3 h-3 mr-1"/> Saída</Badge>}
                        {mov.movement_type === 'AJUSTE' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 shadow-none border-none">Ajuste</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-800 text-sm">
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        <div className="font-medium text-slate-700 text-xs mb-0.5">{p?.name}</div>
                        {mov.notes}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
