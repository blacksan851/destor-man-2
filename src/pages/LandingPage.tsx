import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Box, CreditCard, LayoutDashboard, Settings, ShoppingCart, Users, Wallet, CheckCircle2, Menu, X, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../lib/store';
import { useState } from 'react';

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    { icon: <Box className="w-6 h-6 text-emerald-500" />, title: 'Controle de Estoque' },
    { icon: <ShoppingCart className="w-6 h-6 text-emerald-500" />, title: 'Vendas' },
    { icon: <Users className="w-6 h-6 text-emerald-500" />, title: 'Clientes' },
    { icon: <CreditCard className="w-6 h-6 text-emerald-500" />, title: 'Financeiro' },
    { icon: <Wallet className="w-6 h-6 text-emerald-500" />, title: 'Carteiras Móveis' },
    { icon: <Users className="w-6 h-6 text-emerald-500" />, title: 'Funcionários' },
    { icon: <BarChart3 className="w-6 h-6 text-emerald-500" />, title: 'Relatórios' },
    { icon: <LayoutDashboard className="w-6 h-6 text-emerald-500" />, title: 'Dashboard Inteligente' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-900 font-sans transition-colors duration-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">Dr Gestor MZ</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-slate-600 dark:text-gray-300 hover:text-emerald-500 transition-colors">Recursos</a>
              <a href="#precos" className="text-slate-600 dark:text-gray-300 hover:text-emerald-500 transition-colors">Preços</a>
              <a href="#" className="text-slate-600 dark:text-gray-300 hover:text-emerald-500 transition-colors">Demonstração</a>
              <a href="#" className="text-slate-600 dark:text-gray-300 hover:text-emerald-500 transition-colors">Contactos</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to="/login" className="text-slate-600 dark:text-white font-medium hover:text-emerald-500">Entrar</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-colors">Criar Conta</Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-gray-300">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-gray-300">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-4 space-y-1">
            <a href="#recursos" className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Recursos</a>
            <a href="#precos" className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Preços</a>
            <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Entrar</Link>
            <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800">Criar Conta</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Controle todo o seu negócio numa única plataforma.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Controle vendas, estoque, caixa, carteiras móveis, clientes e colaboradores em tempo real.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2">
              Começar Agora <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-slate-900 dark:text-white rounded-xl font-medium text-lg border border-gray-200 dark:border-gray-700 transition-all">
              Solicitar Demonstração
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-20 relative mx-auto w-full max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F5] dark:from-slate-900 via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
              {/* Mockup Placeholder */}
              <div className="absolute inset-0 flex flex-col bg-gray-50 dark:bg-slate-900">
                <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 bg-white dark:bg-gray-900">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="flex-1 flex p-6 gap-6">
                  <div className="w-64 hidden lg:flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="flex gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center px-6 gap-2">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Tudo o que precisa para crescer</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Ferramentas poderosas desenhadas para simplificar a gestão do seu negócio no dia a dia.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-[#F5F5F5] dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-[#F5F5F5] dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Planos simples e transparentes</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Escolha o plano ideal para a sua empresa. Sem taxas escondidas.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Base Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Plano Base</h3>
              <div className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                <span className="text-5xl font-extrabold tracking-tight">300 MT</span>
                <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <ul className="mt-8 space-y-4 flex-1">
                {['1 utilizador', 'Dashboard', 'Estoque', 'Vendas', 'Clientes', 'Relatórios', 'Suporte'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register?plan=base" className="mt-8 block w-full py-4 px-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-slate-900 dark:text-white text-center font-medium rounded-xl transition-colors">
                Assinar Plano
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-slate-900 dark:bg-gray-900 rounded-3xl p-8 border-2 border-emerald-500 shadow-xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-xl text-sm font-medium">Recomendado</div>
              <h3 className="text-2xl font-bold text-white">Plano Premium</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-5xl font-extrabold tracking-tight">500 MT</span>
                <span className="ml-1 text-xl font-medium text-gray-400">/mês</span>
              </div>
              <p className="mt-4 text-emerald-400 font-medium">Tudo do plano Base, mais:</p>
              <ul className="mt-4 space-y-4 flex-1">
                {['Utilizadores ilimitados', 'Múltiplos vendedores', 'Permissões avançadas', 'Relatórios avançados'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register?plan=premium" className="mt-8 block w-full py-4 px-8 bg-emerald-500 hover:bg-emerald-600 text-white text-center font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/25">
                Assinar Premium
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
