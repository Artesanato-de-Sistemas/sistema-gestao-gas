import { useState, useEffect } from "react";
import { Button, Card, Input, Select, Table, Tag, Modal, Space, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Order, OrderItem, Client, Product, DeliveryDriver } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { FileText, Search, Plus, Eye, Trash2 } from "lucide-react";
import { api } from "@/services/api";

const { Text, Title } = Typography;

export function Sales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, clientsRes, driversRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/clients'),
        api.get('/drivers'),
        api.get('/products')
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
      setDrivers(driversRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error(error);
      message.error("Erro ao carregar dados de vendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("none");
  const [saleType, setSaleType] = useState("AVISTA");
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
    const prod = products.find((p) => p.id === selectedProd);
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

  const handleCreateOrder = async () => {
    if (!selectedClient || orderItems.length === 0) return;

    const payload = {
      client_id: selectedClient,
      delivery_driver_id: selectedDriver === "none" ? undefined : selectedDriver,
      sale_type: saleType,
      items: orderItems
    };

    try {
      await api.post('/orders', payload);
      message.success('Venda concluída com sucesso!');
      setIsNewOrderOpen(false);
      setOrderItems([]);
      setSelectedClient("");
      setSelectedDriver("none");
      setSaleType("AVISTA");
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erro ao realizar venda');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    return (
      (o.client_name?.toLowerCase() || "").includes(searchLower) ||
      (o.driver_name?.toLowerCase() || "").includes(searchLower) ||
      o.id.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<Order> = [
    {
      title: "ID / Data",
      key: "id",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-800 m-0">
            #{record.id.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-xs text-slate-500 m-0">
            {formatDate(record.created_at)}
          </p>
        </div>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "client_name",
      key: "client_name",
      render: (client_name) => <span className="font-medium text-slate-700">{client_name || "-"}</span>,
    },
    {
      title: "Entregador",
      dataIndex: "driver_name",
      key: "driver_name",
      render: (driver_name) => driver_name ? (
        <span className="text-slate-600">{driver_name}</span>
      ) : (
        <span className="text-slate-400 italic">Retirada</span>
      ),
    },
    {
      title: "Valor",
      key: "valor",
      align: 'right',
      render: (_, record) => (
        <div>
          <p className="font-bold text-slate-800 m-0">
            {formatCurrency(record.total_amount)}
          </p>
          <p className="text-xs text-slate-500 m-0">{record.sale_type}</p>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: 'center',
      render: (_, record) => {
        if (record.status === "ENTREGUE") return <Tag color="success">Finalizado</Tag>;
        if (record.status === "ABERTO") return <Tag color="warning">Aberto (Fiado)</Tag>;
        if (record.status === "CANCELADO") return <Tag color="error">Cancelado</Tag>;
        return <Tag>{record.status}</Tag>;
      },
    },
    {
      title: "Ações",
      key: "acoes",
      align: 'right',
      render: (_, record) => (
        <Button
          type="text"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => setViewingOrder(record)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <FileText className="w-6 h-6 text-orange-500" />
            Vendas e Pedidos
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Gerencie ordens de serviço, vendas rápidas e entregas.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsNewOrderOpen(true)}
          className="rounded-lg h-10 px-4 flex items-center shadow-sm text-base font-medium"
        >
          Nova Venda
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100 p-2" styles={{ body: { padding: '16px' } }}>
        <div className="flex-1 space-y-2 max-w-md">
          <label className="text-slate-600 block">Buscar Vendas</label>
          <Input
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Cliente, ID ou Entregador"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg h-10 border-slate-200"
          />
        </div>
      </Card>

      <Card className="rounded-2xl shadow-sm border-slate-100" styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="w-full"
        />
      </Card>

      {/* New Order Modal */}
      <Modal
        title="Nova Venda / Pedido"
        open={isNewOrderOpen}
        onCancel={() => setIsNewOrderOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsNewOrderOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!selectedClient || orderItems.length === 0}
            onClick={handleCreateOrder}
            className="rounded-full h-10 px-6 font-medium"
          >
            Concluir Venda
          </Button>,
        ]}
        width={650}
        centered
        className="custom-modal"
      >
        <div className="mt-6 mb-4 px-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Cliente <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Selecione o cliente"
                className="w-full h-10"
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.trade_name || c.name,
                }))}
              />
              <span className="text-xs text-slate-500">Campo obrigatório</span>
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Entregador
              </label>
              <Select
                value={selectedDriver}
                onChange={setSelectedDriver}
                className="w-full h-10"
                options={[
                  { value: "none", label: "Balcão (Sem entregador)" },
                  ...drivers.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="w-1/2 pr-3">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Tipo de Venda
              </label>
              <Select
                value={saleType}
                onChange={setSaleType}
                className="w-full h-10"
                options={[
                  { value: "AVISTA", label: "A Vista" },
                  { value: "FIADO", label: "À Prazo / Fiado" },
                  { value: "CARTAO", label: "Cartão / Pix" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5 flex flex-col">
                <label className="text-slate-800 font-medium text-base">
                  Itens do Pedido
                </label>
                <Select
                  value={selectedProd}
                  onChange={setSelectedProd}
                  placeholder="Pesquisar produto"
                  className="w-full h-10"
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} - ${formatCurrency(p.current_price)}`,
                  }))}
                />
              </div>
              <div className="w-20 space-y-1.5 flex flex-col">
                <label className="text-slate-800 font-medium text-base text-center">
                  Qtd
                </label>
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-10 text-center"
                />
              </div>
              <Button
                type="primary"
                onClick={handleAddItem}
                disabled={!selectedProd}
                className="h-10 px-6 rounded-full font-medium bg-[#595563] hover:bg-[#4a4753] border-none flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {orderItems.length > 0 && (
              <div className="mt-6 space-y-3">
                {orderItems.map((item, idx) => {
                  const p = products.find((x) => x.id === item.product_id);
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-3 border-b border-slate-200"
                    >
                      <span className="text-slate-800 font-medium">
                        {item.quantity}x {p?.name}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-800 font-medium">
                          - {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleRemoveItem(idx)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-6 mt-4 border-t border-slate-200">
              <div className="text-right">
                <span className="text-base text-slate-800">
                  Total do Pedido:{" "}
                </span>
                <span className="text-2xl font-bold text-slate-900 ml-2">
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
      </Modal>

      {/* View Details Dialog */}
      <Modal
        title="Detalhes do Pedido"
        open={!!viewingOrder}
        onCancel={() => setViewingOrder(null)}
        footer={[
          <Button key="close" onClick={() => setViewingOrder(null)} className="w-full h-10 rounded-xl">
            Fechar
          </Button>
        ]}
        width={500}
        centered
      >
        {viewingOrder && (
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 m-0">Cliente</p>
                <p className="font-semibold text-slate-800 m-0">
                  {viewingOrder.client_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 m-0">Data</p>
                <p className="font-medium text-slate-800 m-0">
                  {formatDate(viewingOrder.created_at || new Date().toISOString())}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 m-0">Modo</p>
                <p className="font-medium text-slate-700 m-0">
                  {viewingOrder.sale_type}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 m-0">Entregador</p>
                <p className="font-medium text-slate-700 m-0">
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

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
              <p className="text-slate-600 font-medium m-0">Total Geral</p>
              <p className="text-xl font-bold text-orange-600 m-0">
                {formatCurrency(viewingOrder.total_amount)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
