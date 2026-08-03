import { useState, useEffect } from 'react';
import { 
  Zap, CheckCircle2, ShieldCheck, CreditCard, 
  Crown, Sparkles, Smartphone, ArrowRight, RefreshCw, Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { PaymentModal } from '../../components/PaymentModal';

export function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<'Base' | 'Premium'>('Premium');

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) setCompany(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const isCurrentPremium = company?.plan === 'Premium';

  const handleSelectUpgrade = (plan: 'Base' | 'Premium') => {
    if (plan === 'Base') return;
    setSelectedPlanToBuy('Premium');
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-black uppercase tracking-widest">
          <Zap className="w-4 h-4 fill-amber-400" /> Planos & Upgrade de Licença
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Escolha o Plano Ideal para a Sua Empresa
        </h1>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
          Gerencie o seu negócio sem limites. Faça upgrade para o Plano Premium e libere Relatórios DRE, Utilizadores e suporte prioritário via M-Pesa e e-Mola.
        </p>
      </div>

      {/* Current Plan Status Banner */}
      {company && (
        <div className="bg-[#0B1120] border border-gray-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
              isCurrentPremium ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isCurrentPremium ? <Crown className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Plano Atual</p>
              <h3 className="text-xl font-black text-white">
                Plano {company.plan || 'Base'} 
                {isCurrentPremium && <span className="ml-2 text-xs bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full">ATIVO PRO</span>}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                NUIT: {company.nif || 'Não informado'} • {company.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCompanyData}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
              title="Atualizar Estado"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {!isCurrentPremium ? (
              <button
                onClick={() => handleSelectUpgrade('Premium')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>UPGRADE AGORA (500 MT / mês)</span>
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Licença Ativa</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {/* BASE PLAN */}
        <div className="bg-[#0B1120] rounded-3xl p-8 border border-gray-800 flex flex-col justify-between relative shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 px-3 py-1 bg-gray-800 rounded-full">
                Plano Gratuito / Inicial
              </span>
              {!isCurrentPremium && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Plano Atual
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Plano Base</h3>
            <p className="text-xs text-gray-400 mb-6">Ideal para micro-empresas e negócios no início das operações.</p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-white">0 MT</span>
              <span className="text-xs text-gray-400 font-bold">/ para sempre</span>
            </div>

            <ul className="space-y-3.5 mb-8">
              {[
                'Frente de Caixa (POS) Ilimitado',
                'Cadastro de Produtos e Categorias',
                'Gestão de Clientes e Registro de Fiado',
                'Registo de Despesas Operacionais',
                'Controlo de Carteiras M-Pesa & e-Mola',
                'Impressão de Recibos Térmicos (58/80mm)'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-gray-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3.5 bg-gray-800 text-gray-400 text-xs font-bold rounded-2xl cursor-not-allowed text-center"
          >
            {!isCurrentPremium ? 'Plano Ativo' : 'Plano Incluído'}
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div className="bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#0F172A] rounded-3xl p-8 border-2 border-amber-500/80 flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" /> Mais Recomendado
          </div>

          <div>
            <div className="flex justify-between items-center mb-6 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                Completo & Sem Limites
              </span>
              {isCurrentPremium && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Plano Ativo
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
              <span>Plano Premium PRO</span>
              <Crown className="w-6 h-6 text-amber-400" />
            </h3>
            <p className="text-xs text-gray-400 mb-6">Para empresas que querem máxima eficiência, relatórios de lucro DRE e gestão de equipa.</p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-amber-400">500 MT</span>
              <span className="text-xs text-gray-400 font-bold">/ mês</span>
            </div>

            <ul className="space-y-3.5 mb-8">
              {[
                'Tudo do Plano Base incluído',
                'Relatórios & Demonstração de Resultado (DRE)',
                'Relatório de Lucro Real por Produto',
                'Exportação em Excel (CSV) e PDF',
                'Gestão de Múltiplos Utilizadores & Operadores',
                'Integração Automática M-Pesa & e-Mola (PaySuite)',
                'Suporte Prioritário 24/7 por WhatsApp'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleSelectUpgrade('Premium')}
            className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all ${
              isCurrentPremium
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white hover:opacity-90 shadow-amber-500/25'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isCurrentPremium ? 'RENOVAR ASSINATURA (500 MT)' : 'FAZER UPGRADE PARA PREMIUM'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payment Methods Banner */}
      <div className="bg-[#0B1120] border border-gray-800 rounded-3xl p-6 text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Pagamento Instantâneo via Carteira Móvel
        </p>
        <div className="flex items-center justify-center gap-6 pt-1">
          <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>M-Pesa</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
          <div className="flex items-center gap-2 text-orange-400 font-extrabold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>e-Mola</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500">
          Após a confirmação do pagamento, a sua licença é ativada automaticamente no Supabase por 30 dias.
        </p>
      </div>

      {/* PaySuite Payment Modal */}
      {company && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          planName="Premium PRO"
          planAmount={500}
          companyId={company.id}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchCompanyData();
          }}
        />
      )}
    </div>
  );
}
