import { useState, useEffect } from "react";
import { Button, Card, Input, Select, Table, Tag, Modal, Space, Typography, message, DatePicker, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { FileText, Search, Plus, Eye, Trash2, DollarSign } from "lucide-react";
import { api } from "@/services/api";
import dayjs from "dayjs";

const { Text, Title } = Typography;

// Tipos atualizados
interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  delivery_driver_id?: string;
  driver_name?: string;
  date: string;
  unit_cost: number;
  quantity: number;
  payment_form: string;
  payment_received: number;
  total_amount: number;
  product: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface Client {
  id: string;
  name: string;
  trade_name?: string;
}

interface DeliveryDriver {
  id: string;
  name: string;
}

export function Sales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, clientsRes, driversRes] = await Promise.all([
        api.get('/orders'),
        api.get('/clients'),
        api.get('/drivers')
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
      setDrivers(driversRes.data);
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
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("P13 - Gas");
  const [unitCost, setUnitCost] = useState<number>(94.50);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentForm, setPaymentForm] = useState("DINHEIRO");
  const [saleDate, setSaleDate] = useState(dayjs());

  // View Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Opções de produtos (fixas por enquanto, podem vir do backend depois)
  const productOptions = [
    { value: "P13 - Gas", label: "P13 - Gás", defaultPrice: 94.50 },
    { value: "P20 - Gas", label: "P20 - Gás", defaultPrice: 145.00 },
    { value: "P45 - Gas", label: "P45 - Gás", defaultPrice: 375.00 },
  ];

  // Opções de pagamento
  const paymentOptions = [
    { value: "DINHEIRO", label: "Dinheiro" },
    { value: "PIX", label: "PIX" },
    { value: "CREDITO", label: "Cartão de Crédito" },
    { value: "DEBITO", label: "Cartão de Débito" },
    { value: "A PRAZO (VENDA)", label: "A Prazo (Fiado)" },
  ];

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      message.warning("Selecione um cliente");
      return;
    }

    if (!quantity || quantity <= 0) {
      message.warning("Quantidade deve ser maior que 0");
      return;
    }

    const totalAmount = unitCost * quantity;
    const paymentReceived = paymentForm === "A PRAZO (VENDA)" ? 0 : totalAmount;

    const payload = {
      client_id: selectedClient,
      delivery_driver_id: selectedDriver || null,
      date: saleDate.format('YYYY-MM-DD'),
      product: selectedProduct,
      unit_cost: unitCost,
      quantity: quantity,
      payment_form: paymentForm,
      payment_received: paymentReceived,
      total_amount: totalAmount,
    };

    try {
      await api.post('/orders', payload);
      message.success('Venda concluída com sucesso!');
      setIsNewOrderOpen(false);
      setSelectedClient("");
      setSelectedDriver("");
      setSelectedProduct("P13 - Gas");
      setUnitCost(94.50);
      setQuantity(1);
      setPaymentForm("DINHEIRO");
      setSaleDate(dayjs());
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
      o.product?.toLowerCase().includes(searchLower) ||
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
            {formatDate(record.date || record.created_at)}
          </p>
        </div>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "client_name",
      key: "client_name",
      render: (client_name) => (
        <span className="font-medium text-slate-700">{client_name || "-"}</span>
      ),
    },
    {
      title: "Produto",
      dataIndex: "product",
      key: "product",
      render: (product) => (
        <span className="text-slate-700">{product || "-"}</span>
      ),
    },
    {
      title: "Qtd",
      dataIndex: "quantity",
      key: "quantity",
      align: 'center',
      render: (quantity) => (
        <span className="font-medium text-slate-700">{quantity}</span>
      ),
    },
    {
      title: "Valor Unit.",
      dataIndex: "unit_cost",
      key: "unit_cost",
      align: 'right',
      render: (unit_cost) => (
        <span className="text-slate-600">{formatCurrency(unit_cost)}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      align: 'right',
      render: (total_amount) => (
        <p className="font-bold text-slate-800 m-0">
          {formatCurrency(total_amount)}
        </p>
      ),
    },
    {
      title: "Pagamento",
      key: "payment",
      render: (_, record) => (
        <div>
          <Tag color={record.payment_form === "A PRAZO (VENDA)" ? "orange" : "green"}>
            {record.payment_form}
          </Tag>
          {record.payment_form === "A PRAZO (VENDA)" && record.payment_received === 0 && (
            <div className="text-xs text-orange-600">
              Aguardando pagamento
            </div>
          )}
          {record.payment_received > 0 && record.payment_received < record.total_amount && (
            <div className="text-xs text-blue-600">
              Recebido: {formatCurrency(record.payment_received)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Entregador",
      dataIndex: "driver_name",
      key: "driver_name",
      render: (driver_name) => driver_name ? (
        <span className="text-slate-600">{driver_name}</span>
      ) : (
        <span className="text-slate-400 italic">Não definido</span>
      ),
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

  // Calcular total do pedido
  const calculateTotal = () => {
    return unitCost * quantity;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <FileText className="w-6 h-6 text-orange-500" />
            Vendas e Pedidos
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Gerencie vendas, pedidos e formas de pagamento.
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
            placeholder="Cliente, Produto, ID ou Entregador"
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
          scroll={{ x: true }}
        />
      </Card>

      {/* New Order Modal */}
      <Modal
        title="Nova Venda"
        open={isNewOrderOpen}
        onCancel={() => setIsNewOrderOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsNewOrderOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!selectedClient || !quantity || quantity <= 0}
            onClick={handleCreateOrder}
            className="rounded-full h-10 px-6 font-medium"
          >
            Concluir Venda
          </Button>,
        ]}
        width={700}
        centered
        className="custom-modal"
      >
        <div className="mt-6 mb-4 px-2 space-y-6">
          {/* Cliente e Entregador */}
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
                showSearch
                optionFilterProp="label"
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.trade_name || c.name,
                }))}
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Entregador
              </label>
              <Select
                value={selectedDriver}
                onChange={setSelectedDriver}
                placeholder="Selecione o entregador"
                className="w-full h-10"
                allowClear
                options={drivers.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
              />
            </div>
          </div>

          {/* Data e Produto */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Data da Venda
              </label>
              <DatePicker
                value={saleDate}
                onChange={(date) => setSaleDate(date || dayjs())}
                className="w-full h-10"
                format="DD/MM/YYYY"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Produto <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedProduct}
                onChange={(value) => {
                  setSelectedProduct(value);
                  const product = productOptions.find(p => p.value === value);
                  if (product) {
                    setUnitCost(product.defaultPrice);
                  }
                }}
                className="w-full h-10"
                options={productOptions}
              />
            </div>
          </div>

          {/* Quantidade e Preço Unitário */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Quantidade <span className="text-red-500">*</span>
              </label>
              <InputNumber
                min={1}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
                className="w-full h-10"
                formatter={value => `${value}`}
                parser={value => Number(value) || 1}
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">
                Preço Unitário (R$)
              </label>
              <InputNumber
                min={0}
                value={unitCost}
                onChange={(value) => setUnitCost(value || 0)}
                className="w-full h-10"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={value => Number(value?.replace(/[^\d]/g, '')) / 100 || 0}
                precision={2}
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-slate-800 font-medium text-base">
              Forma de Pagamento <span className="text-red-500">*</span>
            </label>
            <Select
              value={paymentForm}
              onChange={setPaymentForm}
              className="w-full h-10"
              options={paymentOptions}
            />
            {paymentForm === "A PRAZO (VENDA)" && (
              <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 m-0">
                  ⚠️ Venda a prazo: o pagamento será registrado posteriormente.
                  Valor a receber: {formatCurrency(calculateTotal())}
                </p>
              </div>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-200">
            <div className="text-right">
              <span className="text-base text-slate-800">
                Total do Pedido:{" "}
              </span>
              <span className="text-2xl font-bold text-slate-900 ml-2">
                {formatCurrency(calculateTotal())}
              </span>
              {paymentForm === "A PRAZO (VENDA)" && (
                <div className="text-sm text-orange-600 mt-1">
                  Pagamento pendente
                </div>
              )}
              {paymentForm !== "A PRAZO (VENDA)" && (
                <div className="text-sm text-green-600 mt-1">
                  Pagamento integral: {formatCurrency(calculateTotal())}
                </div>
              )}
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
                  {viewingOrder.client_name || "Não definido"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 m-0">Data</p>
                <p className="font-medium text-slate-800 m-0">
                  {formatDate(viewingOrder.date || viewingOrder.created_at)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 m-0">Produto</p>
                <p className="font-medium text-slate-700 m-0">
                  {viewingOrder.product}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 m-0">Quantidade</p>
                <p className="font-medium text-slate-700 m-0">
                  {viewingOrder.quantity}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 m-0">Pagamento</p>
              <div className="mt-1">
                <Tag color={viewingOrder.payment_form === "A PRAZO (VENDA)" ? "orange" : "green"}>
                  {viewingOrder.payment_form}
                </Tag>
                {viewingOrder.payment_form === "A PRAZO (VENDA)" && (
                  <p className="text-sm text-orange-600 mt-1 m-0">
                    Aguardando pagamento de {formatCurrency(viewingOrder.total_amount)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500 m-0">Valor Unitário</p>
                <p className="font-medium text-slate-700">
                  {formatCurrency(viewingOrder.unit_cost)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 m-0">Total Geral</p>
                <p className="text-xl font-bold text-orange-600 m-0">
                  {formatCurrency(viewingOrder.total_amount)}
                </p>
              </div>
            </div>

            {viewingOrder.driver_name && (
              <div>
                <p className="text-sm text-slate-500 m-0">Entregador</p>
                <p className="font-medium text-slate-700">
                  {viewingOrder.driver_name}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}