import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users as UsersIcon, Plus, Search, ShieldCheck, Key, 
  UserCheck, UserX, Edit3, Trash2, Mail, Phone, 
  Loader2, X, RefreshCw, AlertTriangle, Lock, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface CompanyUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'gerente' | 'caixa';
  status: 'ativo' | 'inativo';
  created_at?: string;
}

export function Users() {
  const { companyPlan, onOpenUpgradeModal } = useOutletContext<{ companyPlan?: string; onOpenUpgradeModal?: () => void }>() || {};
  const isBasePlan = companyPlan === 'Base';

  const [usersList, setUsersList] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'caixa' as 'admin' | 'gerente' | 'caixa',
    status: 'ativo' as 'ativo' | 'inativo'
  });

  // Fetch Users from Supabase
  const fetchCompanyUsers = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setDbError('A tabela "company_users" ainda não existe no seu Supabase. Execute a instrução SQL fornecida no plano para ativá-la.');
        } else {
          setDbError(error.message);
        }
      } else {
        setUsersList(data || []);
      }
    } catch (err: any) {
      console.error(err);
      setDbError('Erro ao carregar utilizadores da equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBasePlan) {
      fetchCompanyUsers();
    }
  }, [isBasePlan]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'caixa',
      status: 'ativo'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: CompanyUser) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      status: u.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit User Form
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nome e Email são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      if (editingUser) {
        const { error } = await supabase
          .from('company_users')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            status: formData.status
          })
          .eq('id', editingUser.id)
          .eq('company_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_users')
          .insert([
            {
              company_id: user.id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              status: formData.status
            }
          ]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCompanyUsers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao guardar utilizador.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', id)
        .eq('company_id', user.id);

      if (error) throw error;

      setDeleteConfirmId(null);
      fetchCompanyUsers();
    } catch (err: any) {
      alert(`Erro ao eliminar utilizador: ${err.message}`);
    }
  };

  // Filtered List
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  // KPIs
  const totalUsers = usersList.length;
  const adminCount = usersList.filter(u => u.role === 'admin' || u.role === 'gerente').length;
  const cashierCount = usersList.filter(u => u.role === 'caixa').length;

  // If user is on Base Plan, show Lock Banner
  if (isBasePlan) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-800 text-center space-y-6 relative overflow-hidden">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" /> Recurso Exclusivo do Plano Premium
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Gestão de Utilizadores & Permissões
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua empresa está atualmente no <strong className="text-white">Plano Base (300 MT/mês)</strong>. Faça upgrade para o <strong className="text-amber-400">Plano Premium (500 MT/mês)</strong> para cadastrar múltiplos operadores de caixa, gerentes e gerenciar permissões de acesso.
            </p>
          </div>

          <div className="pt-4 max-w-md mx-auto">
            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>DESBLOQUEAR PLANO PREMIUM (500 MT)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Utilizadores & Permissões
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Cadastre operadores de caixa, gerentes e controle permissões de acesso ao sistema.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Utilizador</span>
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
            onClick={fetchCompanyUsers}
            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recarregar
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Equipe Cadastrada</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admins & Gerentes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Operadores de Caixa</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{cashierCount}</p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Explanatory Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-gray-800 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-extrabold tracking-tight">Matriz de Permissões de Acesso no Dr Gestor MZ</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Administrador</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Acesso irrestrito a todas as funcionalidades do sistema, relatórios financeiros, gestão de equipe, carteiras móveis e assinatura.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>Gerente de Loja</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Acesso ao Ponto de Venda (POS), cadastro de produtos e estoque, gestão de clientes/fiado e relatórios operacionais.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Operador de Caixa</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Acesso focado e exclusivo para registrar vendas no **POS (Frente de Caixa)**, bipar códigos de barras e emitir recibos aos clientes.
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
            placeholder="Buscar operador por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Carregando membros da equipe...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum utilizador encontrado</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery
                ? 'Nenhum membro corresponde aos termos da pesquisa.'
                : 'Você ainda não cadastrou nenhum operador de caixa ou gerente na sua empresa.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Cadastrar Primeiro Utilizador
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Nome / Utilizador</th>
                  <th className="py-4 px-6">Contato</th>
                  <th className="py-4 px-6">Cargo / Perfil</th>
                  <th className="py-4 px-6">Status da Conta</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isGerente = u.role === 'gerente';
                  const isActive = u.status === 'ativo';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-700 dark:text-gray-300">
                          <Mail className="w-3 h-3 text-emerald-500" /> {u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Phone className="w-3 h-3" /> {u.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-xs ${
                          isAdmin 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                            : isGerente
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {isAdmin ? 'Administrador' : isGerente ? 'Gerente de Loja' : 'Operador de Caixa'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Editar utilizador"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar utilizador"
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

      {/* Modal: Create / Edit User */}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingUser ? 'Editar Utilizador' : 'Cadastrar Novo Utilizador'}
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
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carlos Caixa ou Ana Gerente"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="operador@empresa.co.mz"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="84 / 85 / 86 xxxxxx"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Perfil / Cargo</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="caixa">Operador de Caixa (Apenas Frente de Caixa POS)</option>
                    <option value="gerente">Gerente de Loja (POS, Produtos, Clientes, Relatórios)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
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
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingUser ? 'Salvar Alterações' : 'Cadastrar Membro')}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remover Utilizador?</h3>
              <p className="text-sm text-gray-500">
                Esta ação removerá o acesso do membro da equipe.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirmId)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Remover
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
