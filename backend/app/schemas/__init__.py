from typing import Optional, List, Literal, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── Products ────────────────────────────────────────────────────────────────
# Tabela: products (criada pela migração)

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    current_price: float = 0.0
    active: bool = True


class ProductCreate(ProductBase):
    stock_quantity: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_price: Optional[float] = None
    active: Optional[bool] = None


class Product(ProductBase):
    id: str
    stock_quantity: int = 0
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Stock Movements ─────────────────────────────────────────────────────────
# Tabela: stock_movements (criada pela migração)

class StockMovementCreate(BaseModel):
    product_id: str
    movement_type: Literal["ENTRADA", "SAIDA", "AJUSTE"]
    quantity: int
    notes: Optional[str] = None


class StockMovement(StockMovementCreate):
    id: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Inbounds ────────────────────────────────────────────────────────────────
# Tabela: inbounds + inbound_items (schema real)

class InboundItemCreate(BaseModel):
    """Item de entrada mapeado ao schema real do banco (inbound_items)."""
    category: Literal["P13", "P20", "P45", "CASCO"]   # = tipo do botijão
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)                      # unitPrice


class InboundItemResponse(InboundItemCreate):
    id: str
    inbound_id: str
    available_quantity: Optional[int] = None
    subtotal: Optional[float] = None

    model_config = {"from_attributes": True}


class InboundCreate(BaseModel):
    """Payload compatível com o frontend (truckPlate, invoice, items)."""
    truckPlate: str = Field(min_length=1)
    invoice: str = Field(min_length=1, alias="invoice")
    items: List[InboundItemCreate] = Field(min_length=1)

    model_config = {"populate_by_name": True}


class InboundResponse(BaseModel):
    id: str
    truck_plate: str
    invoice_number: str
    total_amount: float
    status: str
    created_at: Optional[datetime] = None
    items: List[InboundItemResponse] = []

    model_config = {"from_attributes": True}


# ─── Employees ───────────────────────────────────────────────────────────────
# Tabela: employees (criada pela migração)

class EmployeeBase(BaseModel):
    name: str
    document: Optional[str] = None
    phone: Optional[str] = None
    role: Literal["ENTREGADOR", "SECRETARIO"]
    active: bool = True
    email: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal["ENTREGADOR", "SECRETARIO"]] = None
    active: Optional[bool] = None
    email: Optional[str] = None


class Employee(EmployeeBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Delivery Drivers ────────────────────────────────────────────────────────
# Tabela: delivery_drivers (reestruturada pela migração)

class DriverBase(BaseModel):
    name: str
    document: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: float = 0.0
    active: bool = True


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    commission_percentage: Optional[float] = None
    active: Optional[bool] = None


class Driver(DriverBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Clients ─────────────────────────────────────────────────────────────────
# Tabela: clients (reestruturada pela migração — flat, sem people)

class ClientBase(BaseModel):
    name: str
    document: str
    phone: Optional[str] = None
    email: Optional[str] = None
    person_type: Literal["FISICA", "JURIDICA"] = "FISICA"
    trade_name: Optional[str] = None
    payment_deadline_days: int = 0
    active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    person_type: Optional[Literal["FISICA", "JURIDICA"]] = None
    trade_name: Optional[str] = None
    payment_deadline_days: Optional[int] = None
    active: Optional[bool] = None


class Client(ClientBase):
    id: str
    created_at: Optional[datetime] = None
    # Métricas computadas
    isInadimplente: Optional[bool] = False
    revenue: Optional[float] = 0.0
    purchasesCount: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Orders ──────────────────────────────────────────────────────────────────
# Tabela: orders + order_items (schema real)

class OrderItemCreate(BaseModel):
    product_id: Optional[str] = None        # FK → products (após migração)
    inbound_item_id: Optional[str] = None   # FK → inbound_items (schema atual)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class OrderItem(OrderItemCreate):
    id: str
    order_id: str
    product_name: Optional[str] = None
    subtotal: float

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    client_id: str
    delivery_driver_id: Optional[str] = None
    sale_type: Literal["A VISTA", "A PRAZO", "CARTAO"]
    due_date: Optional[str] = None
    items: List[OrderItemCreate] = Field(min_length=1)


class Order(BaseModel):
    id: str
    client_id: str
    client_name: Optional[str] = None
    delivery_driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    sale_type: str
    status: Literal["ABERTO", "FINALIZADO", "CANCELADO"]
    due_date: Optional[str] = None
    total_amount: float
    created_at: Optional[datetime] = None
    items: Optional[List[OrderItem]] = None

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardMetrics(BaseModel):
    stock_p13: int = 0
    stock_p20: int = 0
    stock_p45: int = 0
    sales_today: float = 0.0
    orders_today: int = 0
    overdue_invoices: int = 0


class DriverFinancialReport(BaseModel):
    driverId: str
    driverName: str
    cylindersSold: int = 0
    grossAmount: float = 0.0
    withdrawals: float = 0.0
    netProfit: float = 0.0
