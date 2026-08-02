import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Users, Plus, Search, Edit3, Trash2, Phone, Mail, 
  MapPin, DollarSign, AlertCircle, CheckCircle2, 
  Loader2, X, RefreshCw, AlertTriangle, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { sendDebtNotificationWhatsApp, sendPayoffReceiptWhatsApp } from '../../lib/whatsapp';

interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string;
  nif: string;
  address: string;
  debt_balance: number;
  notes: string;
  created_at?: string;
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states for Customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal states for Debt Payoff / Settlement
  const [payoffCustomer, setPayoffCustomer] = useState<Customer | null>(null);
  const [payoffAmount, setPayoffAmount] = useState('');
  const [submittingPayoff, setSubmittingPayoff] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nif: '',
    address: '',
    debt_balance: '0',
    notes: ''
  });

  // Fetch customers & company from Supabase
  const fetchCustomers = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: compData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (compData) {
        setCompanyInfo(compData);
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setDbError('A tabela "customers" ainda não existe no seu Supabase. Execute a instrução SQL fornecida no plano para ativá-la.');
        } else {
          setDbError(error.message);
        }
      } else {
        setCustomers(data || []);
      }
    } catch (err: any) {
      console.error(err);
      setDbError('Erro de conexão ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle open modal for create
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      nif: '',
      address: '',
      debt_balance: '0',
      notes: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      nif: cust.nif || '',
      address: cust.address || '',
      debt_balance: cust.debt_balance.toString(),
      notes: cust.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save (Create / Edit) Customer
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('O nome do cliente é obrigatório.');
      return;
    }

    const debtNum = parseFloat(formData.debt_balance) || 0;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            nif: formData.nif,
            address: formData.address,
            debt_balance: debtNum,
            notes: formData.notes
          })
          .eq('id', editingCustomer.id)
          .eq('company_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([
            {
              company_id: user.id,
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
              nif: formData.nif,
              address: formData.address,
              debt_balance: debtNum,
              notes: formData.notes
            }
          ]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao salvar cliente no Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  // Settle / Payoff Debt
  const handleSettleDebt = async (e: FormEvent) => {
    e.preventDefault();
    if (!payoffCustomer) return;

    const amountToDeduct = parseFloat(payoffAmount) || 0;
    if (amountToDeduct <= 0) return;

    setSubmittingPayoff(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBalance = Math.max(0, payoffCustomer.debt_balance - amountToDeduct);

      const { error } = await supabase
        .from('customers')
        .update({ debt_balance: newBalance })
        .eq('id', payoffCustomer.id)
        .eq('company_id', user.id);

      if (error) throw error;

      // Optionally send receipt via WhatsApp if phone exists
      if (payoffCustomer.phone) {
        sendPayoffReceiptWhatsApp({
          customerName: payoffCustomer.name,
          customerPhone: payoffCustomer.phone,
          companyName: companyInfo?.company_name || 'Nossa Empresa',
          paidAmount: amountToDeduct,
          remainingBalance: newBalance
        });
      }

      setPayoffCustomer(null);
      setPayoffAmount('');
      fetchCustomers();
    } catch (err: any) {
      alert(`Erro ao abater fiado: ${err.message}`);
    } finally {
      setSubmittingPayoff(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('company_id', user.id);

      if (error) throw error;

      setDeleteConfirmId(null);
      fetchCustomers();
    } catch (err: any) {
      alert(`Erro ao eliminar cliente: ${err.message}`);
    }
  };

  // Filtered list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.nif && c.nif.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // KPIs
  const totalCustomers = customers.length;
  const customersInDebt = customers.filter(c => c.debt_balance > 0).length;
  const totalDebtAmount = customers.reduce((acc, c) => acc + (c.debt_balance || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Clientes & Fiado
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Cadastre a sua carteira de clientes, controle contas correntes e abata dívidas.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* DB Table Alert if Missing */}
      {dbError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Atenção sobre o Banco de Dados</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{dbError}</p>
          </div>
          <button 
            onClick={fetchCustomers}
            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recarregar
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total de Clientes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCustomers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Clientes com Fiado</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{customersInDebt}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Fiado a Receber</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalDebtAmount.toLocaleString('pt-MZ')},00 MT
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou NUIT do cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Customers Table View */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Carregando lista de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum cliente encontrado</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery
                ? 'Nenhum cliente corresponde aos termos da sua pesquisa.'
                : 'Você ainda não cadastrou nenhum cliente na sua empresa.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Cadastrar Primeiro Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Contatos</th>
                  <th className="py-4 px-6">NUIT</th>
                  <th className="py-4 px-6">Saldo Devedor (Fiado)</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredCustomers.map((cust) => {
                  const hasDebt = cust.debt_balance > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                        {cust.address && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span>{cust.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-gray-300">
                        {cust.phone && (
                          <div className="flex items-center gap-1 font-mono text-xs text-slate-700 dark:text-gray-300">
                            <Phone className="w-3 h-3 text-emerald-500" /> {cust.phone}
                          </div>
                        )}
                        {cust.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Mail className="w-3 h-3" /> {cust.email}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {cust.nif || '-'}
                      </td>
                      <td className="py-4 px-6">
                        {hasDebt ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{cust.debt_balance.toLocaleString('pt-MZ')},00 MT</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Regularizado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {hasDebt && (
                            <>
                              <button
                                onClick={() => sendDebtNotificationWhatsApp({
                                  customerName: cust.name,
                                  customerPhone: cust.phone,
                                  companyName: companyInfo?.company_name || 'Nossa Empresa',
                                  companyPhone: companyInfo?.phone || '',
                                  debtAmount: cust.debt_balance
                                })}
                                className="px-3 py-1.5 bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                                title="Enviar mensagem de cobrança por WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                <span>Cobrar WhatsApp</span>
                              </button>

                              <button
                                onClick={() => {
                                  setPayoffCustomer(cust);
                                  setPayoffAmount(cust.debt_balance.toString());
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                                title="Quitar ou abater fiado"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Quitar Fiado</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(cust.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Create / Edit Customer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 my-8"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva ou Empresa ABC"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="84 / 85 / 86 xxxxxx"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      NUIT
                    </label>
                    <input
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      placeholder="NUIT (ex: 123456789)"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@email.com"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Saldo Devedor Inicial (MT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.debt_balance}
                      onChange={(e) => setFormData({ ...formData, debt_balance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Endereço / Localização
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bairro, Rua, Av., Cidade..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas internas sobre o cliente..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingCustomer ? 'Atualizar Cliente' : 'Cadastrar Cliente'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Payoff Debt */}
      <AnimatePresence>
        {payoffCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span>Quitar Fiado / Liquidação</span>
                </h3>
                <button 
                  onClick={() => setPayoffCustomer(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-300">Cliente: {payoffCustomer.name}</p>
                <p className="text-amber-700 dark:text-amber-400 font-semibold">
                  Saldo Devedor Atual: {payoffCustomer.debt_balance.toLocaleString('pt-MZ')},00 MT
                </p>
              </div>

              <form onSubmit={handleSettleDebt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Valor Recebido a Abater (MT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payoffAmount}
                    onChange={(e) => setPayoffAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-extrabold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoffCustomer(null)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayoff || !parseFloat(payoffAmount)}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingPayoff ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Pagamento'}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Cliente?</h3>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita. O cadastro do cliente será removido permanentemente.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCustomer(deleteConfirmId)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors shadow-md shadow-red-500/20 cursor-pointer"
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
