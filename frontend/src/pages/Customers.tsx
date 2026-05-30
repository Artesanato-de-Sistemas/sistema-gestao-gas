import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Client } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Users, Search, Plus, Filter, AlertCircle, Edit, Trash2 } from 'lucide-react';

const mockClients: Client[] = [
  {
    id: '1', person_id: 'p1', payment_deadline_days: 15, active: true, person_type: 'JURIDICA',
    name: 'Restaurante Sabor de Minas', document: '12.345.678/0001-90', phone: '(11) 99999-1234',
    trade_name: 'Sabor de Minas', created_at: '2023-01-10T10:00:00Z',
    isInadimplente: false, revenue: 15000, purchasesCount: 45
  },
  {
    id: '2', person_id: 'p2', payment_deadline_days: 0, active: true, person_type: 'FISICA',
    name: 'João Carlos Silva', document: '123.456.789-00', phone: '(11) 98888-5678',
    created_at: '2023-03-22T14:30:00Z',
    isInadimplente: true, revenue: 350, purchasesCount: 3
  },
  {
    id: '3', person_id: 'p3', payment_deadline_days: 30, active: true, person_type: 'JURIDICA',
    name: 'Padaria Pão Quente', document: '98.765.432/0001-10', phone: '(11) 97777-9012',
    trade_name: 'Pão Quente', created_at: '2023-05-15T08:15:00Z',
    isInadimplente: false, revenue: 32000, purchasesCount: 120
  },
];

export function Customers() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterInadimplente, setFilterInadimplente] = useState('TODOS');
  const [minRevenue, setMinRevenue] = useState('');
  const [minPurchases, setMinPurchases] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    person_type: 'FISICA', active: true, payment_deadline_days: 0
  });

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({ person_type: 'FISICA', active: true, payment_deadline_days: 0, name: '', document: '', phone: '', trade_name: '' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } as Client : c));
    } else {
      const newClient = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        person_id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        isInadimplente: false,
        revenue: 0,
        purchasesCount: 0
      } as Client;
      setClients([...clients, newClient]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.document.includes(search) || (c.trade_name && c.trade_name.toLowerCase().includes(search.toLowerCase()));
    const matchesInadimplente = filterInadimplente === 'TODOS' || (filterInadimplente === 'SIM' && c.isInadimplente) || (filterInadimplente === 'NAO' && !c.isInadimplente);
    const matchesRevenue = !minRevenue || ((c.revenue || 0) >= Number(minRevenue));
    const matchesPurchases = !minPurchases || ((c.purchasesCount || 0) >= Number(minPurchases));
    
    return matchesSearch && matchesInadimplente && matchesRevenue && matchesPurchases;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
             <Users className="w-6 h-6 text-blue-600" />
             Base de Clientes
          </h2>
          <p className="text-slate-500 mt-1">Gerencie os clientes, visualize faturamento e inadimplência.</p>
        </div>
        
        <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-600">Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome, Fantasia ou Documento"
                  className="pl-9 rounded-xl border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full lg:w-48 space-y-2">
              <Label className="text-slate-600">Inadimplentes</Label>
              <Select value={filterInadimplente} onValueChange={setFilterInadimplente}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="SIM">Sim</SelectItem>
                  <SelectItem value="NAO">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-48 space-y-2">
              <Label className="text-slate-600">Receita Mínima (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                className="rounded-xl border-slate-200"
                value={minRevenue}
                onChange={(e) => setMinRevenue(e.target.value)}
              />
            </div>

            <div className="w-full lg:w-48 space-y-2">
              <Label className="text-slate-600">Recorrência Mín. (Qtd)</Label>
              <Input
                type="number"
                placeholder="Ex: 10"
                className="rounded-xl border-slate-200"
                value={minPurchases}
                onChange={(e) => setMinPurchases(e.target.value)}
              />
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
                  <TableHead className="font-semibold text-slate-600 pl-6 h-12">Cliente / Contato</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Tipo</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Financeiro / Recorrência</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 pr-6 h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{client.trade_name || client.name}</p>
                        <p className="text-sm text-slate-500">{client.document} • {client.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="rounded-md border-slate-200 text-slate-600 font-medium">
                        {client.person_type}
                      </Badge>
                      <div className="mt-1 text-xs text-slate-400">Prazo: {client.payment_deadline_days} dias</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-medium text-slate-800">{formatCurrency(client.revenue || 0)}</p>
                      <p className="text-xs text-slate-500">{client.purchasesCount} pedidos</p>
                    </TableCell>
                    <TableCell className="py-4 space-y-1 block">
                      {client.active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-none">Ativo</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 shadow-none">Inativo</Badge>
                      )}
                      
                      {client.isInadimplente && (
                       <Badge className="ml-2 bg-red-50 text-red-700 hover:bg-red-50 border-red-200 shadow-none gap-1">
                         <AlertCircle className="w-3 h-3" />
                         Inadimplente
                       </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(client)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                       Nenhum cliente encontrado com os filtros atuais.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Tipo de Pessoa</Label>
                <Select value={formData.person_type} onValueChange={(val: 'FISICA'|'JURIDICA') => setFormData({...formData, person_type: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="FISICA">Física</SelectItem>
                    <SelectItem value="JURIDICA">Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Documento (CPF/CNPJ)</Label>
                <Input 
                  className="rounded-xl border-slate-200"
                  value={formData.document || ''} 
                  onChange={e => setFormData({...formData, document: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Nome / Razão Social</Label>
              <Input 
                 className="rounded-xl border-slate-200"
                 value={formData.name || ''} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            {formData.person_type === 'JURIDICA' && (
              <div className="space-y-2">
                <Label className="text-slate-600">Nome Fantasia</Label>
                <Input 
                   className="rounded-xl border-slate-200"
                   value={formData.trade_name || ''} 
                   onChange={e => setFormData({...formData, trade_name: e.target.value})} 
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Telefone</Label>
                <Input 
                   className="rounded-xl border-slate-200"
                   value={formData.phone || ''} 
                   onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Prazo de Pagamento (Dias)</Label>
                <Input 
                   type="number"
                   className="rounded-xl border-slate-200"
                   value={formData.payment_deadline_days || 0} 
                   onChange={e => setFormData({...formData, payment_deadline_days: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Status</Label>
              <Select value={formData.active ? 'true' : 'false'} onValueChange={(val) => setFormData({...formData, active: val === 'true'})}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-slate-200">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
