import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Box, Users, CreditCard, 
  Wallet, BarChart3, Settings, LogOut, Menu, X, Sun, Moon,
  BadgeCheck, Store, Shield, Zap, Receipt, Download
} from 'lucide-react';
import { useThemeStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { PaymentModal } from '../components/PaymentModal';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  // Auto-close sidebar on route navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const fetchCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setCompany(data);
      } else {
        // Fallback row if user is signed up but no record exists
        const realName = user.user_metadata?.company_name || (user.email ? user.email.split('@')[0] : 'Minha Empresa');
        const { data: newCompany } = await supabase
          .from('companies')
          .insert([{
            id: user.id,
            company_name: realName,
            nif: user.user_metadata?.nif || '',
            phone: user.user_metadata?.phone || '',
            email: user.email || '',
            plan: 'Base',
            subscription_status: 'pending',
            subscription_expires_at: null
          }])
          .select()
          .single();

        if (newCompany) {
          setCompany(newCompany);
        }
      }
    } catch (err) {
      console.error('Erro ao obter informações da empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getDaysRemaining = () => {
    if (!company?.subscription_expires_at) return 0;
    const expiresAt = new Date(company.subscription_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isBasePlan = company?.plan === 'Base';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, isPremium: false },
    { name: 'POS', href: '/dashboard/pos', icon: Store, isPremium: false },
    { name: 'Produtos', href: '/dashboard/produtos', icon: Box, isPremium: false },
    { name: 'Clientes', href: '/dashboard/clientes', icon: Users, isPremium: false },
    { name: 'Despesas', href: '/dashboard/despesas', icon: Receipt, isPremium: false },
    { name: 'Carteiras Móveis', href: '/dashboard/carteiras', icon: Wallet, isPremium: false },
    { name: 'Relatórios & DRE', href: '/dashboard/relatorios', icon: BarChart3, isPremium: true },
    { name: 'Utilizadores', href: '/dashboard/utilizadores', icon: Shield, isPremium: true },
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings, isPremium: false },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Dr Gestor MZ" className="w-9 h-9 rounded-lg object-contain bg-white/5 p-0.5" />
            <span className="text-white font-bold text-lg tracking-tight">
              Dr Gestor <span className="text-[#10B981]">MZ</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.isPremium && isBasePlan && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-black tracking-widest uppercase">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span>SAIR</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Olá, {company?.company_name || 'Carregando...'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:block">Controle Geral em Tempo Real</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Upgrade Badge Button if on Base Plan */}
            {isBasePlan && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="hidden sm:flex px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>UPGRADE P/ PREMIUM (500 MT)</span>
              </button>
            )}

            {/* PWA Install Button */}
            {deferredPrompt && (
              <button
                onClick={async () => {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') setDeferredPrompt(null);
                }}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                title="Instalar App Dr Gestor MZ no seu dispositivo"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Instalar App</span>
              </button>
            )}
            
            <div className="hidden sm:block h-8 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
            
            <Link 
              to="/dashboard/configuracoes" 
              className="flex items-center space-x-3 cursor-pointer group hover:opacity-90 transition-opacity"
              title="Clique para editar as configurações da empresa"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {company?.company_name || 'Sua Empresa'}
                </p>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                  Plano {company?.plan || 'Base'} • NUIT: {company?.nif || 'Não definido'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 p-0.5 shadow-sm">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">
                    {(company?.company_name || 'E')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ companyPlan: company?.plan || 'Base', onOpenUpgradeModal: () => setIsUpgradeModalOpen(true) }} />
        </main>
      </div>

      {/* Renewal Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        planName={company?.plan || 'Base'}
        planAmount={company?.plan === 'Premium' ? 500 : 300}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          fetchCompanyData();
        }}
        companyId={company?.id}
      />

      {/* Upgrade Modal */}
      <PaymentModal
        isOpen={isUpgradeModalOpen}
        planName="Premium"
        planAmount={500}
        onSuccess={() => {
          setIsUpgradeModalOpen(false);
          fetchCompanyData();
        }}
        companyId={company?.id}
      />
    </div>
  );
}
