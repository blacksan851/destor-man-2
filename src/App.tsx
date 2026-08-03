import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Products } from './pages/Dashboard/Products';
import { Pos } from './pages/Dashboard/Pos';
import { Customers } from './pages/Dashboard/Customers';
import { Wallets } from './pages/Dashboard/Wallets';
import { Reports } from './pages/Dashboard/Reports';
import { Users } from './pages/Dashboard/Users';
import { Settings } from './pages/Dashboard/Settings';
import { Expenses } from './pages/Dashboard/Expenses';
import { PlansPage } from './pages/Dashboard/Plans';
import { useThemeStore } from './lib/store';

const queryClient = new QueryClient();

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            {/* Active & Placeholder routes for modules */}
            <Route path="pos" element={<Pos />} />
            <Route path="produtos" element={<Products />} />
            <Route path="clientes" element={<Customers />} />
            <Route path="financeiro" element={<Navigate to="/dashboard/relatorios" replace />} />
            <Route path="carteiras" element={<Wallets />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="planos" element={<PlansPage />} />
            <Route path="assinatura" element={<PlansPage />} />
            <Route path="utilizadores" element={<Users />} />
            <Route path="despesas" element={<Expenses />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{title}</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Módulo em desenvolvimento.</p>
      </div>
    </div>
  );
}
