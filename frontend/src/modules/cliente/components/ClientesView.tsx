import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  MapPin, 
  PhoneCall, 
  FileText, 
  Search, 
  Edit, 
  Trash2, 
  Activity, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clienteService } from '../services/cliente.service';
import { Cliente } from '../../../types';

// Validation Schema using Zod
const clienteSchema = z.object({
  nome: z.string().min(4, 'O nome ou razão social deve ter no mínimo 4 caracteres'),
  documento: z.string().min(11, 'Insira um CPF ou CNPJ válido'),
  telefone: z.string().min(8, 'Telefone inválido'),
  rua: z.string().min(3, 'Nome da rua é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(2, 'Nome do bairro é obrigatório'),
  cidade: z.string().min(2, 'Nome da cidade é obrigatória'),
  saldoP5: z.number().int().min(0, 'Valor não pode ser negativo'),
  saldoP13: z.number().int().min(0, 'Valor não pode ser negativo'),
  saldoP20: z.number().int().min(0, 'Valor não pode ser negativo'),
  saldoP45: z.number().int().min(0, 'Valor não pode ser negativo'),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export default function ClientesView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      documento: '',
      telefone: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'São Paulo',
      saldoP5: 0,
      saldoP13: 0,
      saldoP20: 0,
      saldoP45: 0,
    }
  });

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const lista = await clienteService.listar();
      setClientes(lista);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao carregar banco de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleOpenCreateForm = () => {
    reset({
      nome: '',
      documento: '',
      telefone: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: 'São Paulo',
      saldoP5: 0,
      saldoP13: 0,
      saldoP20: 0,
      saldoP45: 0,
    });
    setEditingId(null);
    setIsFormOpen(true);
    setSucessoMsg('');
  };

  const handleEdit = (cli: Cliente) => {
    setValue('nome', cli.nome);
    setValue('documento', cli.documento);
    setValue('telefone', cli.telefone);
    setValue('rua', cli.endereco.rua);
    setValue('numero', cli.endereco.numero);
    setValue('bairro', cli.endereco.bairro);
    setValue('cidade', cli.endereco.cidade);
    
    // Saldos de vasilhames
    setValue('saldoP5', cli.saldoVasilhames.P5 || 0);
    setValue('saldoP13', cli.saldoVasilhames.P13 || 0);
    setValue('saldoP20', cli.saldoVasilhames.P20 || 0);
    setValue('saldoP45', cli.saldoVasilhames.P45 || 0);

    setEditingId(cli.id);
    setIsFormOpen(true);
    setSucessoMsg('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este cliente? Isso removerá o histórico de vasilhames comodatários vinculados.')) return;
    try {
      await clienteService.remover(id);
      setSucessoMsg('Ficha de cliente removida com sucesso!');
      carregarClientes();
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao remover cliente.');
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      setErroMsg('');
      const payload = {
        nome: data.nome,
        documento: data.documento,
        telefone: data.telefone,
        endereco: {
          rua: data.rua,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
        },
        saldoVasilhames: {
          P5: data.saldoP5,
          P13: data.saldoP13,
          P20: data.saldoP20,
          P45: data.saldoP45,
        }
      };

      if (editingId) {
        await clienteService.atualizar(editingId, payload);
        setSucessoMsg('Assinatura do cliente atualizada com sucesso!');
      } else {
        await clienteService.criar(payload);
        setSucessoMsg('Novo cliente cadastrado com sucesso!');
      }
      setIsFormOpen(false);
      reset();
      carregarClientes();
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao salvar cadastro do cliente.');
    }
  };

  // Filter clients list
  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documento.includes(searchTerm) ||
    c.telefone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Clientes e Saldos de Vasilhames</h1>
          <p className="text-sm text-gray-500">Contabilização de clientes cadastrados, controle de endereços de entrega e saldos em comodato.</p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-green/20"
        >
          <UserPlus size={16} />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Notifications */}
      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-00 rounded-lg text-xs font-medium flex items-center space-x-2">
          <Trash2 size={16} className="text-red-500 shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shrink-0 shadow-3xs max-w-md">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Filtrar por nome, CPF/CNPJ ou telefone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent border-0 focus:outline-hidden text-gray-800 placeholder-gray-400"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-[10px] text-gray-400 border border-gray-100 px-1 rounded-sm">
            Limpar
          </button>
        )}
      </div>

      {/* Customer Form Dropdown */}
      {isFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 bg-white border-2 border-brand-green/20 rounded-xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 font-display">
              {editingId ? 'Editar registro do Cliente' : 'Matricular Novo Cliente'}
            </h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Nome */}
            <div className="md:col-span-6 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Razão Social / Nome Fantasia *</label>
              <input
                {...register('nome')}
                type="text"
                placeholder="Exemplo: Gasolina e Gás LTDA ou Carlos Silva"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.nome && <span className="text-[10px] text-red-500 font-semibold">{errors.nome.message}</span>}
            </div>

            {/* Documento */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">CPF ou CNPJ (Numérico) *</label>
              <input
                {...register('documento')}
                type="text"
                placeholder="Ex: 12.345.678/0001-99"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.documento && <span className="text-[10px] text-red-500 font-semibold">{errors.documento.message}</span>}
            </div>

            {/* Telefone */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Telefone Contato *</label>
              <input
                {...register('telefone')}
                type="text"
                placeholder="Ex: (11) 98765-4321"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.telefone && <span className="text-[10px] text-red-500 font-semibold">{errors.telefone.message}</span>}
            </div>

            {/* Endereço - Rua */}
            <div className="md:col-span-5 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Logradouro / Avenida *</label>
              <input
                {...register('rua')}
                type="text"
                placeholder="Exemplo: Avenida Paulista"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.rua && <span className="text-[10px] text-red-500 font-semibold">{errors.rua.message}</span>}
            </div>

            {/* Endereço - Número */}
            <div className="md:col-span-2 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Número *</label>
              <input
                {...register('numero')}
                type="text"
                placeholder="Ex: 1540"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.numero && <span className="text-[10px] text-red-500 font-semibold">{errors.numero.message}</span>}
            </div>

            {/* Endereço - Bairro */}
            <div className="md:col-span-2 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Bairro *</label>
              <input
                {...register('bairro')}
                type="text"
                placeholder="Ex: Bela Vista"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.bairro && <span className="text-[10px] text-red-500 font-semibold">{errors.bairro.message}</span>}
            </div>

            {/* Endereço - Cidade */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Cidade *</label>
              <input
                {...register('cidade')}
                type="text"
                placeholder="Ex: São Paulo"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.cidade && <span className="text-[10px] text-red-500 font-semibold">{errors.cidade.message}</span>}
            </div>

            {/* SALDO DE VASILHAMES EM POSSE - COMODATOS */}
            <div className="md:col-span-12 p-3.5 bg-gray-50 border border-gray-100 rounded-lg mt-1.5 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 flex items-center">
                <RotateCcw size={12} className="mr-1.5 text-brand-green" />
                Saldo Inicial de Vasilhames Comodatados (Em posse física do cliente)
              </h4>
              <p className="text-[10px] text-gray-400">Insira a quantidade de cilindros vazios ou cheios que este cliente já possui em comodato garantido na empresa.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500">Saldo P5 (unid)</label>
                  <input
                    {...register('saldoP5', { valueAsNumber: true })}
                    type="number"
                    className="p-1.5 border border-gray-200 rounded-md text-xs bg-white text-center focus:ring-1 focus:ring-brand-green focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500">Saldo P13 (unid)</label>
                  <input
                    {...register('saldoP13', { valueAsNumber: true })}
                    type="number"
                    className="p-1.5 border border-gray-200 rounded-md text-xs bg-white text-center focus:ring-1 focus:ring-brand-green focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500">Saldo P20 (unid)</label>
                  <input
                    {...register('saldoP20', { valueAsNumber: true })}
                    type="number"
                    className="p-1.5 border border-gray-200 rounded-md text-xs bg-white text-center focus:ring-1 focus:ring-brand-green focus:outline-hidden"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500">Saldo P45 (unid)</label>
                  <input
                    {...register('saldoP45', { valueAsNumber: true })}
                    type="number"
                    className="p-1.5 border border-gray-200 rounded-md text-xs bg-white text-center focus:ring-1 focus:ring-brand-green focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
            <button type="button" onClick={() => setIsFormOpen(false)} className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition">Cancelar</button>
            <button type="submit" className="py-1.5 px-4 bg-brand-green hover:bg-opacity-90 rounded-lg text-xs font-medium text-white transition">Gravar Ficha</button>
          </div>
        </form>
      )}

      {/* Grid of clients (responsive grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center text-xs text-brand-taupe font-medium py-10">Carregando fichas de cadastro...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-gray-100 text-gray-400">
            <Search size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs">Nenhum cliente atende ao critério de filtro selecionado.</p>
          </div>
        ) : (
          filteredClientes.map(c => {
            const sumSaldo = (c.saldoVasilhames.P5 || 0) + (c.saldoVasilhames.P13 || 0) + (c.saldoVasilhames.P20 || 0) + (c.saldoVasilhames.P45 || 0);

            return (
              <div key={c.id} id={`cliente-${c.id}`} className="bg-white rounded-xl border border-gray-100 p-5 shadow-3xs flex flex-col justify-between space-y-4 hover:border-brand-green/20 transition-all duration-300">
                
                {/* Carrossel do Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      ID: {c.id.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-gray-950 text-sm tracking-tight font-display mt-1">{c.nome}</h3>
                    <p className="text-[10px] text-gray-400 flex items-center">
                      <FileText size={10} className="mr-1 inline" />
                      Documento: {c.documento}
                    </p>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 rounded-md hover:bg-gray-50 text-gray-400 hover:text-brand-green transition"
                      title="Editar Ficha"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-md hover:bg-gray-50 text-gray-400 hover:text-red-500 transition"
                      title="Apagar Ficha"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Dados de Contato e Localização */}
                <div className="space-y-1.5 text-xs text-gray-600 border-t border-b border-gray-50 py-3 font-sans">
                  <p className="flex items-center">
                    <PhoneCall size={12} className="mr-2 text-brand-taupe" />
                    <span>{c.telefone || 'Sem contato'}</span>
                  </p>
                  <p className="flex items-start">
                    <MapPin size={12} className="mr-2 mt-0.5 text-red-400 shrink-0" />
                    <span>{c.endereco.rua}, {c.endereco.numero} - {c.endereco.bairro}, {c.endereco.cidade}</span>
                  </p>
                </div>

                {/* Quadro de Saldos Patrimoniais (Cylinder inventory) */}
                <div className="p-3 bg-brand-cream/20 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                    <span className="flex items-center uppercase tracking-wider">
                      <RotateCcw size={11} className="mr-1.5 text-brand-green" />
                      Cilindros em Custódia
                    </span>
                    <span className={`${sumSaldo > 0 ? 'text-amber-700 bg-amber-50 px-1.5 py-0.2' : 'text-gray-400'} rounded-xs font-mono`}>
                      Soma: {sumSaldo} unid
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-1 rounded border border-gray-100">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">P5</div>
                      <div className={`text-xs font-bold font-mono ${c.saldoVasilhames.P5 > 0 ? 'text-brand-green' : 'text-gray-300'}`}>
                        {c.saldoVasilhames.P5 || 0}
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-gray-100">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">P13</div>
                      <div className={`text-xs font-bold font-mono ${c.saldoVasilhames.P13 > 0 ? 'text-brand-green' : 'text-gray-300'}`}>
                        {c.saldoVasilhames.P13 || 0}
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-gray-100">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">P20</div>
                      <div className={`text-xs font-bold font-mono ${c.saldoVasilhames.P20 > 0 ? 'text-brand-green' : 'text-gray-300'}`}>
                        {c.saldoVasilhames.P20 || 0}
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-gray-100">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">P45</div>
                      <div className={`text-xs font-bold font-mono ${c.saldoVasilhames.P45 > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                        {c.saldoVasilhames.P45 || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicador de Pedidos totais */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span className="flex items-center">
                    <Sparkles size={12} className="mr-1 text-yellow-500 animate-pulse" />
                    <span>Fidelidade operacional</span>
                  </span>
                  <span><strong>{c.totalPedidos || 0}</strong> pedidos realizados</span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
