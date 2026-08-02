import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Loader2, CheckCircle2, ShieldCheck, Zap, Smartphone, 
  Building2, Lock, ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import { PaymentModal } from '../../components/PaymentModal';
import { supabase } from '../../lib/supabase';

export function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Interactive Plan Selection State (Base vs Premium)
  const initialPlan = searchParams.get('plan') === 'premium' ? 'Premium' : 'Base';
  const [selectedPlan, setSelectedPlan] = useState<'Base' | 'Premium'>(initialPlan);
  const planAmount = selectedPlan === 'Premium' ? 500 : 300;

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    nif: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName,
            nif: formData.nif,
            phone: formData.phone,
            plan: selectedPlan
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta de utilizador no Supabase.');
      }

      const userId = authData.user.id;
      setCompanyId(userId);

      // 2. Save company subscription record in public.companies
      const { error: dbError } = await supabase
        .from('companies')
        .insert([
          {
            id: userId,
            company_name: formData.companyName,
            nif: formData.nif,
            phone: formData.phone,
            email: formData.email,
            plan: selectedPlan,
            subscription_status: 'pending',
            subscription_expires_at: null
          }
        ]);

      if (dbError) {
        throw dbError;
      }

      // Proceed to payment modal
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao efetuar o registo da conta.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment confirmed, redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar Header */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center py-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-black text-xl">
            D
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
            Dr Gestor <span className="text-emerald-500">MZ</span>
          </span>
        </Link>

        <Link 
          to="/login"
          className="text-xs font-bold text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>Já tem conta? Fazer Login</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Registration Form Container */}
      <div className="my-auto max-w-2xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800 space-y-8"
        >
          {/* Header Title & Description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Criar Conta Empresarial
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
              Registe a sua empresa em poucos segundos e ative o acesso com pagamento via <span className="font-bold text-red-500">M-Pesa</span> ou <span className="font-bold text-orange-500">e-Mola</span>.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* STEP 1: Interactive Plan Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Escolha o seu Plano de Assinatura</span>
                </label>
                <span className="text-[11px] text-gray-400 font-semibold">Seleção Pessoal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plano Base Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('Base')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
                    selectedPlan === 'Base'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                        Plano Base
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5">Pequenos Negócios</h4>
                    </div>
                    {selectedPlan === 'Base' && (
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">300 MT</span>
                    <span className="text-xs text-gray-400 font-medium"> / mês</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      POS Vendas, Estoque, Clientes e Carteiras Móveis.
                    </p>
                  </div>
                </button>

                {/* Plano Premium Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('Premium')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[120px] ${
                    selectedPlan === 'Premium'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                        <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Plano Premium
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5">Acesso Completo</h4>
                    </div>
                    {selectedPlan === 'Premium' && (
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">500 MT</span>
                    <span className="text-xs text-gray-400 font-medium"> / mês</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Tudo do Base + DRE Financeiro, Lucros e Equipe.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 2: Company & Contact Information */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                <span>Dados da Sua Empresa (Moçambique)</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Nome Comercial da Empresa *
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="Ex: Mercearia Central Lda ou Loja Maputo"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    NUIT (Número de Identificação Tributária) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                    placeholder="123456789"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Telefone para M-Pesa / e-Mola *
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={loading}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="84 / 85 xxxxxx"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Email Corporativo de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="suaempresa@email.co.mz"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Senha Secreta de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Criando Conta e Gerando Cobrança...</span>
                  </>
                ) : (
                  <>
                    <span>CRIAR CONTA E PAGAR VIA PAYSUITE ({planAmount} MT)</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Payment Trust Badges Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Processamento seguro via PaySuite
            </span>
            <span className="flex items-center gap-2">
              <span className="text-red-500 font-bold">M-Pesa</span> • <span className="text-orange-500 font-bold">e-Mola</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer Branding Copyright */}
      <div className="text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} Dr Gestor MZ. Sistema de Gestão Empresarial Moçambicano.
      </div>

      {/* PaySuite Payment Modal Step 2 */}
      <PaymentModal 
        isOpen={step === 2} 
        planName={selectedPlan} 
        planAmount={planAmount}
        onSuccess={handlePaymentSuccess}
        companyId={companyId}
      />
    </div>
  );
}
