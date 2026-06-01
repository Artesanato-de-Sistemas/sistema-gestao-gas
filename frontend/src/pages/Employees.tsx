import { useState } from "react";
import { Button, Card, Input, Select, Table, Tag, Modal, Space, Typography, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Employee } from "@/types";
import { Users, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Marcos Antonio",
    document: "111.222.333-44",
    phone: "(11) 97777-1111",
    role: "ENTREGADOR",
    active: true,
    created_at: "2023-11-20T10:00:00Z",
  },
  {
    id: "2",
    name: "Pedro Paulo",
    document: "555.666.777-88",
    phone: "(11) 98888-2222",
    role: "ENTREGADOR",
    active: true,
    created_at: "2023-11-21T11:00:00Z",
  },
  {
    id: "3",
    name: "Ana Souza",
    document: "999.888.777-66",
    phone: "(11) 99999-3333",
    role: "SECRETARIO",
    active: true,
    email: "ana@imperiodogas.com.br",
    created_at: "2023-11-15T09:30:00Z",
  },
];

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState("");

  // Registration Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"ENTREGADOR" | "SECRETARIO">("ENTREGADOR");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);

  const handleOpenForm = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setName(employee.name);
      setDocument(employee.document);
      setPhone(employee.phone);
      setRole(employee.role);
      setEmail(employee.email || "");
      setActive(employee.active);
    } else {
      setEditingId(null);
      setName("");
      setDocument("");
      setPhone("");
      setRole("ENTREGADOR");
      setEmail("");
      setActive(true);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!name || !document) return;

    if (editingId) {
      setEmployees(
        employees.map((e) =>
          e.id === editingId
            ? { ...e, name, document, phone, role, email, active }
            : e,
        ),
      );
    } else {
      const newEmployee: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        document,
        phone,
        role,
        email,
        active,
        created_at: new Date().toISOString(),
      };
      setEmployees([newEmployee, ...employees]);
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmployees(
      employees.map((e) => (e.id === id ? { ...e, active: false } : e)),
    );
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.document.includes(search) ||
      e.role.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnsType<Employee> = [
    {
      title: 'Colaborador',
      key: 'name',
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-800 m-0">{record.name}</p>
          <p className="text-xs text-slate-500 m-0">CPF: {record.document}</p>
        </div>
      )
    },
    {
      title: 'Cargo',
      key: 'role',
      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {record.role === "ENTREGADOR" ? "Entregador" : "Secretário"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Desde {formatDate(record.created_at).split(" ")[0]}
          </div>
        </div>
      )
    },
    {
      title: 'Contatos',
      key: 'contacts',
      render: (_, record) => (
        <div>
          <div className="text-sm text-slate-700">{record.phone || "-"}</div>
          {record.email && (
            <div className="text-xs text-slate-500 mt-1">{record.email}</div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record) => (
        record.active ? (
          <Tag color="success">Ativo</Tag>
        ) : (
          <Tag>Inativo</Tag>
        )
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<Edit2 className="w-4 h-4 text-slate-400" />} onClick={() => handleOpenForm(record)} />
          {record.active && (
            <Popconfirm title="Tem certeza que deseja inativar este colaborador?" onConfirm={() => handleDelete(record.id)} okText="Sim" cancelText="Não">
              <Button type="text" icon={<Trash2 className="w-4 h-4 text-red-500" />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0">
            <Users className="w-6 h-6 text-orange-500" />
            Gestão de Pessoas
          </h2>
          <p className="text-slate-500 mt-1 mb-0">
            Cadastre e gerencie os colaboradores (Entregadores e Secretários).
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenForm()}
          className="rounded-lg h-10 px-4 shadow-sm text-base font-medium flex items-center"
        >
          Novo Colaborador
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100 p-2" styles={{ body: { padding: '16px' } }}>
        <div className="flex-1 space-y-2 max-w-md">
          <label className="text-slate-600 block">Buscar Colaborador</label>
          <Input
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Nome, CPF ou Cargo"
            className="rounded-lg h-10 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-2xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="id"
          pagination={false}
          className="w-full"
        />
      </Card>

      <Modal
        title={editingId ? "Editar Colaborador" : "Novo Colaborador"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsOpen(false)} className="rounded-full h-10 px-6 font-medium text-slate-600 border-none bg-slate-100 hover:bg-slate-200">
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            disabled={!name || !document} 
            onClick={handleSave} 
            className="rounded-full h-10 px-6 font-medium"
          >
            {editingId ? "Salvar Edição" : "Cadastrar Colaborador"}
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="grid gap-5 py-4 mt-2 mb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col col-span-2 sm:col-span-1">
              <label className="text-slate-800 font-medium text-base">Cargo *</label>
              <Select 
                value={role} 
                onChange={setRole}
                className="w-full h-10"
                options={[
                  { value: 'ENTREGADOR', label: 'Entregador' },
                  { value: 'SECRETARIO', label: 'Secretário' }
                ]}
              />
            </div>

            <div className="space-y-1.5 flex flex-col col-span-2 sm:col-span-1">
              <label className="text-slate-800 font-medium text-base">Status</label>
              <Select
                value={active}
                onChange={setActive}
                className="w-full h-10"
                options={[
                  { value: true, label: 'Ativo' },
                  { value: false, label: 'Inativo' }
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-slate-800 font-medium text-base">Nome Completo *</label>
            <Input
              placeholder="Nome do colaborador"
              className="h-10 border-slate-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">CPF *</label>
              <Input
                placeholder="000.000.000-00"
                className="h-10 border-slate-300"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">Telefone</label>
              <Input
                placeholder="(11) 90000-0000"
                className="h-10 border-slate-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {role === "SECRETARIO" && (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-slate-800 font-medium text-base">E-mail para Login</label>
              <Input
                placeholder="email@imperiodogas.com.br"
                type="email"
                className="h-10 border-slate-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-slate-500 m-0">
                Secretários podem ter acesso ao sistema de gestão, usando este
                e-mail para acesso.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
