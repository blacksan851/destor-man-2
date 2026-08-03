import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, Users, Box, ShoppingCart, 
  Loader2, AlertTriangle, ArrowRight, RefreshCw, ShoppingBag,
  PieChart as PieIcon, Smartphone, Banknote
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface SaleTransaction {
  id: string;
  receipt_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

interface ProductAlert {
  id: string;
  name: string;
  stock_quantity: number;
  unit: string;
}

interface ChartItem {
  name: string;
  total: number;
}

interface TopProductItem {
  name: string;
  vendas: number;
}

interface PiePaymentItem {
  name: string;
  value: number;
  color: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Real DB States
  const [salesTotal, setSalesTotal] = useState(0);
  const [mpesaBalance, setMpesaBalance] = useState(0);
  const [emolaBalance, setEmolaBalance] = useState(0);
  const [dinheiroBalance, setDinheiroBalance] = useState(0);
  const [cartaoBalance, setCartaoBalance] = useState(0);

  const [recentTransactions, setRecentTransactions] = useState<SaleTransaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductAlert[]>([]);
  const [dataSales, setDataSales] = useState<ChartItem[]>([]);
  const [dataTopProducts, setDataTopProducts] = useState<TopProductItem[]>([]);
  const [dataPaymentPie, setDataPaymentPie] = useState<PiePaymentItem[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch real sales from Supabase
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      const salesList: SaleTransaction[] = salesData || [];
      setRecentTransactions(salesList.slice(0, 5));

      // Calculate Sales Totals and Wallet Balances
      const totalSalesSum = salesList.reduce((acc, s) => acc + (s.total_amount || 0), 0);
      setSalesTotal(totalSalesSum);

      const mpesaSum = salesList
        .filter(s => s.payment_method === 'M-Pesa')
        .reduce((acc, s) => acc + (s.total_amount || 0), 0);

      const emolaSum = salesList
        .filter(s => s.payment_method === 'e-Mola')
        .reduce((acc, s) => acc + (s.total_amount || 0), 0);

      const dinheiroSum = salesList
        .filter(s => s.payment_method === 'Dinheiro')
        .reduce((acc, s) => acc + (s.total_amount || 0), 0);

      const cartaoSum = salesList
        .filter(s => s.payment_method === 'Cartão' || s.payment_method === 'Transferência')
        .reduce((acc, s) => acc + (s.total_amount || 0), 0);
      setCartaoBalance(cartaoSum);

      // 1.1 Fetch Expenses & Wallet Movements to calculate net balances
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', user.id);

      const { data: movementsData } = await supabase
        .from('wallet_movements')
        .select('*')
        .eq('company_id', user.id);

      const expensesList = expensesData || [];
      const movementsList = movementsData || [];

      // Deduct Expenses and apply manual movements
      const mpesaExpenses = expensesList
        .filter(e => e.payment_method === 'M-Pesa')
        .reduce((acc, e) => acc + (e.amount || 0), 0);
      const mpesaMoveIns = movementsList
        .filter(m => m.wallet_type === 'M-Pesa' && m.movement_type === 'in')
        .reduce((acc, m) => acc + (m.amount || 0), 0);
      const mpesaMoveOuts = movementsList
        .filter(m => m.wallet_type === 'M-Pesa' && m.movement_type === 'out')
        .reduce((acc, m) => acc + (m.amount || 0), 0);
      const netMpesa = Math.max(0, mpesaSum + mpesaMoveIns - mpesaExpenses - mpesaMoveOuts);
      setMpesaBalance(netMpesa);

      const emolaExpenses = expensesList
        .filter(e => e.payment_method === 'e-Mola')
        .reduce((acc, e) => acc + (e.amount || 0), 0);
      const emolaMoveIns = movementsList
        .filter(m => m.wallet_type === 'e-Mola' && m.movement_type === 'in')
        .reduce((acc, m) => acc + (m.amount || 0), 0);
      const emolaMoveOuts = movementsList
        .filter(m => m.wallet_type === 'e-Mola' && m.movement_type === 'out')
        .reduce((acc, m) => acc + (m.amount || 0), 0);
      const netEmola = Math.max(0, emolaSum + emolaMoveIns - emolaExpenses - emolaMoveOuts);
      setEmolaBalance(netEmola);

      const dinheiroExpenses = expensesList
        .filter(e => e.payment_method === 'Dinheiro')
        .reduce((acc, e) => acc + (e.amount || 0), 0);
      const netDinheiro = Math.max(0, dinheiroSum - dinheiroExpenses);
      setDinheiroBalance(netDinheiro);

      // Build Pie Chart Data for Payment Methods
      const pieData: PiePaymentItem[] = [
        { name: 'M-Pesa', value: netMpesa, color: '#EF4444' },      // Red
        { name: 'e-Mola', value: netEmola, color: '#F97316' },      // Orange
        { name: 'Dinheiro', value: netDinheiro, color: '#10B981' },  // Emerald
        { name: 'Cartão/Transf', value: cartaoSum, color: '#3B82F6' } // Blue
      ].filter(item => item.value > 0);

      setDataPaymentPie(pieData);

      // Build Weekly Sales Chart Data (Last 7 Days)
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const last7DaysMap: { [key: string]: number } = {};
      
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        last7DaysMap[dayName] = 0;
      }

      salesList.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const dayName = days[saleDate.getDay()];
        if (last7DaysMap[dayName] !== undefined) {
          last7DaysMap[dayName] += sale.total_amount || 0;
        }
      });

      const formattedSalesChart = Object.keys(last7DaysMap).map(name => ({
        name,
        total: last7DaysMap[name]
      }));
      setDataSales(formattedSalesChart);

      // 2. Fetch Low Stock Alerts from Supabase `products`
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user.id);

      if (prodData) {
        const alerts = prodData
          .filter((p: any) => p.stock_quantity <= p.min_stock_alert)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            stock_quantity: p.stock_quantity,
            unit: p.unit || 'UN'
          }));
        setLowStockProducts(alerts);
      }

      // 3. Fetch Top Products Sold from Supabase `sale_items`
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('product_name, quantity');

      if (saleItemsData && saleItemsData.length > 0) {
        const itemAgg: { [name: string]: number } = {};
        saleItemsData.forEach((item: any) => {
          itemAgg[item.product_name] = (itemAgg[item.product_name] || 0) + (item.quantity || 1);
        });

        const topList = Object.keys(itemAgg)
          .map(name => ({ name, vendas: itemAgg[name] }))
          .sort((a, b) => b.vendas - a.vendas)
          .slice(0, 4);

        setDataTopProducts(topList);
      } else {
        setDataTopProducts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Supabase Realtime Listener for instant updates when sales, products, expenses, or movements change
    const salesChannel = supabase
      .channel('dashboard-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_movements' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    // Window focus listener so tab switching updates the data automatically
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(salesChannel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6 p-4 sm:p-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Resumo em tempo real sincronizado automaticamente com qualquer edição ou venda.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchDashboardData}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-4 py-2.5 outline-none shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
        {/* Sales Large Card (AreaChart) - col-span-8 */}
        <div className="col-span-1 lg:col-span-8 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col min-h-[340px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Movimento Financeiro (Últimos 7 dias)</h3>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-[#10B981] text-xs font-bold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tempo Real</span>
            </span>
          </div>
          <div className="flex-1 w-full min-h-[200px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
                <span className="text-xs font-semibold">Carregando dados financeiros...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataSales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 600}} dx={-10} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff', borderRadius: '12px', fontWeight: 600 }}
                    itemStyle={{ color: '#10B981' }}
                    cursor={{ stroke: '#10B981', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {salesTotal.toLocaleString('pt-MZ')},00 MT
              </p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Vendas Totais Registradas</p>
            </div>
            <Link 
              to="/dashboard/pos"
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>Ir para POS Vendas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* NEW: Gráfico de Pizza (PieChart) - Distribution of Payment Methods - col-span-4 */}
        <div className="col-span-1 lg:col-span-4 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              <span>Distribuição por Método</span>
            </h3>
          </div>

          <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
            {dataPaymentPie.length === 0 ? (
              <div className="text-center text-gray-400 p-4">
                <PieIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-xs font-bold">Sem vendas registradas</p>
                <p className="text-[11px] text-gray-400 mt-1">Realize vendas no POS para exibir o gráfico de pizza.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPaymentPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataPaymentPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => `${Number(val).toLocaleString('pt-MZ')} MT`}
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff', borderRadius: '12px', fontWeight: 600 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real Wallets Bento Cards - col-span-4 */}
        <div className="col-span-1 lg:col-span-4 space-y-4 flex flex-col">
          <div className="flex-1 bg-[#0F172A] rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[150px]">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center font-bold text-base shadow-lg shadow-red-500/30">M</div>
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Carteira Móvel</p>
              </div>
              <p className="text-xs text-white/70 mb-1 font-medium">Saldo M-Pesa Acumulado</p>
              <p className="text-2xl font-black tracking-tight">
                {mpesaBalance.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-white/70">MT</span>
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-500/20 rounded-full blur-2xl"></div>
          </div>

          <div className="flex-1 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[150px]">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-base text-white font-serif italic shadow-lg shadow-orange-500/30">e</div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Carteira Móvel</p>
              </div>
              <p className="text-xs text-gray-400 mb-1 font-medium">Saldo e-Mola Acumulado</p>
              <p className="text-2xl font-black tracking-tight text-white">
                {emolaBalance.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-gray-400">MT</span>
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Real Low Stock Alerts - col-span-4 */}
        <div className="col-span-1 lg:col-span-4 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-4">Alertas de Estoque Real</p>
            {lowStockProducts.length > 0 ? (
              <div className="flex items-center space-x-3 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Produto necessita reposição' : 'Produtos necessitam reposição'}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-3 mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Estoque 100% Regularizado</p>
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum produto em estoque baixo no momento.</p>
            ) : (
              lowStockProducts.slice(0, 4).map(prod => (
                <div key={prod.id} className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-gray-300 font-bold truncate max-w-[130px]">{prod.name}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    prod.stock_quantity === 0 
                      ? 'text-red-600 bg-red-50 dark:bg-red-900/30' 
                      : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'
                  }`}>
                    {prod.stock_quantity} {prod.unit}
                  </span>
                </div>
              ))
            )}
          </div>

          <Link 
            to="/dashboard/produtos"
            className="w-full py-2.5 mt-2 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center block"
          >
            Gerir Produtos
          </Link>
        </div>

        {/* Real Recent POS Transactions - col-span-4 */}
        <div className="col-span-1 lg:col-span-4 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col min-h-[300px]">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-4">Últimas Vendas POS Reais</p>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">Nenhuma venda realizada ainda.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Realize uma venda na Frente de Caixa para visualizar aqui.</p>
              </div>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-50 dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center text-xs font-black">
                      {(tx.customer_name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{tx.customer_name || 'Cliente Balcão'}</p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {tx.payment_method} • {new Date(tx.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {tx.total_amount.toLocaleString('pt-MZ')} MT
                    </p>
                    <p className="text-[9px] uppercase font-extrabold text-emerald-500 tracking-wider">
                      {tx.receipt_number}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
            <Link 
              to="/dashboard/pos"
              className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 transition-colors text-white text-xs font-bold tracking-wide rounded-2xl shadow-lg shadow-emerald-500/25 block text-center uppercase"
            >
              ABRIR POS VENDAS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
