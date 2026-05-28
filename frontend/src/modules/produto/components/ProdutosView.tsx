import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Layers, 
  Archive,
  Save
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { produtoService } from '../services/produto.service';
import { Produto } from '../../../types';

// Validation Schema using Zod
const produtoSchema = z.object({
  nome: z.string().min(3, 'O nome do produto deve ter no mínimo 3 caracteres'),
  tipo: z.enum(['P5', 'P13', 'P20', 'P45']),
  pesoKg: z.number().positive('O peso deve ser maior que zero'),
  precoVenda: z.number().min(1, 'O preço de venda deve ser no mínimo R$ 1,00'),
  estoqueCheio: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  estoqueVazio: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  limiteEstoqueMinimo: z.number().int().min(1, 'Defina um alerta de estoque mínimo de no mínimo 1'),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

export default function ProdutosView() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tipo: 'P13',
      pesoKg: 13,
      precoVenda: 110.00,
      estoqueCheio: 10,
      estoqueVazio: 5,
      limiteEstoqueMinimo: 5,
    }
  });

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const lista = await produtoService.listar();
      setProdutos(lista);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const handleOpenCreateForm = () => {
    reset({
      nome: '',
      tipo: 'P13',
      pesoKg: 13,
      precoVenda: 110.00,
      estoqueCheio: 10,
      estoqueVazio: 5,
      limiteEstoqueMinimo: 5,
    });
    setEditingId(null);
    setIsFormOpen(true);
    setSucessoMsg('');
  };

  const handleEdit = (prod: Produto) => {
    setValue('nome', prod.nome);
    setValue('tipo', prod.tipo);
    setValue('pesoKg', prod.pesoKg);
    setValue('precoVenda', prod.precoVenda);
    setValue('estoqueCheio', prod.estoqueCheio);
    setValue('estoqueVazio', prod.estoqueVazio);
    setValue('limiteEstoqueMinimo', prod.limiteEstoqueMinimo);
    setEditingId(prod.id);
    setIsFormOpen(true);
    setSucessoMsg('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este produto? Isso afetará os cálculos de estoque para esta capacidade.')) return;
    try {
      await produtoService.remover(id);
      setSucessoMsg('Produto removido com sucesso!');
      carregarProdutos();
    } catch (err: any) {
      setErroMsg(err.message || 'Falha ao remover produto.');
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      setErroMsg('');
      if (editingId) {
        await produtoService.atualizar(editingId, data);
        setSucessoMsg('Produto atualizado com sucesso!');
      } else {
        await produtoService.criar(data);
        setSucessoMsg('Novo produto adicionado com sucesso!');
      }
      setIsFormOpen(false);
      reset();
      carregarProdutos();
      // Limpa mensagem de sucesso depois de um tempo
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao salvar o produto');
    }
  };

  // Quick statistics
  const totalCheios = produtos.reduce((acc, p) => acc + p.estoqueCheio, 0);
  const totalVazios = produtos.reduce((acc, p) => acc + p.estoqueVazio, 0);
  const produtosAbaixoMinimo = produtos.filter(p => p.estoqueCheio < p.limiteEstoqueMinimo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-display">Estoque de Produtos (GLP)</h1>
          <p className="text-sm text-gray-500">Cadastro e verificação de saldos físicos de botijões carregados e vazios.</p>
        </div>
        <button
          id="btn-add-produto"
          onClick={handleOpenCreateForm}
          className="inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-opacity-90 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-green/20"
        >
          <Plus size={16} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Notifications */}
      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}
      {erroMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <X size={16} className="text-red-600 shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* Mini KPIs do Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4 shadow-3xs">
          <div className="p-2.5 bg-emerald-50 text-brand-green rounded-lg shrink-0">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Cheio</p>
            <h4 className="text-lg font-bold text-gray-900">{totalCheios} <span className="text-xs font-normal text-gray-400">cilindros</span></h4>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4 shadow-3xs">
          <div className="p-2.5 bg-amber-50 text-brand-taupe rounded-lg shrink-0">
            <Archive size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Vazio (À Espera)</p>
            <h4 className="text-lg font-bold text-gray-900">{totalVazios} <span className="text-xs font-normal text-gray-400">cilindros</span></h4>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4 shadow-3xs">
          <div className={`p-2.5 rounded-lg shrink-0 ${produtosAbaixoMinimo > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Produtos Alerta Mínimo</p>
            <h4 className="text-lg font-bold text-gray-900">
              {produtosAbaixoMinimo} {produtosAbaixoMinimo === 1 ? 'tipo' : 'tipos'}
            </h4>
          </div>
        </div>
      </div>

      {/* Cadastro/Edição Drawer Card */}
      {isFormOpen && (
        <form id="form-produto" onSubmit={handleSubmit(onSubmit)} className="p-5 bg-white rounded-xl border-2 border-brand-green/20 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 font-display">
              {editingId ? 'Editar Detalhes do Produto' : 'Cadastrar Novo Item/Tamanho de Gás'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Nome */}
            <div className="md:col-span-6 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Descrição Comercial</label>
              <input
                {...register('nome')}
                type="text"
                placeholder="Exemplo: Gás Liquefeito P13 Comum"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.nome && <span className="text-[10px] text-red-500 font-semibold">{errors.nome.message}</span>}
            </div>

            {/* Tipo */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Modelo Botijão</label>
              <select
                {...register('tipo')}
                className="p-2 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              >
                <option value="P5">P5 (5 kg)</option>
                <option value="P13">P13 (13 kg)</option>
                <option value="P20">P20 (20 kg)</option>
                <option value="P45">P45 (45 kg)</option>
              </select>
              {errors.tipo && <span className="text-[10px] text-red-500 font-semibold">{errors.tipo.message}</span>}
            </div>

            {/* Peso kg */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Massa Líquida (Kg)</label>
              <input
                {...register('pesoKg', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.pesoKg && <span className="text-[10px] text-red-500 font-semibold">{errors.pesoKg.message}</span>}
            </div>

            {/* Preço de Venda */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Preço de Venda (R$)</label>
              <input
                {...register('precoVenda', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.precoVenda && <span className="text-[10px] text-red-500 font-semibold">{errors.precoVenda.message}</span>}
            </div>

            {/* Estoque Cheio */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Estoque Inicial Cheio</label>
              <input
                {...register('estoqueCheio', { valueAsNumber: true })}
                type="number"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.estoqueCheio && <span className="text-[10px] text-red-500 font-semibold">{errors.estoqueCheio.message}</span>}
            </div>

            {/* Estoque Vazio */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Estoque Inicial Vazio</label>
              <input
                {...register('estoqueVazio', { valueAsNumber: true })}
                type="number"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.estoqueVazio && <span className="text-[10px] text-red-500 font-semibold">{errors.estoqueVazio.message}</span>}
            </div>

            {/* Alerta de Estoque Mínimo */}
            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-600">Limite Alerta Mínimo</label>
              <input
                {...register('limiteEstoqueMinimo', { valueAsNumber: true })}
                type="number"
                className="p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green focus:outline-hidden"
              />
              {errors.limiteEstoqueMinimo && <span className="text-[10px] text-red-500 font-semibold">{errors.limiteEstoqueMinimo.message}</span>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 py-1.5 px-4 bg-brand-green hover:bg-opacity-90 rounded-lg text-xs font-medium text-white transition focus:ring-2 focus:ring-brand-green/20"
            >
              <Save size={13} />
              <span>{isSubmitting ? 'Gravando...' : 'Gravar Produto'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid de Produtos */}
      <div id="product-list" className="bg-white rounded-xl border border-gray-100 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-taupe font-medium">Carregando estoque de cilindros...</div>
        ) : produtos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Package size={32} className="mx-auto text-gray-300" />
            <p className="text-xs">Nenhum produto cadastrado no banco de dados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5 font-semibold">Cilindro / Tamanho</th>
                  <th className="py-3 px-4 font-semibold text-center">Peso Útil</th>
                  <th className="py-3 px-4 font-semibold">Valor Unitário</th>
                  <th className="py-3 px-4 font-semibold text-center">Estoque Cheio</th>
                  <th className="py-3 px-4 font-semibold text-center">Estoque Vazio</th>
                  <th className="py-3 px-4 font-semibold text-center">Capacidade Min.</th>
                  <th className="py-3 px-4 font-semibold text-center">Status Alerta</th>
                  <th className="py-3 px-5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {produtos.map((p) => {
                  const abaixoMin = p.estoqueCheio < p.limiteEstoqueMinimo;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900 font-sans">{p.nome}</div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-mono mt-0.5">
                          <Layers size={10} />
                          <span>Modelo Tipo: {p.tipo}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-medium text-gray-600">{p.pesoKg} Kg</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        R$ {p.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md font-mono font-bold ${abaixoMin ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                          {p.estoqueCheio}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-gray-500 font-semibold">
                        {p.estoqueVazio}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-gray-400">
                        {p.limiteEstoqueMinimo}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {abaixoMin ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                            <AlertTriangle size={10} className="mr-1" />
                            CRÍTICO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            SAUDÁVEL
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1 px-2 border border-gray-200 rounded-md text-gray-500 hover:text-brand-green hover:border-brand-green/35 transition"
                            title="Editar"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 px-2 border border-gray-200 rounded-md text-gray-500 hover:text-red-600 hover:border-red-200 transition"
                            title="Deletar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
