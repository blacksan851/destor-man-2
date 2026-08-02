import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Loader2, CheckCircle2, ShieldCheck, Zap, Smartphone,
  Building2, Lock, ArrowRight, ArrowLeft, Check, Eye, EyeOff,
  User, Mail, Phone, Hash, Store, Star, Shield
} from 'lucide-react';
import { PaymentModal } from '../../components/PaymentModal';
import { supabase } from '../../lib/supabase';

export function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialPlan = searchParams.get('plan') === 'premium' ? 'Premium' : 'Base';
  const [selectedPlan, setSelectedPlan] = useState<'Base' | 'Premium'>(initialPlan);
  const planAmount = selectedPlan === 'Premium' ? 500 : 300;

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      if (authError) throw authError;

      const userId = authData.user?.id || `user-${Date.now()}`;
      setCompanyId(userId);

      // Attempt to save company details in database
      const { error: dbError } = await supabase
        .from('companies')
        .insert([{
          id: userId,
          company_name: formData.companyName,
          nif: formData.nif,
          phone: formData.phone,
          email: formData.email,
          plan: selectedPlan,
          subscription_status: 'pending',
          subscription_expires_at: null
        }]);

      if (dbError) {
        console.warn('Comp Insert Warning (Ignored to proceed to payment):', dbError);
      }

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao efetuar o registo da conta.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate('/dashboard');
  };

  const basePlanFeatures = ['Frente de Caixa (POS)', 'Controlo de Estoque', 'Gestão de Clientes & Fiado', 'Carteiras M-Pesa & e-Mola', 'Registo de Despesas', 'Impressão Térmica', 'Cobrança WhatsApp'];
  const premiumPlanFeatures = ['Tudo do Plano Base', 'Relatórios DRE Financeiros', 'Gestão de Equipa & Papéis', 'Utilizadores ilimitados', 'Exportação PDF/Excel', 'Suporte prioritário'];

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none" />

      {/* ── LEFT PANEL (Desktop only) — Visual / Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-10 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Dr Gestor MZ" className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 border border-white/10" />
          <div>
            <span className="font-black text-xl text-white tracking-tight">Dr Gestor</span>
            <span className="font-black text-xl text-emerald-400 tracking-tight"> MZ</span>
          </div>
        </div>

        {/* Main branding content */}
        <div className="space-y-8 max-w-md">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
              Comece a gerir o seu negócio{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                de forma inteligente.
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-base leading-relaxed">
              Junte-se a centenas de empresários moçambicanos que já controlam as suas vendas, estoque e finanças numa única plataforma.
            </p>
          </div>

          {/* Trust points */}
          <div className="space-y-3">
            {[
              { icon: <Store className="w-4 h-4" />, text: 'POS completo com impressão térmica' },
              { icon: <Smartphone className="w-4 h-4" />, text: 'M-Pesa & e-Mola integrados' },
              { icon: <Shield className="w-4 h-4" />, text: 'Dados encriptados e seguros' },
              { icon: <Zap className="w-4 h-4" />, text: 'Ativo em menos de 3 minutos' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                  {item.icon}
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-gray-300 text-sm italic leading-relaxed">
              "O Dr Gestor mudou a forma como controlo o meu negócio. Agora sei exactamente quanto entra e sai todos os dias."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-black">FM</div>
              <div>
                <p className="text-white text-xs font-bold">Fatima Mussa</p>
                <p className="text-gray-500 text-[10px]">Salão Beauty & Mais — Maputo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Dr Gestor MZ — Moçambique 🇲🇿
        </p>
      </div>

      {/* ── RIGHT PANEL — Registration Form ── */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Dr Gestor MZ" className="w-9 h-9 rounded-lg object-contain bg-white/5 p-0.5" />
            <span className="font-black text-base text-white">Dr Gestor <span className="text-emerald-400">MZ</span></span>
          </Link>
          <Link to="/login" className="text-xs text-gray-400 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors">
            Fazer Login <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            {/* Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Criar Conta Empresarial
                </h1>
                <p className="text-gray-500 text-sm mt-1.5">
                  Preencha os dados e pague via <span className="text-red-400 font-bold">M-Pesa</span> ou <span className="text-orange-400 font-bold">e-Mola</span>
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">!</div>
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Plan selector */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">
                    Escolha o Plano
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Base */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('Base')}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlan === 'Base'
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {selectedPlan === 'Base' && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Base</span>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">300</span>
                        <span className="text-xs text-gray-500">MT/mês</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">POS, Estoque, Clientes & Carteiras</p>
                    </button>

                    {/* Premium */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('Premium')}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlan === 'Premium'
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        {selectedPlan === 'Premium' ? (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full uppercase">⭐ Top</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-amber-400" /> Premium
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">500</span>
                        <span className="text-xs text-gray-500">MT/mês</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">Tudo + DRE, Equipa, Exportação</p>
                    </button>
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Nome da Empresa
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Ex: Mercearia Central Lda"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-800 rounded-xl outline-none text-white text-sm font-semibold placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* NUIT + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      NUIT
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={formData.nif}
                        onChange={(e) => setFormData({...formData, nif: e.target.value})}
                        placeholder="123456789"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-800 rounded-xl outline-none text-white text-sm font-mono font-bold placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="tel"
                        required
                        disabled={loading}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="84 xxxxxxx"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-800 rounded-xl outline-none text-white text-sm font-semibold placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email + Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="email@empresa.co.mz"
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-800 rounded-xl outline-none text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={loading}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-800 rounded-xl outline-none text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Termos */}
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Ao criar conta, concorda com os <a href="#" className="text-emerald-500 hover:underline">Termos de Uso</a> e a <a href="#" className="text-emerald-500 hover:underline">Política de Privacidade</a> do Dr Gestor MZ.
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A processar...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta e Pagar {planAmount} MT</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Trust footer */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> PaySuite Seguro
                  </span>
                  <span>•</span>
                  <span className="text-red-400 font-bold">M-Pesa</span>
                  <span>•</span>
                  <span className="text-orange-400 font-bold">e-Mola</span>
                </div>
              </form>

              {/* Login link */}
              <div className="mt-6 pt-5 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-500">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </div>

            {/* Mobile footer */}
            <p className="lg:hidden text-center text-gray-700 text-[10px] mt-4">
              © {new Date().getFullYear()} Dr Gestor MZ — Moçambique 🇲🇿
            </p>
          </motion.div>
        </div>

        {/* Desktop login link in header */}
        <div className="hidden lg:flex items-center justify-end p-6">
          <Link to="/login" className="text-xs text-gray-500 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors">
            Já tem conta? Fazer Login <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* PaySuite Payment Modal */}
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
