import { motion } from 'motion/react';
import {
  ArrowRight, BarChart3, Box, CreditCard, LayoutDashboard,
  ShoppingCart, Users, Wallet, CheckCircle2, Menu, X, Sun, Moon,
  Printer, MessageCircle, Receipt, Zap, Star, Shield, TrendingUp,
  Smartphone, Store, ChevronDown, Globe, Clock, ArrowUpRight,
  Play, Building, Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../lib/store';
import { useState } from 'react';

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const stats = [
    { value: '500+', label: 'Empresas Activas', icon: <Building className="w-5 h-5" /> },
    { value: '99.9%', label: 'Uptime Garantido', icon: <Shield className="w-5 h-5" /> },
    { value: '24/7', label: 'Suporte Disponível', icon: <Clock className="w-5 h-5" /> },
    { value: '3min', label: 'Para Começar', icon: <Zap className="w-5 h-5" /> },
  ];

  const features = [
    {
      icon: <Store className="w-7 h-7 text-emerald-500" />,
      title: 'Frente de Caixa (POS)',
      description: 'Sistema de ponto de venda completo com leitor de código de barras, emissão de talão térmico (58mm/80mm) e controlo de troco.',
      badge: 'Popular'
    },
    {
      icon: <Box className="w-7 h-7 text-blue-500" />,
      title: 'Controlo de Estoque',
      description: 'Gerencie produtos, categorias, preços de custo e venda, alertas de estoque mínimo e histórico de movimentos.',
      badge: null
    },
    {
      icon: <Users className="w-7 h-7 text-purple-500" />,
      title: 'Clientes & Fiado',
      description: 'Cadastro de clientes, controlo de fiado em aberto, cobrança automática via WhatsApp e histórico de compras.',
      badge: null
    },
    {
      icon: <Wallet className="w-7 h-7 text-amber-500" />,
      title: 'Carteiras Móveis',
      description: 'Integração nativa com M-Pesa e e-Mola. Registe entradas, saídas e monitore o saldo de cada carteira em tempo real.',
      badge: null
    },
    {
      icon: <Receipt className="w-7 h-7 text-red-500" />,
      title: 'Despesas & Custos',
      description: 'Registre e categorize gastos operacionais como Credelec, FIPAG, Aluguer, Salários e Transporte.',
      badge: 'Novo'
    },
    {
      icon: <BarChart3 className="w-7 h-7 text-emerald-500" />,
      title: 'Relatórios DRE',
      description: 'Demonstração de Resultado (DRE) completa com Faturamento, Custo, Lucro Bruto, Margem e exportação PDF/Excel.',
      badge: 'Premium'
    },
    {
      icon: <MessageCircle className="w-7 h-7 text-green-500" />,
      title: 'Cobrança via WhatsApp',
      description: 'Envie lembretes de cobrança de fiado profissionais directamente para o WhatsApp do cliente com um único clique.',
      badge: 'Novo'
    },
    {
      icon: <Printer className="w-7 h-7 text-slate-500" />,
      title: 'Impressão Térmica',
      description: 'Suporte nativo para impressoras térmicas de recibos de 58mm e 80mm. Compatible com Epson, Xprinter, Sunmi e Bematech.',
      badge: null
    },
    {
      icon: <Shield className="w-7 h-7 text-indigo-500" />,
      title: 'Utilizadores & Papéis',
      description: 'Gerencie a sua equipa com papéis definidos: Administrador, Gerente de Loja e Operador de Caixa com permissões separadas.',
      badge: 'Premium'
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Crie a sua Conta',
      description: 'Registe-se em menos de 3 minutos. Sem cartão de crédito. Escolha entre Plano Base ou Premium.',
      icon: <Zap className="w-6 h-6 text-emerald-400" />
    },
    {
      num: '02',
      title: 'Configure a sua Empresa',
      description: 'Adicione o nome da empresa, NUIT, logótipo, número de carteira M-Pesa/e-Mola e personalize o recibo.',
      icon: <Building className="w-6 h-6 text-emerald-400" />
    },
    {
      num: '03',
      title: 'Cadastre os Produtos',
      description: 'Importe o seu catálogo com preços de custo e venda, categorias e quantidade em stock.',
      icon: <Box className="w-6 h-6 text-emerald-400" />
    },
    {
      num: '04',
      title: 'Comece a Vender!',
      description: 'Abra o POS, registe vendas, emita recibos térmicos e acompanhe tudo no dashboard em tempo real.',
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />
    },
  ];

  const testimonials = [
    {
      name: 'Carlos Nhampule',
      business: 'Mercearia Nhampule — Beira',
      text: 'Desde que comecei a usar o Dr Gestor MZ consigo saber exatamente quanto dinheiro entrou e saiu da minha loja. O fiado com WhatsApp é incrível!',
      stars: 5,
      avatar: 'CN'
    },
    {
      name: 'Fatima Mussa',
      business: 'Salão Beauty & Mais — Maputo',
      text: 'Gestão do estoque, controlo de clientes e o caixa ficaram muito mais fáceis. Pago via M-Pesa e já tenho acesso a tudo.',
      stars: 5,
      avatar: 'FM'
    },
    {
      name: 'João Macuacua',
      business: 'Oficina Auto Macuacua — Matola',
      text: 'O relatório financeiro DRE me ajudou a perceber que eu estava a perder dinheiro em algumas peças. Mudei os preços e o lucro aumentou.',
      stars: 5,
      avatar: 'JM'
    },
  ];

  const faqs = [
    {
      q: 'Preciso de internet para usar o Dr Gestor MZ?',
      a: 'Sim, o Dr Gestor MZ é uma plataforma baseada na nuvem. É necessária conexão à internet para sincronizar dados em tempo real. Funciona bem com redes 3G/4G.'
    },
    {
      q: 'Como faço o pagamento da assinatura?',
      a: 'Aceitamos pagamento via M-Pesa (Vodacom) e e-Mola (Movitel) directamente na plataforma. Não é necessário cartão bancário.'
    },
    {
      q: 'Posso usar em múltiplos dispositivos?',
      a: 'Sim! O Dr Gestor MZ funciona no computador, tablet e telemóvel. Com o Plano Premium pode adicionar utilizadores ilimitados à mesma conta.'
    },
    {
      q: 'Os meus dados estão seguros?',
      a: 'Absolutamente. Usamos encriptação de nível bancário com Supabase e servidores seguros. Os seus dados pertencem exclusivamente a si.'
    },
    {
      q: 'Funciona com impressoras térmicas de talão?',
      a: 'Sim! Suportamos impressoras térmicas de 58mm e 80mm (Epson, Xprinter, Sunmi, Bematech). Basta clicar em "Imprimir Talão" após cada venda.'
    },
    {
      q: 'Posso mudar de plano depois?',
      a: 'Sim. Pode fazer upgrade do Plano Base para Premium a qualquer momento, directamente no painel, pagando a diferença via M-Pesa ou e-Mola.'
    },
  ];

  const basePlanFeatures = [
    'Frente de Caixa (POS) completo',
    'Controlo de Estoque & Produtos',
    'Gestão de Clientes & Fiado',
    'Cobrança via WhatsApp',
    'Carteiras Móveis (M-Pesa & e-Mola)',
    'Registo de Despesas & Custos',
    'Impressão Térmica (58mm / 80mm)',
    'Configurações da Empresa & Recibo',
    '1 utilizador por conta',
  ];

  const premiumPlanFeatures = [
    'Tudo do Plano Base, mais:',
    'Relatórios DRE Financeiros',
    'Análise de Margem por Produto',
    'Gestão de Equipa & Utilizadores',
    'Papéis: Admin / Gerente / Caixa',
    'Exportação PDF & Excel',
    'Utilizadores ilimitados',
    'Suporte prioritário',
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans transition-colors duration-200 overflow-x-hidden w-full max-w-full text-white">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#0B1120]/95 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Dr Gestor MZ" className="w-10 h-10 rounded-xl object-contain bg-white/5 p-0.5 shrink-0" />
              <div className="whitespace-nowrap">
                <span className="font-black text-lg text-white tracking-tight">Dr Gestor</span>
                <span className="font-black text-lg text-emerald-400 tracking-tight"> MZ</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors font-semibold">Recursos</a>
              <a href="#como-funciona" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors font-semibold">Como Funciona</a>
              <a href="#precos" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors font-semibold">Preços</a>
              <a href="#faq" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors font-semibold">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-300 font-bold hover:text-emerald-400 transition-colors px-3 py-2">Entrar</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer">
                Criar Conta Grátis <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-300">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0B1120] border-b border-gray-800 px-4 py-4 space-y-2">
            <a href="#recursos" className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-gray-800">Recursos</a>
            <a href="#como-funciona" className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-gray-800">Como Funciona</a>
            <a href="#precos" className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-gray-800">Preços</a>
            <a href="#faq" className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-gray-800">FAQ</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center px-4 py-2.5 border border-gray-800 text-white text-sm font-semibold rounded-xl bg-[#0F172A]">Entrar</Link>
              <Link to="/register" className="flex-1 text-center px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl">Criar Conta</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-28 px-4 overflow-hidden">
        {/* Gradient BG blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Plataforma #1 de Gestão em Moçambique
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] max-w-5xl mx-auto"
          >
            Gerencie o seu negócio{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              com inteligência
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            POS, estoque, fiado, carteiras M-Pesa & e-Mola, despesas, relatórios e cobrança via WhatsApp — tudo numa só plataforma feita para Moçambique.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
            >
              Começar Grátis Agora <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto px-8 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-700 dark:text-white rounded-2xl font-bold text-base border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              Ver Como Funciona
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4 justify-center items-center text-xs text-gray-400 font-medium"
          >
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sem cartão bancário</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pague por M-Pesa / e-Mola</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancele quando quiser</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Suporte em Português</span>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
            className="mt-16 relative mx-auto w-full max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
              {/* window bar */}
              <div className="h-10 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 bg-gray-50 dark:bg-gray-900 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 h-5 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
              <div className="flex h-64 md:h-80">
                {/* Sidebar mockup */}
                <div className="w-48 border-r border-gray-100 dark:border-gray-800 p-3 space-y-1.5 hidden md:block bg-slate-900">
                  {['Dashboard', 'POS', 'Produtos', 'Clientes', 'Despesas', 'Carteiras'].map((item, i) => (
                    <div key={i} className={`h-7 rounded-lg flex items-center px-3 gap-2 ${i === 0 ? 'bg-emerald-500/20' : ''}`}>
                      <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                      <div className={`h-2 rounded flex-1 ${i === 0 ? 'bg-emerald-400/50' : 'bg-gray-700'}`} />
                    </div>
                  ))}
                </div>
                {/* Content mockup */}
                <div className="flex-1 p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { color: 'bg-emerald-500', label: 'Vendas Hoje', val: '15.420 MT' },
                      { color: 'bg-blue-500', label: 'Produtos', val: '142 itens' },
                      { color: 'bg-amber-500', label: 'M-Pesa Saldo', val: '8.750 MT' }
                    ].map((card, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 flex flex-col gap-1.5 shadow-sm">
                        <div className={`w-7 h-7 ${card.color} rounded-lg opacity-90`} />
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                        <div className="h-3 bg-gray-300 dark:bg-gray-500 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 flex-1">
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm">
                      <div className="flex gap-1 items-end h-14 mt-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div key={i} className={`flex-1 rounded-sm ${i === 5 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="w-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm hidden md:block">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500 mx-auto mt-2 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 bg-slate-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-2 text-emerald-400">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-black text-white">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="recursos" className="py-24 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              Funcionalidades
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Tudo o que o seu negócio precisa
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Desenvolvido especificamente para o mercado moçambicano — com suporte a M-Pesa, e-Mola, NUIT e impressoras térmicas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 rounded-xl flex items-center justify-center transition-colors">
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      feature.badge === 'Premium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                      feature.badge === 'Novo' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    }`}>
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── M-PESA / E-MOLA HIGHLIGHT ── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Smartphone className="w-3.5 h-3.5" /> Feito para Moçambique
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Integração nativa com{' '}
                <span className="text-emerald-400">M-Pesa</span> e{' '}
                <span className="text-orange-400">e-Mola</span>
              </h2>
              <p className="mt-6 text-gray-400 text-lg leading-relaxed">
                Registe pagamentos recebidos, controle o saldo de cada carteira, pague as suas despesas operacionais e controle saídas — tudo dentro da plataforma.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Controle de saldo M-Pesa & e-Mola em tempo real',
                  'Registe entradas e saídas de cada carteira',
                  'Pague assinatura Dr Gestor via M-Pesa ou e-Mola',
                  'Cobrança de fiado via WhatsApp integrada',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link to="/register" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2">
                  Começar Agora <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Vodacom M-Pesa', color: 'from-red-600 to-red-700', initials: 'M', bg: 'bg-red-500' },
                { name: 'Movitel e-Mola', color: 'from-orange-500 to-orange-600', initials: 'e', bg: 'bg-orange-500' },
                { name: 'Impressão Térmica', color: 'from-slate-700 to-slate-800', initials: '🖨', bg: 'bg-slate-600' },
                { name: 'WhatsApp Cobrança', color: 'from-green-600 to-green-700', initials: '💬', bg: 'bg-green-500' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 border border-white/10 shadow-xl`}
                >
                  <div className="text-2xl mb-3">{card.initials.length === 1 && card.initials !== 'M' && card.initials !== 'e' ? card.initials : (
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-white font-black text-base`}>
                      {card.initials}
                    </div>
                  )}</div>
                  <p className="text-white font-bold text-sm">{card.name}</p>
                  <div className="mt-3 flex items-center gap-1 text-white/60 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-white/80" />
                    <span>Integrado</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              Como Funciona
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Comece em 4 passos simples
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 dark:from-emerald-900 dark:via-emerald-700 dark:to-emerald-900 z-0" />
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
                className="relative z-10 text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/25 text-white font-black text-2xl">
                  {step.num}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px] mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-emerald-500/25">
              Criar Conta Agora — É Grátis <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Testemunhos
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              O que dizem os nossos clientes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4"
              >
                <div className="flex">
                  {[...Array(t.stars)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.business}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precos" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              Preços
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Planos simples e transparentes
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Sem taxas escondidas. Pague via M-Pesa ou e-Mola. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Base Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Plano Base</h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">Essencial</span>
              </div>
              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">300</span>
                <span className="text-xl font-bold text-gray-400">MT/mês</span>
              </div>
              <ul className="space-y-3 flex-1">
                {basePlanFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register?plan=base"
                className="mt-8 block w-full py-3.5 px-6 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-900 dark:text-white text-center font-bold rounded-2xl transition-all border border-gray-200 dark:border-gray-700 text-sm"
              >
                Começar com Plano Base
              </Link>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                ⭐ Recomendado
              </div>
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Plano Premium</h3>
              </div>
              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-5xl font-black text-white tracking-tight">500</span>
                <span className="text-xl font-bold text-gray-400">MT/mês</span>
              </div>
              <ul className="space-y-3 flex-1">
                {premiumPlanFeatures.map((item, i) => (
                  <li key={i} className={`flex items-center gap-2.5 ${i === 0 ? 'text-emerald-400 font-bold text-xs uppercase tracking-wider pt-1 pb-1' : ''}`}>
                    {i !== 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    <span className={`text-sm ${i === 0 ? '' : 'text-gray-300'}`}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register?plan=premium"
                className="mt-8 block w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-sm relative z-10"
              >
                Assinar Premium Agora
              </Link>
            </motion.div>
          </div>

          {/* Payment methods note */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              Pagamento aceite via{' '}
              <span className="font-bold text-red-500">M-Pesa</span> e{' '}
              <span className="font-bold text-orange-500">e-Mola</span> — sem cartão bancário.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-full text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
              FAQ
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Pronto para transformar a sua gestão?
            </h2>
            <p className="mt-6 text-emerald-100 text-lg max-w-2xl mx-auto">
              Junte-se a centenas de empresários moçambicanos que já controlam as suas vendas, estoque e finanças com o Dr Gestor MZ.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-10 py-4 bg-white hover:bg-gray-50 text-emerald-600 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-2"
              >
                Criar Conta Gratuita <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Já tenho conta — Entrar
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-lg">D</span>
                </div>
                <div>
                  <span className="font-black text-lg text-white tracking-tight">Dr Gestor</span>
                  <span className="font-black text-lg text-emerald-500 tracking-tight"> MZ</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Plataforma de gestão empresarial desenvolvida especificamente para micro, pequenas e médias empresas em Moçambique.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500 text-xs">Maputo, Moçambique 🇲🇿</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2">
                {['Recursos', 'Preços', 'Como Funciona', 'FAQ'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4">Conta</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Entrar</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Criar Conta</Link></li>
                <li><Link to="/register?plan=premium" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Plano Premium</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2025 Dr Gestor MZ. Todos os direitos reservados.</p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              Aceita pagamento via <span className="text-red-400 font-bold">M-Pesa</span> & <span className="text-orange-400 font-bold">e-Mola</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
