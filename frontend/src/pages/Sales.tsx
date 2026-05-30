import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Order, OrderItem, Client, Product, DeliveryDriver } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { FileText, Search, Plus, Eye, Trash2 } from "lucide-react";

const mockClients: Client[] = [
  {
    id: "c1",
    name: "João Carlos Silva",
    person_id: "p1",
    payment_deadline_days: 0,
    active: true,
    person_type: "FISICA",
    document: "123.456.789-00",
    phone: "(11) 98888-5678",
    created_at: "",
  },
  {
    id: "c2",
    name: "Restaurante Sabor de Minas",
    trade_name: "Sabor de Minas",
    person_id: "p2",
    payment_deadline_days: 15,
    active: true,
    person_type: "JURIDICA",
    document: "12.345.678/0001-90",
    phone: "(11) 99999-1234",
    created_at: "",
  },
];

const mockDrivers: DeliveryDriver[] = [
  { id: "d1", name: "Marcos Antonio" },
  { id: "d2", name: "Pedro Paulo" },
];

const mockProducts: Product[] = [
  {
    id: "prod1",
    name: "Botijão P13 (Cheio)",
    current_price: 115.0,
    active: true,
    stock_quantity: 245,
    updated_at: "",
  },
  {
    id: "prod2",
    name: "Botijão P20 (Cheio)",
    current_price: 180.0,
    active: true,
    stock_quantity: 12,
    updated_at: "",
  },
];

const mockOrders: Order[] = [
  {
    id: "ord1",
    client_id: "c1",
    client_name: "João Carlos Silva",
    delivery_driver_id: "d1",
    driver_name: "Marcos Antonio",
    sale_type: "A VISTA",
    status: "FINALIZADO",
    total_amount: 115.0,
    created_at: "2023-11-20T10:30:00Z",
    items: [
      {
        id: "item1",
        order_id: "ord1",
        product_id: "prod1",
        product_name: "Botijão P13 (Cheio)",
        quantity: 1,
        unit_price: 115.0,
        subtotal: 115.0,
      },
    ],
  },
  {
    id: "ord2",
    client_id: "c2",
    client_name: "Restaurante Sabor de Minas",
    delivery_driver_id: "d2",
    driver_name: "Pedro Paulo",
    sale_type: "A PRAZO",
    due_date: "2023-12-05",
    status: "ABERTO",
    total_amount: 345.0,
    created_at: "2023-11-21T14:45:00Z",
    items: [
      {
        id: "item2",
        order_id: "ord2",
        product_id: "prod1",
        product_name: "Botijão P13 (Cheio)",
        quantity: 3,
        unit_price: 115.0,
        subtotal: 345.0,
      },
    ],
  },
];

export function Sales() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState("");

  // Create Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("none");
  const [saleType, setSaleType] = useState("A VISTA");
  const [orderItems, setOrderItems] = useState<
    { product_id: string; quantity: number; unit_price: number }[]
  >([]);

  // View Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Add Item to Order State
  const [selectedProd, setSelectedProd] = useState("");
  const [qty, setQty] = useState("1");

  const handleAddItem = () => {
    if (!selectedProd || !qty) return;
    const prod = mockProducts.find((p) => p.id === selectedProd);
    if (!prod) return;

    const existing = orderItems.find((i) => i.product_id === selectedProd);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.product_id === selectedProd
            ? { ...i, quantity: i.quantity + Number(qty) }
            : i,
        ),
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: selectedProd,
          quantity: Number(qty),
          unit_price: prod.current_price,
        },
      ]);
    }
    setQty("1");
    setSelectedProd("");
  };

  const handleRemoveItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleCreateOrder = () => {
    if (!selectedClient || orderItems.length === 0) return;

    const client = mockClients.find((c) => c.id === selectedClient);
    const driver =
      selectedDriver === "none"
        ? undefined
        : mockDrivers.find((d) => d.id === selectedDriver);

    let total = 0;
    const fullItems: OrderItem[] = orderItems.map((item, idx) => {
      const p = mockProducts.find((pd) => pd.id === item.product_id);
      const subtotal = item.quantity * item.unit_price;
      total += subtotal;
      return {
        id: `new_item_${idx}`,
        order_id: "temp",
        product_id: item.product_id,
        product_name: p?.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal,
      };
    });

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      client_id: selectedClient,
      client_name: client?.trade_name || client?.name,
      delivery_driver_id: driver?.id,
      driver_name: driver?.name,
      sale_type: saleType,
      status: saleType === "A PRAZO" ? "ABERTO" : "FINALIZADO",
      total_amount: total,
      created_at: new Date().toISOString(),
      items: fullItems,
    };

    setOrders([newOrder, ...orders]);
    setIsNewOrderOpen(false);
    setOrderItems([]);
    setSelectedClient("");
    setSelectedDriver("none");
    setSaleType("A VISTA");
  };

  const filteredOrders = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    return (
      (o.client_name?.toLowerCase() || "").includes(searchLower) ||
      (o.driver_name?.toLowerCase() || "").includes(searchLower) ||
      o.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Vendas e Pedidos
          </h2>
          <p className="text-slate-500 mt-1">
            Gerencie ordens de serviço, vendas rápidas e entregas.
          </p>
        </div>

        <Button
          onClick={() => setIsNewOrderOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex-1 space-y-2 max-w-md">
            <Label className="text-slate-600">Buscar Vendas</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cliente, ID ou Entregador"
                className="pl-9 rounded-xl border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead className="font-semibold text-slate-600 pl-6 h-12">
                    ID / Data
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">
                    Cliente
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12">
                    Entregador
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12 text-right">
                    Valor
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 h-12 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 pr-6 h-12">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-700 font-medium">
                      {order.client_name || "-"}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 text-sm">
                      {order.driver_name || (
                        <span className="text-slate-400 italic">Retirada</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <p className="font-bold text-slate-800">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.sale_type}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {order.status === "FINALIZADO" && (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none border-none">
                          Finalizado
                        </Badge>
                      )}
                      {order.status === "ABERTO" && (
                        <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50 shadow-none border-none">
                          Aberto (Fiado)
                        </Badge>
                      )}
                      {order.status === "CANCELADO" && (
                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 shadow-none border-none">
                          Cancelado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingOrder(order)}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-slate-500"
                    >
                      Nenhuma venda encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Order Modal */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">
              Nova Venda / Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Cliente *</Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {mockClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.trade_name || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Entregador</Label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Balcão / Retirada" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Retirada (Balcão)</SelectItem>
                    {mockDrivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Tipo de Venda</Label>
              <Select value={saleType} onValueChange={setSaleType}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="A VISTA">À Vista</SelectItem>
                  <SelectItem value="A PRAZO">À Prazo / Fiado</SelectItem>
                  <SelectItem value="CARTAO">Cartão / Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <h4 className="font-semibold text-slate-700">Itens do Pedido</h4>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-slate-600 text-xs">Produto</Label>
                  <Select value={selectedProd} onValueChange={setSelectedProd}>
                    <SelectTrigger className="rounded-lg border-slate-200 bg-white">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {mockProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.current_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-slate-600 text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="rounded-lg bg-white"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProd}
                  className="bg-slate-800 text-white rounded-lg px-3"
                >
                  Add
                </Button>
              </div>

              {orderItems.length > 0 && (
                <div className="mt-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="h-8 py-1">Item</TableHead>
                        <TableHead className="h-8 py-1 text-center">
                          Qtd
                        </TableHead>
                        <TableHead className="h-8 py-1 text-right">
                          Subtotal
                        </TableHead>
                        <TableHead className="h-8 py-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, idx) => {
                        const p = mockProducts.find(
                          (x) => x.id === item.product_id,
                        );
                        return (
                          <TableRow
                            key={idx}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <TableCell className="py-2 text-sm text-slate-700">
                              {p?.name}
                            </TableCell>
                            <TableCell className="py-2 text-sm text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="py-2 text-sm text-right font-medium">
                              {formatCurrency(item.quantity * item.unit_price)}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <span className="text-sm text-slate-500">
                    Total do Pedido:{" "}
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {formatCurrency(
                      orderItems.reduce(
                        (acc, item) => acc + item.quantity * item.unit_price,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewOrderOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!selectedClient || orderItems.length === 0}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              Concluir Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewingOrder}
        onOpenChange={(open) => !open && setViewingOrder(null)}
      >
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">
              Detalhes do Pedido
            </DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Cliente</p>
                  <p className="font-semibold text-slate-800">
                    {viewingOrder.client_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Data</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(viewingOrder.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Modo</p>
                  <p className="font-medium text-slate-700">
                    {viewingOrder.sale_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Entregador</p>
                  <p className="font-medium text-slate-700">
                    {viewingOrder.driver_name || "Retirada"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Itens</p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  {viewingOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0"
                    >
                      <span className="text-sm text-slate-700">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <p className="text-slate-600 font-medium">Total Geral</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(viewingOrder.total_amount)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingOrder(null)}
              className="rounded-xl border-slate-200 w-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
