import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, 
  BarChart2, FileText, Download, Printer, RefreshCw, Loader2,
  Calendar, ArrowUpRight, ArrowDownRight, Package, CheckCircle2,
  Lock, Zap, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface ProductProfitReport {
  id: string;
  name: string;
  category: string;
  quantity_sold: number;
  sale_price: number;
  cost_price: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  margin_percent: number;
}

interface FinancialBarChartItem {
  period: string;
  receita: number;
  custo: number;
  lucro: number;
}

export function Reports() {
  const { companyPlan, onOpenUpgradeModal } = useOutletContext<{ companyPlan?: string; onOpenUpgradeModal?: () => void }>() || {};
  const isBasePlan = companyPlan === 'Base';

  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'Hoje' | '7dias' | 'EsteMes' | 'Todas'>('Todas');

  // DRE Metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);

  // Reports data
  const [productReports, setProductReports] = useState<ProductProfitReport[]>([]);
  const [financialChartData, setFinancialChartData] = useState<FinancialBarChartItem[]>([]);
  const [paymentPieData, setPaymentPieData] = useState<{ name: string; value: number; color: string }[]>([]);

  // Fetch Financial & Sales Data from Supabase
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Fetch Sale Items
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('*');

      // 3. Fetch Products (for cost_price)
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user.id);

      const productsMap: { [id: string]: any } = {};
      (productsData || []).forEach(p => {
        productsMap[p.id] = p;
      });

      // Filter sales by date range
      const salesList = (salesData || []).filter(s => {
        if (periodFilter === 'Hoje') {
          return new Date(s.created_at).toDateString() === new Date().toDateString();
        }
        if (periodFilter === '7dias') {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          return new Date(s.created_at) >= d;
        }
        if (periodFilter === 'EsteMes') {
          const d = new Date();
          return new Date(s.created_at).getMonth() === d.getMonth() && new Date(s.created_at).getFullYear() === d.getFullYear();
        }
        return true;
      });

      // Compute Revenue & Costs
      let sumRevenue = 0;
      let sumCost = 0;

      const prodMapAgg: { [prodName: string]: ProductProfitReport } = {};

      salesList.forEach(sale => {
        sumRevenue += sale.total_amount || 0;
      });

      (saleItemsData || []).forEach((item: any) => {
        const matchingProduct = productsMap[item.product_id] || {};
        const costPrice = matchingProduct.cost_price || (item.unit_price * 0.6); // default 60% CPV fallback
        const itemQty = item.quantity || 1;
        const itemRev = item.subtotal || (item.unit_price * itemQty);
        const itemCost = costPrice * itemQty;
        const itemProfit = itemRev - itemCost;

        sumCost += itemCost;

        const name = item.product_name || 'Produto sem nome';
        if (!prodMapAgg[name]) {
          prodMapAgg[name] = {
            id: item.product_id || name,
            name,
            category: matchingProduct.category || 'Geral',
            quantity_sold: itemQty,
            sale_price: item.unit_price,
            cost_price: costPrice,
            total_revenue: itemRev,
            total_cost: itemCost,
            total_profit: itemProfit,
            margin_percent: itemRev > 0 ? (itemProfit / itemRev) * 100 : 0
          };
        } else {
          prodMapAgg[name].quantity_sold += itemQty;
          prodMapAgg[name].total_revenue += itemRev;
          prodMapAgg[name].total_cost += itemCost;
          prodMapAgg[name].total_profit += itemProfit;
          prodMapAgg[name].margin_percent = (prodMapAgg[name].total_profit / prodMapAgg[name].total_revenue) * 100;
        }
      });

      const computedProfit = sumRevenue - sumCost;
      const computedMargin = sumRevenue > 0 ? (computedProfit / sumRevenue) * 100 : 0;

      setTotalRevenue(sumRevenue);
      setTotalCost(sumCost);
      setGrossProfit(computedProfit);
      setProfitMargin(computedMargin);

      setProductReports(Object.values(prodMapAgg).sort((a, b) => b.total_profit - a.total_profit));

      // Bar Chart Data (Weekly breakdown)
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const chartMap: { [day: string]: { receita: number; custo: number; lucro: number } } = {};
      
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        chartMap[dayName] = { receita: 0, custo: 0, lucro: 0 };
      }

      salesList.forEach(sale => {
        const dayName = days[new Date(sale.created_at).getDay()];
        if (chartMap[dayName]) {
          chartMap[dayName].receita += sale.total_amount || 0;
          chartMap[dayName].custo += (sale.total_amount || 0) * 0.6; // estimated cost proportion
          chartMap[dayName].lucro = chartMap[dayName].receita - chartMap[dayName].custo;
        }
      });

      const formattedBar = Object.keys(chartMap).map(period => ({
        period,
        receita: chartMap[period].receita,
        custo: chartMap[period].custo,
        lucro: chartMap[period].lucro
      }));
      setFinancialChartData(formattedBar);

      // Pie Chart Data (Payment methods distribution)
      const mpesaSum = salesList.filter(s => s.payment_method === 'M-Pesa').reduce((a, s) => a + s.total_amount, 0);
      const emolaSum = salesList.filter(s => s.payment_method === 'e-Mola').reduce((a, s) => a + s.total_amount, 0);
      const cashSum = salesList.filter(s => s.payment_method === 'Dinheiro').reduce((a, s) => a + s.total_amount, 0);
      const fiadoSum = salesList.filter(s => s.payment_method === 'Fiado').reduce((a, s) => a + s.total_amount, 0);

      const pieList = [
        { name: 'M-Pesa', value: mpesaSum, color: '#EF4444' },
        { name: 'e-Mola', value: emolaSum, color: '#F97316' },
        { name: 'Dinheiro', value: cashSum, color: '#10B981' },
        { name: 'Fiado', value: fiadoSum, color: '#F59E0B' }
      ].filter(p => p.value > 0);

      setPaymentPieData(pieList);

    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBasePlan) {
      fetchReportData();
    }
  }, [periodFilter, isBasePlan]);

  // Export CSV
  const handleExportCSV = () => {
    if (productReports.length === 0) {
      alert('Nenhum dado disponível para exportar.');
      return;
    }

    const headers = ['Produto', 'Categoria', 'Quantidade Vendida', 'Faturamento (MT)', 'Custo Total (MT)', 'Lucro (MT)', 'Margem (%)'];
    const rows = productReports.map(p => [
      `"${p.name}"`,
      `"${p.category}"`,
      p.quantity_sold,
      p.total_revenue.toFixed(2),
      p.total_cost.toFixed(2),
      p.total_profit.toFixed(2),
      `${p.margin_percent.toFixed(1)}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Relatorio_Financeiro_DrGestor_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is on Base Plan, show Lock Banner
  if (isBasePlan) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-800 text-center space-y-6 relative overflow-hidden">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" /> Recurso Exclusivo do Plano Premium
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Relatórios Financeiros & DRE
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua empresa está atualmente no <strong className="text-white">Plano Base (300 MT/mês)</strong>. Faça upgrade para o <strong className="text-amber-400">Plano Premium (500 MT/mês)</strong> para desbloquear a análise de lucros brutos, margens por produto e exportação de faturas em Excel/PDF.
            </p>
          </div>

          <div className="pt-4 max-w-md mx-auto">
            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>DESBLOQUEAR PLANO PREMIUM (500 MT)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Relatórios Financeiros & DRE
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Análise detalhada de faturamento, custo de vendas, lucros brutos e margens de produto.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-fit">
        <Calendar className="w-4 h-4 text-gray-400 ml-2" />
        <span className="text-xs font-bold text-gray-400 mr-2">Período:</span>
        {(['Hoje', '7dias', 'EsteMes', 'Todas'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriodFilter(p)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === p
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {p === 'Hoje' ? 'Hoje' : p === '7dias' ? 'Últimos 7 dias' : p === 'EsteMes' ? 'Este Mês' : 'Todo o Histórico'}
          </button>
        ))}
      </div>

      {/* DRE Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Bruto</span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalRevenue.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-gray-400">MT</span>
            </p>
            <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Receita Total de Vendas
            </p>
          </div>
        </div>

        {/* Custo CPV */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo dos Produtos (CPV)</span>
            <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCost.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-gray-400">MT</span>
            </p>
            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Custos de Aquisição
            </p>
          </div>
        </div>

        {/* Lucro Bruto */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro Bruto Real</span>
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {grossProfit.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal text-gray-400">MT</span>
            </p>
            <p className="text-[11px] text-emerald-500 font-bold mt-1">
              Receita (-) Custos
            </p>
          </div>
        </div>

        {/* Margem % */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Margem de Lucro Média</span>
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {profitMargin.toFixed(1)} <span className="text-xs font-normal text-gray-400">%</span>
            </p>
            <p className="text-[11px] text-purple-500 font-bold mt-1">
              Rentabilidade Média
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Revenue vs Cost vs Profit */}
        <div className="col-span-1 lg:col-span-8 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col min-h-[340px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Desempenho Financeiro (Faturamento vs Custo vs Lucro)
          </h3>
          <div className="flex-1 w-full min-h-[220px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
                <span className="text-xs font-semibold">Carregando gráfico...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 600}} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff', borderRadius: '12px', fontWeight: 600 }}
                    formatter={(val: any) => `${Number(val).toLocaleString('pt-MZ')} MT`}
                  />
                  <Bar dataKey="receita" fill="#10B981" name="Faturamento" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" fill="#EF4444" name="Custo (CPV)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" fill="#3B82F6" name="Lucro Bruto" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Payment Method Distribution */}
        <div className="col-span-1 lg:col-span-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between min-h-[340px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            <span>Meios de Pagamento</span>
          </h3>

          <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
            {paymentPieData.length === 0 ? (
              <div className="text-center text-gray-400">
                <PieIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Sem vendas no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${Number(val).toLocaleString('pt-MZ')} MT`} />
                  <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Product Profitability Report Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            <span>Relatório de Rentabilidade por Produto</span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">{productReports.length} Produtos analisados</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Calculando margens de lucro dos produtos...</p>
          </div>
        ) : productReports.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Nenhum produto vendido no período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Produto</th>
                  <th className="py-3.5 px-6 text-center">Qtd Vendida</th>
                  <th className="py-3.5 px-6 text-right">Preço Venda</th>
                  <th className="py-3.5 px-6 text-right">Custo Unitário</th>
                  <th className="py-3.5 px-6 text-right">Faturamento Total</th>
                  <th className="py-3.5 px-6 text-right">Lucro Gerado (MT)</th>
                  <th className="py-3.5 px-6 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {productReports.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {prod.name}
                      <span className="block text-[10px] font-normal text-gray-400">{prod.category}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700 dark:text-gray-300">
                      {prod.quantity_sold}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-700 dark:text-gray-300">
                      {prod.sale_price.toLocaleString('pt-MZ')},00 MT
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400">
                      {prod.cost_price.toLocaleString('pt-MZ')},00 MT
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white">
                      {prod.total_revenue.toLocaleString('pt-MZ')},00 MT
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 dark:text-emerald-400">
                      +{prod.total_profit.toLocaleString('pt-MZ')},00 MT
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs">
                        {prod.margin_percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
