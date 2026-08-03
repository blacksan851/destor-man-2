import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Smartphone, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Search, Filter, CheckCircle2, ShieldCheck, Download,
  Wallet, DollarSign, Loader2, X, AlertCircle, Plus, Minus, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface WalletItem {
  id: string;
  receipt_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  type: 'in' | 'out';
  description: string;
  created_at: string;
}

export function Wallets() {
  const [transactions, setTransactions] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<'Todas' | 'M-Pesa' | 'e-Mola' | 'Banco'>('Todas');
  const [typeFilter, setTypeFilter] = useState<'Todas' | 'Entradas' | 'Saídas'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Manual Movement (Entrada / Saída)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [selectedWallet, setSelectedWallet] = useState<'M-Pesa' | 'e-Mola' | 'Banco'>('M-Pesa');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Fetch Mobile Money & Bank Transactions & Movements from Supabase
  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Sales from `sales` (Entradas de vendas POS com M-Pesa, e-Mola ou Banco)
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('company_id', user.id)
        .in('payment_method', ['M-Pesa', 'e-Mola', 'Banco'])
        .order('created_at', { ascending: false });

      const salesList: WalletItem[] = (salesData || []).map((s: any) => ({
        id: s.id,
        receipt_number: s.receipt_number,
        customer_name: s.customer_name || 'Venda POS',
        total_amount: s.total_amount,
        payment_method: s.payment_method,
        type: 'in',
        description: `Venda POS (${s.receipt_number})`,
        created_at: s.created_at
      }));

      // 2. Fetch Manual Movements (Entradas/Saídas) from `wallet_movements`
      const { data: moveData } = await supabase
        .from('wallet_movements')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      const moveList: WalletItem[] = (moveData || []).map((m: any) => ({
        id: m.id,
        receipt_number: m.movement_type === 'in' ? 'ENTRADA' : 'SAÍDA',
        customer_name: m.description || (m.movement_type === 'in' ? 'Depósito Manual' : 'Despesa/Pagamento'),
        total_amount: m.amount,
        payment_method: m.wallet_type,
        type: m.movement_type,
        description: m.description,
        created_at: m.created_at
      }));

      // 3. Fetch Expenses paid via M-Pesa, e-Mola or Banco from `expenses`
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', user.id)
        .in('payment_method', ['M-Pesa', 'e-Mola', 'Banco']);

      const expList: WalletItem[] = (expData || []).map((e: any) => ({
        id: `exp-${e.id}`,
        receipt_number: 'DESPESA',
        customer_name: e.description || e.category,
        total_amount: e.amount,
        payment_method: e.payment_method,
        type: 'out',
        description: `Despesa: ${e.category} - ${e.description}`,
        created_at: e.expense_date || e.created_at || new Date().toISOString()
      }));

      // Combine and deduplicate if movement was recorded
      const combined = [...salesList, ...moveList, ...expList].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(combined);
    } catch (err) {
      console.error('Erro ao carregar transações de carteiras móveis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Save Manual Movement (Entrada / Saída)
  const handleSubmitMovement = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(movementAmount) || 0;
    if (val <= 0) return;

    setSubmittingMovement(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('wallet_movements')
        .insert([
          {
            company_id: user.id,
            wallet_type: selectedWallet,
            movement_type: movementType,
            amount: val,
            description: movementDescription.trim() || (movementType === 'in' ? 'Entrada de Capital' : 'Despesa de Carteira')
          }
        ]);

      if (error) {
        if (error.code === '42P01') {
          alert('Para registrar saídas/despesas de carteira, crie a tabela "wallet_movements" no Supabase executando o script SQL.');
        } else {
          throw error;
        }
      }

      setIsMovementModalOpen(false);
      setMovementAmount('');
      setMovementDescription('');
      fetchWalletData();
    } catch (err: any) {
      alert(`Erro ao salvar movimento: ${err.message}`);
    } finally {
      setSubmittingMovement(false);
    }
  };

  // Filtered List
  const filteredTransactions = transactions.filter(t => {
    const matchesProvider = providerFilter === 'Todas' || t.payment_method === providerFilter;
    const matchesType = typeFilter === 'Todas' || (typeFilter === 'Entradas' ? t.type === 'in' : t.type === 'out');
    const matchesSearch = t.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProvider && matchesType && matchesSearch;
  });

  // Calculate Net Balances
  const mpesaIn = transactions.filter(t => t.payment_method === 'M-Pesa' && t.type === 'in').reduce((acc, t) => acc + t.total_amount, 0);
  const mpesaOut = transactions.filter(t => t.payment_method === 'M-Pesa' && t.type === 'out').reduce((acc, t) => acc + t.total_amount, 0);
  const mpesaNet = mpesaIn - mpesaOut;

  const emolaIn = transactions.filter(t => t.payment_method === 'e-Mola' && t.type === 'in').reduce((acc, t) => acc + t.total_amount, 0);
  const emolaOut = transactions.filter(t => t.payment_method === 'e-Mola' && t.type === 'out').reduce((acc, t) => acc + t.total_amount, 0);
  const emolaNet = emolaIn - emolaOut;

  const bankIn = transactions.filter(t => t.payment_method === 'Banco' && t.type === 'in').reduce((acc, t) => acc + t.total_amount, 0);
  const bankOut = transactions.filter(t => t.payment_method === 'Banco' && t.type === 'out').reduce((acc, t) => acc + t.total_amount, 0);
  const bankNet = bankIn - bankOut;

  const grandTotalMobile = mpesaNet + emolaNet + bankNet;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Carteiras & Contas Bancárias (M-Pesa, e-Mola & Banco)
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Controle de entradas e saídas efetuadas através de carteiras móveis e transferências bancárias.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchWalletData}
            className="px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          
          <button
            onClick={() => {
              setMovementType('out');
              setIsMovementModalOpen(true);
            }}
            className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>Registrar Saída / Despesa</span>
          </button>

          <button
            onClick={() => {
              setMovementType('in');
              setIsMovementModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* M-Pesa Business Card */}
        <div className="bg-[#0F172A] text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-xl border border-gray-800">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-500/40">
                M
              </div>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                M-Pesa
              </span>
            </div>

            <div>
              <p className="text-[11px] text-white/60 font-medium">Saldo M-Pesa</p>
              <p className="text-2xl font-black tracking-tight mt-0.5">
                {mpesaNet.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-white/60">MT</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-white/60 font-bold">
            <span className="text-emerald-400">+{mpesaIn.toLocaleString('pt-MZ')} MT</span>
            <span className="text-red-400">-{mpesaOut.toLocaleString('pt-MZ')} MT</span>
          </div>
        </div>

        {/* e-Mola Empresa Card */}
        <div className="bg-[#0B1120] border border-gray-800 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-xl">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-serif font-black italic text-lg shadow-lg shadow-orange-500/40">
                e
              </div>
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                e-Mola
              </span>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 font-medium">Saldo e-Mola</p>
              <p className="text-2xl font-black tracking-tight text-white mt-0.5">
                {emolaNet.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-gray-400">MT</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span className="text-emerald-400">+{emolaIn.toLocaleString('pt-MZ')} MT</span>
            <span className="text-red-400">-{emolaOut.toLocaleString('pt-MZ')} MT</span>
          </div>
        </div>

        {/* Banco / Conta Bancaria Card */}
        <div className="bg-[#0B1120] border border-gray-800 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-xl">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/40">
                B
              </div>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Banco
              </span>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 font-medium">Saldo Bancário</p>
              <p className="text-2xl font-black tracking-tight text-white mt-0.5">
                {bankNet.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-gray-400">MT</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span className="text-emerald-400">+{bankIn.toLocaleString('pt-MZ')} MT</span>
            <span className="text-red-400">-{bankOut.toLocaleString('pt-MZ')} MT</span>
          </div>
        </div>

        {/* Grand Total Mobile & Bank Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-xl">
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-white shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                Total Digital
              </span>
            </div>

            <div>
              <p className="text-[11px] text-white/80 font-medium">Total em Carteiras & Banco</p>
              <p className="text-2xl font-black tracking-tight mt-0.5">
                {grandTotalMobile.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-white/80">MT</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 pt-2 border-t border-white/20 flex justify-between items-center text-xs text-white/80 font-bold">
            <span>Saldo Líquido Acumulado</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#0B1120] p-4 rounded-2xl border border-gray-800 shadow-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-2 bg-[#0F172A] p-1 rounded-xl border border-gray-800">
          {(['Todas', 'M-Pesa', 'e-Mola', 'Banco'] as const).map(provider => (
            <button
              key={provider}
              onClick={() => setProviderFilter(provider)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                providerFilter === provider
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {provider}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-800 my-auto mx-1"></div>
          {(['Todas', 'Entradas', 'Saídas'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-gray-800 rounded-xl text-xs outline-none text-white font-medium placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-[#0B1120] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0B1120]">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <span>Extrato de Entradas e Saídas das Carteiras Móveis</span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 bg-[#0F172A]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Carregando extrato das carteiras móveis...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-[#0F172A]">
            <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-white">Nenhuma transação encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Realize vendas no POS ou registre saídas manuais para exibir aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0F172A] text-[11px] font-black text-gray-300 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6">Carteira</th>
                  <th className="py-3.5 px-6">Descrição / Origem</th>
                  <th className="py-3.5 px-6">Data & Hora</th>
                  <th className="py-3.5 px-6 text-right">Valor em MT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-[#0F172A] text-xs">
                {filteredTransactions.map((tx) => {
                  const isMpesa = tx.payment_method === 'M-Pesa';
                  const isIn = tx.type === 'in';

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          isIn 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' 
                            : 'bg-red-50 text-red-600 dark:bg-red-900/30'
                        }`}>
                          {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          <span>{isIn ? 'Entrada' : 'Saída'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          isMpesa 
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 border border-red-100 dark:border-red-900/40' 
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-900/40'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isMpesa ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-gray-200">
                        {tx.description}
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {new Date(tx.created_at).toLocaleString('pt-MZ')}
                      </td>
                      <td className={`py-4 px-6 text-right font-black text-sm ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIn ? '+' : '-'}{tx.total_amount.toLocaleString('pt-MZ')},00 MT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Manual Movement (Entrada / Saída) */}
      <AnimatePresence>
        {isMovementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {movementType === 'in' ? 'Registrar Entrada de Carteira' : 'Registrar Saída / Despesa'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsMovementModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Carteira / Conta</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWallet('M-Pesa')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                        selectedWallet === 'M-Pesa'
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>M-Pesa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWallet('e-Mola')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                        selectedWallet === 'e-Mola'
                          ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span>e-Mola</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWallet('Banco')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                        selectedWallet === 'Banco'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Banco</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Valor da {movementType === 'in' ? 'Entrada' : 'Saída'} (MT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição / Motivo</label>
                  <input
                    type="text"
                    value={movementDescription}
                    onChange={(e) => setMovementDescription(e.target.value)}
                    placeholder={movementType === 'in' ? 'Ex: Depósito para troco ou reforço' : 'Ex: Pagamento a fornecedor, energia, transporte...'}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMovementModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMovement || !parseFloat(movementAmount)}
                    className={`flex-1 py-2.5 font-bold text-white rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      movementType === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {submittingMovement ? <Loader2 className="w-4 h-4 animate-spin" /> : (movementType === 'in' ? 'Salvar Entrada' : 'Salvar Saída')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
