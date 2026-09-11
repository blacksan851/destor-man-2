import { useState, useEffect } from 'react';
import { 
  Zap, CheckCircle2, ShieldCheck, CreditCard, 
  Crown, Sparkles, Smartphone, ArrowRight, RefreshCw, Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

export function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);

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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
          <Zap className="w-4 h-4 fill-emerald-400" /> Acesso Total Liberado
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Sua Empresa tem Acesso Completo aos Recursos
        </h1>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
          Gerencie o seu negócio sem limitações. Todos os recursos como Relatórios DRE, Gestão de Equipa, Vendas POS e Carteiras Móveis estão 100% disponíveis.
        </p>
      </div>

      {/* Current Plan Status Banner */}
      {company && (
        <div className="bg-[#0B1120] border border-gray-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Estado da Licença</p>
              <h3 className="text-xl font-black text-white">
                Plano Empresarial Completo 
                <span className="ml-2 text-xs bg-emerald-500 text-black font-extrabold px-2 py-0.5 rounded-full">100% ATIVO</span>
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

            <div className="px-5 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sem cobranças adicionais</span>
            </div>
          </div>
        </div>
      )}

      {/* Features Overview Card */}
      <div className="bg-[#0B1120] rounded-3xl p-8 border border-gray-800 max-w-4xl mx-auto shadow-2xl space-y-6">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>Recursos Incluídos na Sua Conta</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Frente de Caixa (POS) Ilimitado',
            'Cadastro & Controlo de Estoque Automático',
            'Gestão de Clientes & Registo de Fiados',
            'Relatórios Financeiros DRE & Margem de Lucro',
            'Gestão de Múltiplos Utilizadores (Admin / Caixa / Gerente)',
            'Registo de Despesas Operacionais',
            'Controlo de Carteiras M-Pesa & e-Mola',
            'Impressão de Recibos Térmicos (58mm / 80mm)',
            'Exportação de Dados em CSV & PDF',
            'Lembretes de Cobrança via WhatsApp'
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-200">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
