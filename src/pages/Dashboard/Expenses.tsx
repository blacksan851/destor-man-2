import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Receipt, Plus, Search, Trash2, DollarSign, Calendar, 
  Zap, Droplet, Home, Users as UsersIcon, Truck, Building,
  Wrench, Loader2, X, RefreshCw, AlertTriangle, ArrowDownRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface ExpenseItem {
  id: string;
  company_id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  status: 'pago' | 'pendente';
  created_at?: string;
}

const EXPENSE_CATEGORIES = [
  { name: 'EDM Credelec', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200' },
  { name: 'FIPAG Água', icon: Droplet, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
  { name: 'Aluguer', icon: Home, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200' },
  { name: 'Salários', icon: UsersIcon, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' },
  { name: 'Transporte', icon: Truck, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
  { name: 'Impostos', icon: Building, color: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200' },
  { name: 'Outros', icon: Wrench, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200' }
];

export function Expenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    category: 'EDM Credelec',
    description: '',
    amount: '',
    payment_method: 'M-Pesa',
    expense_date: new Date().toISOString().slice(0, 10),
    status: 'pago' as 'pago' | 'pendente'
  });

  // Fetch Expenses from Supabase
  const fetchExpenses = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setDbError('A tabela "expenses" ainda não existe no seu Supabase. Execute a instrução SQL fornecida no plano para ativá-la.');
        } else {
          setDbError(error.message);
        }
      } else {
        setExpenses(data || []);
      }
    } catch (err: any) {
      console.error(err);
      setDbError('Erro de conexão ao carregar despesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Open Create Modal
  const handleOpenModal = () => {
    setFormData({
      category: 'EDM Credelec',
      description: '',
      amount: '',
      payment_method: 'M-Pesa',
      expense_date: new Date().toISOString().slice(0, 10),
      status: 'pago'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Expense Form
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(formData.amount) || 0;
    if (!formData.description.trim()) {
      setFormError('A descrição/fornecedor da despesa é obrigatória.');
      return;
    }
    if (numAmount <= 0) {
      setFormError('O valor da despesa deve ser maior que 0 MT.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            company_id: user.id,
            category: formData.category,
            description: formData.description,
            amount: numAmount,
            payment_method: formData.payment_method,
            expense_date: formData.expense_date,
            status: formData.status
          }
        ]);

      if (error) throw error;

      // Se a despesa for paga via M-Pesa ou e-Mola, registra automaticamente a saída nas Carteiras Móveis
      if (formData.payment_method === 'M-Pesa' || formData.payment_method === 'e-Mola') {
        await supabase
          .from('wallet_movements')
          .insert([
            {
              company_id: user.id,
              wallet_type: formData.payment_method,
              movement_type: 'out',
              amount: numAmount,
              description: `Despesa: ${formData.category} - ${formData.description}`
            }
          ]);
      }

      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao registrar despesa no Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('company_id', user.id);

      if (error) throw error;

      setDeleteConfirmId(null);
      fetchExpenses();
    } catch (err: any) {
      alert(`Erro ao eliminar despesa: ${err.message}`);
    }
  };

  // Filtered Expenses List
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || exp.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // KPIs
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const mobileExpenseAmount = expenses
    .filter(e => e.payment_method === 'M-Pesa' || e.payment_method === 'e-Mola')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const cashExpenseAmount = expenses
    .filter(e => e.payment_method === 'Dinheiro')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Despesas & Custos
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Registre gastos operacionais (EDM Credelec, FIPAG Água, Aluguer, Salários) e controle saídas de caixa.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Despesa</span>
        </button>
      </div>

      {/* DB Alert if Table Missing */}
      {dbError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Atenção sobre o Banco de Dados</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{dbError}</p>
          </div>
          <button 
            onClick={fetchExpenses}
            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recarregar
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total de Despesas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalExpenseAmount.toLocaleString('pt-MZ')},00 MT
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pagas via M-Pesa / e-Mola</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mobileExpenseAmount.toLocaleString('pt-MZ')},00 MT
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pagas em Dinheiro (Caixa)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {cashExpenseAmount.toLocaleString('pt-MZ')},00 MT
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar despesa por descrição ou fornecedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 text-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Categoria:
          </span>
          {['Todas', ...EXPENSE_CATEGORIES.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-sm font-medium">Carregando histórico de despesas...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma despesa encontrada</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || selectedCategory !== 'Todas'
                ? 'Nenhuma despesa corresponde aos filtros selecionados.'
                : 'Você ainda não registrou nenhuma saída ou despesa operacional.'}
            </p>
            {!searchQuery && selectedCategory === 'Todas' && (
              <button
                onClick={handleOpenModal}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-colors shadow-md shadow-red-500/20 cursor-pointer"
              >
                Registrar Primeira Despesa
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Descrição / Fornecedor</th>
                  <th className="py-4 px-6">Pagamento</th>
                  <th className="py-4 px-6 text-right">Valor (MT)</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredExpenses.map((exp) => {
                  const catConfig = EXPENSE_CATEGORIES.find(c => c.name === exp.category) || EXPENSE_CATEGORIES[6];
                  const IconComp = catConfig.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(exp.expense_date).toLocaleDateString('pt-MZ')}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${catConfig.color}`}>
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{exp.category}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {exp.description}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-xl font-medium text-xs">
                          {exp.payment_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-red-600 dark:text-red-400">
                        -{exp.amount.toLocaleString('pt-MZ')},00 MT
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar despesa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Expense */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-red-500" />
                  <span>Registrar Nova Despesa</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria de Custo *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-bold"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição / Fornecedor *</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Recarga Credelec Loja Central"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor (MT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Meio de Pagamento</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="e-Mola">e-Mola</option>
                      <option value="Dinheiro">Dinheiro (Caixa)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data da Saída</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Saída'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Delete */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Registro de Despesa?</h3>
              <p className="text-sm text-gray-500">
                Esta ação removerá permanentemente este lançamento.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteExpense(deleteConfirmId)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
