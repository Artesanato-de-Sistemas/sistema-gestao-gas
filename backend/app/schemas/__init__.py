from typing import Optional, List, Literal
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

class ProductBase(BaseModel):
    name: str
    current_price: float = 0.0
    active: bool = True


class ProductCreate(ProductBase):
    stock_quantity: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    current_price: Optional[float] = None
    active: Optional[bool] = None


class Product(ProductBase):
    id: str
    stock_quantity: int
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Stock Movements ─────────────────────────────────────────────────────────

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

class InboundItem(BaseModel):
    type: Literal["P13", "P20", "P45"]
    condition: Literal["NOVO", "USADO"]
    status: Literal["OK", "DEFEITUOSO"]
    quantity: int = Field(gt=0)
    unitPrice: float = Field(ge=0)


class InboundPayload(BaseModel):
    truckPlate: str = Field(min_length=1)
    invoice: str = Field(min_length=1)
    items: List[InboundItem] = Field(min_length=1)


class InboundResponse(BaseModel):
    id: str
    truckPlate: str
    invoice: str
    total_amount: float
    created_at: Optional[datetime] = None
    items: List[InboundItem]

    model_config = {"from_attributes": True}


# ─── Employees ───────────────────────────────────────────────────────────────

class EmployeeBase(BaseModel):
    name: str
    document: str
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


# ─── Clients ─────────────────────────────────────────────────────────────────

class ClientBase(BaseModel):
    name: str
    document: str
    phone: Optional[str] = None
    person_type: Literal["FISICA", "JURIDICA"]
    trade_name: Optional[str] = None
    payment_deadline_days: int = 0
    active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    person_type: Optional[Literal["FISICA", "JURIDICA"]] = None
    trade_name: Optional[str] = None
    payment_deadline_days: Optional[int] = None
    active: Optional[bool] = None


class Client(ClientBase):
    id: str
    person_id: Optional[str] = None
    created_at: Optional[datetime] = None
    isInadimplente: Optional[bool] = False
    revenue: Optional[float] = 0.0
    purchasesCount: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Orders ──────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: str
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


# ─── Drivers Financial Report ────────────────────────────────────────────────

class DriverFinancialReport(BaseModel):
    driverId: str
    driverName: str
    cylindersSold: int
    grossAmount: float
    withdrawals: float
    netProfit: float
