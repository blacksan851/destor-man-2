import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  Smartphone, Banknote, CreditCard, CheckCircle2, 
  Printer, ArrowRight, Barcode, Camera, X, Loader2,
  Package, User, Filter, AlertTriangle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ThermalReceipt } from '../../components/ThermalReceipt';

interface Product {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  unit: string;
  image_url?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  debt_balance?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleReceipt {
  receipt_number: string;
  created_at: string;
  company_name: string;
  customer_name: string;
  payment_method: string;
  items: { name: string; quantity: number; unit_price: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  total_amount: number;
  cash_received?: number;
  change_amount?: number;
}

export function Pos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredCustomers, setRegisteredCustomers] = useState<CustomerOption[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mobile Tab State ('products' | 'cart')
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('balcao');
  const [customerNameInput, setCustomerNameInput] = useState('Cliente Balcão');
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'e-Mola' | 'Dinheiro' | 'Fiado'>('M-Pesa');
  const [cashReceived, setCashReceived] = useState('');
  const [processingSale, setProcessingSale] = useState(false);

  // Scanner & Receipt Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<SaleReceipt | null>(null);
  const [thermalPaperWidth, setThermalPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Fetch Products & Registered Customers
  const fetchPosData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user.id)
        .order('name', { ascending: true });

      if (prodData) {
        setProducts(prodData);
        const uniqueCats = Array.from(new Set(prodData.map(p => p.category || 'Geral')));
        setCategories(['Todos', ...uniqueCats]);
      }

      // Fetch real customers from Supabase
      const { data: custData } = await supabase
        .from('customers')
        .select('id, name, phone, debt_balance')
        .eq('company_id', user.id)
        .order('name', { ascending: true });

      if (custData) {
        setRegisteredCustomers(custData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosData();
  }, []);

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Estoque máximo atingido (${product.stock_quantity} ${product.unit || 'UN'}).`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock_quantity) {
            alert(`Estoque máximo disponível: ${item.product.stock_quantity}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
    setDiscountInput('0');
    setCashReceived('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountVal = parseFloat(discountInput) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);
  const cashRecNum = parseFloat(cashReceived) || 0;
  const changeAmount = paymentMethod === 'Dinheiro' ? Math.max(0, cashRecNum - totalAmount) : 0;

  // Process & Complete Sale
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Dinheiro' && cashRecNum < totalAmount) {
      alert('O valor em dinheiro recebido é inferior ao total da venda.');
      return;
    }

    if (paymentMethod === 'Fiado' && selectedCustomerId === 'balcao') {
      alert('Para vender a Fiado / Conta Corrente, por favor selecione um cliente cadastrado no sistema.');
      return;
    }

    setProcessingSale(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Fetch company name
      const { data: companyData } = await supabase
        .from('companies')
        .select('company_name')
        .eq('id', user.id)
        .maybeSingle();

      const companyName = companyData?.company_name || 'Dr Gestor MZ';
      const receiptNum = `REC-${Date.now().toString().slice(-8)}`;

      // 1. Deduct Stock in Supabase
      for (const item of cart) {
        const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id)
          .eq('company_id', user.id);
      }

      // 2. If Fiado, update customer's debt_balance in Supabase `customers`
      if (paymentMethod === 'Fiado' && selectedCustomerId !== 'balcao') {
        const targetCust = registeredCustomers.find(c => c.id === selectedCustomerId);
        if (targetCust) {
          const currentDebt = targetCust.debt_balance || 0;
          await supabase
            .from('customers')
            .update({ debt_balance: currentDebt + totalAmount })
            .eq('id', selectedCustomerId)
            .eq('company_id', user.id);
        }
      }

      const finalCustName = selectedCustomerId === 'balcao'
        ? customerNameInput
        : (registeredCustomers.find(c => c.id === selectedCustomerId)?.name || customerNameInput);

      // 3. Save Sale Record in Supabase
      const { data: saleRecord } = await supabase
        .from('sales')
        .insert([
          {
            company_id: user.id,
            receipt_number: receiptNum,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'Fiado' ? 'pending' : 'completed',
            customer_name: finalCustName,
            items_count: cart.reduce((acc, i) => acc + i.quantity, 0)
          }
        ])
        .select()
        .single();

      // 4. Save Sale Items in Supabase
      if (saleRecord) {
        const saleItemsPayload = cart.map(i => ({
          sale_id: saleRecord.id,
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          subtotal: i.product.price * i.quantity
        }));

        await supabase.from('sale_items').insert(saleItemsPayload);
      }

      // Build Receipt object for modal
      const receipt: SaleReceipt = {
        receipt_number: receiptNum,
        created_at: new Date().toLocaleString('pt-MZ'),
        company_name: companyName,
        customer_name: finalCustName,
        payment_method: paymentMethod,
        items: cart.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          subtotal: i.product.price * i.quantity
        })),
        subtotal,
        discount: discountVal,
        total_amount: totalAmount,
        cash_received: paymentMethod === 'Dinheiro' ? cashRecNum : undefined,
        change_amount: paymentMethod === 'Dinheiro' ? changeAmount : undefined
      };

      setCompletedReceipt(receipt);
      handleClearCart();
      fetchPosData(); // Refresh product stock & customers debt balances
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao processar venda: ${err.message}`);
    } finally {
      setProcessingSale(false);
    }
  };

  // Barcode Scanner logic
  const handleOpenScanner = () => {
    setManualBarcodeInput('');
    setIsScannerOpen(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'] });
        const loop = async () => {
          if (!videoRef.current || !mediaStreamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              handleScannedBarCode(codes[0].rawValue);
              return;
            }
          } catch (e) {}
          if (mediaStreamRef.current) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    } catch (err) {
      console.warn('Câmera indisponível:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleScannedBarCode = (code: string) => {
    stopCamera();
    setIsScannerOpen(false);
    
    // Find matching product in catalog by SKU
    const foundProduct = products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase());
    if (foundProduct) {
      handleAddToCart(foundProduct);
    } else {
      setSearchQuery(code);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-[#0F172A] text-white overflow-hidden relative transition-colors duration-200">
      {/* Mobile Tab Toggle Bar */}
      <div className="lg:hidden flex border-b border-gray-800 bg-[#0B1120] p-2 gap-2 shrink-0">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'products'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos / Catálogo</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all relative ${
            mobileTab === 'cart'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse absolute top-2 right-3" />
          )}
        </button>
      </div>

      {/* Left Column: Product Selection Grid */}
      <div className={`flex-1 flex flex-col p-4 sm:p-6 overflow-hidden border-r border-gray-800 bg-[#0F172A] ${
        mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Search & Scan Header */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do produto ou bipar código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#0B1120] border border-gray-800 rounded-2xl outline-none text-white text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenScanner}
            title="Bipar Código de Barras (Câmera)"
            className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Barcode className="w-5 h-5" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-[#0B1120] text-gray-300 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm font-medium">Carregando catálogo de vendas...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-300 font-bold">Nenhum produto disponível</p>
              <p className="text-xs text-gray-400 mt-1">Cadastre produtos na aba 'Produtos' para exibir na Frente de Caixa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOut = product.stock_quantity <= 0;
                const isLow = product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_alert;

                return (
                  <motion.div
                    key={product.id}
                    whileTap={!isOut ? { scale: 0.96 } : undefined}
                    onClick={() => !isOut && handleAddToCart(product)}
                    className={`p-4 bg-[#0B1120] rounded-2xl border transition-all flex flex-col justify-between select-none ${
                      isOut 
                        ? 'opacity-40 border-gray-800 cursor-not-allowed' 
                        : 'hover:border-emerald-500/50 border-gray-800 cursor-pointer shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      {product.image_url ? (
                        <div className="w-full h-32 rounded-xl mb-3 overflow-hidden border border-gray-800 bg-[#0F172A] relative group">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // If broken image URL, hide image and show initial letter fallback
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-xl mb-3 border border-gray-800 bg-[#0F172A] flex items-center justify-center text-emerald-400 font-black text-2xl shadow-inner">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#1E293B] text-gray-200 border border-gray-700 rounded-md">
                          {product.category || 'Geral'}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          isOut 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : isLow 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isOut ? '0 UN' : `${product.stock_quantity} ${product.unit || 'UN'}`}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      {product.sku && (
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{product.sku}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {product.price.toLocaleString('pt-MZ')},00 <span className="text-xs font-normal">MT</span>
                      </span>
                      <button 
                        disabled={isOut}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          isOut ? 'bg-gray-800 text-gray-600' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Order Cart & Payment Panel */}
      <div className={`w-full lg:w-[420px] bg-[#0F172A] flex flex-col h-full shadow-2xl border-l border-gray-800 ${
        mobileTab === 'products' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Cart Header & Customer Selection */}
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              <span>Carrinho de Vendas</span>
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={handleClearCart} 
                className="text-xs text-red-400 hover:underline font-bold"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Real Customer Selection Dropdown */}
          <div className="flex items-center gap-2 bg-[#0B1120] p-2.5 rounded-xl border border-gray-800">
            <User className="w-4 h-4 text-emerald-500" />
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value !== 'balcao') {
                  const found = registeredCustomers.find(c => c.id === e.target.value);
                  if (found) setCustomerNameInput(found.name);
                }
              }}
              className="w-full bg-transparent outline-none text-white text-xs font-semibold"
            >
              <option value="balcao" className="bg-[#0B1120] text-white">Cliente Balcão (Avulso)</option>
              {registeredCustomers.map((cust) => (
                <option key={cust.id} value={cust.id} className="bg-[#0B1120] text-white">
                  {cust.name} {cust.phone ? `(${cust.phone})` : ''} {cust.debt_balance && cust.debt_balance > 0 ? `• Fiado: ${cust.debt_balance} MT` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerId === 'balcao' && (
            <input
              type="text"
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              placeholder="Nome do cliente avulso..."
              className="w-full px-3 py-1.5 bg-[#0B1120] border border-gray-800 rounded-lg outline-none text-white text-xs font-medium placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-2" />
              <p className="text-sm font-bold">O carrinho está vazio</p>
              <p className="text-xs mt-1 text-gray-400">Clique nos produtos ao lado para adicionar itens à venda.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-3.5 bg-[#0B1120] rounded-2xl border border-gray-800 shadow-md">
                <div className="flex-1 min-w-0 pr-2">
                  <h5 className="font-bold text-white text-xs truncate">
                    {item.product.name}
                  </h5>
                  <p className="text-[11px] font-black text-emerald-400 mt-0.5">
                    {item.product.price.toLocaleString('pt-MZ')},00 MT
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-700 rounded-xl bg-[#1E293B] overflow-hidden">
                    <button 
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black text-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-black text-emerald-400 w-16 text-right">
                    {(item.product.price * item.quantity).toLocaleString('pt-MZ')} MT
                  </span>

                  <button 
                    onClick={() => handleRemoveFromCart(item.product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Methods & Totals Area */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-4">
          {/* Payment Method Selector Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Forma de Pagamento</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setPaymentMethod('M-Pesa')}
                className={`py-3 px-1.5 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  paymentMethod === 'M-Pesa' 
                    ? 'payment-active bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                    : 'border-gray-800 bg-[#0B1120] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>M-Pesa</span>
              </button>

              <button
                onClick={() => setPaymentMethod('e-Mola')}
                className={`py-3 px-1.5 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  paymentMethod === 'e-Mola' 
                    ? 'payment-active bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                    : 'border-gray-800 bg-[#0B1120] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>e-Mola</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Dinheiro')}
                className={`py-3 px-1.5 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  paymentMethod === 'Dinheiro' 
                    ? 'payment-active bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                    : 'border-gray-800 bg-[#0B1120] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Dinheiro</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Fiado')}
                className={`py-3 px-1.5 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  paymentMethod === 'Fiado' 
                    ? 'payment-active bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                    : 'border-gray-800 bg-[#0B1120] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Fiado</span>
              </button>
            </div>
          </div>

          {/* Cash Change Calculation Fields */}
          {paymentMethod === 'Dinheiro' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-gray-300 uppercase">Valor Recebido (MT)</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg outline-none text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-gray-300 uppercase">Troco a Devolver</label>
                <div className="mt-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-black">
                  {changeAmount.toLocaleString('pt-MZ')},00 MT
                </div>
              </div>
            </div>
          )}

          {/* Subtotal & Total Row */}
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span className="font-bold">{subtotal.toLocaleString('pt-MZ')},00 MT</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 dark:text-white pt-1">
              <span className="text-base font-black">TOTAL A PAGAR:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {totalAmount.toLocaleString('pt-MZ')},00 MT
              </span>
            </div>
          </div>

          {/* Finalize Button */}
          <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || processingSale}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {processingSale ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando Venda...</span>
              </>
            ) : (
              <>
                <span>FINALIZAR VENDA</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal: Camera Barcode Scanner */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-800 text-white p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold">Bipar Produto (POS)</h3>
                </div>
                <button 
                  onClick={() => { stopCamera(); setIsScannerOpen(false); }}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-emerald-500/50 m-12 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_#10B981] animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Leitor Físico USB / Código Manual</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bipar ou digitar SKU..."
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualBarcodeInput.trim()) {
                        handleScannedBarCode(manualBarcodeInput.trim());
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => manualBarcodeInput.trim() && handleScannedBarCode(manualBarcodeInput.trim())}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Digital Receipt / Fatura */}
      <AnimatePresence>
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-6 my-8"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                  Dr
                </div>
                <h2 className="text-xl font-black tracking-tight">{completedReceipt.company_name}</h2>
                <p className="text-xs text-gray-500 font-mono">Comprovativo de Venda • {completedReceipt.receipt_number}</p>
                <p className="text-xs text-gray-400">{completedReceipt.created_at}</p>
              </div>

              {/* Transaction Meta */}
              <div className="flex justify-between items-center text-xs py-2 bg-gray-50 px-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Cliente</span>
                  <span className="font-bold">{completedReceipt.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Pagamento</span>
                  <span className="font-bold text-emerald-600">{completedReceipt.payment_method}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-gray-400 uppercase text-[10px]">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qtd</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedReceipt.items.map((item, idx) => (
                      <tr key={idx} className="py-1.5">
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 text-right font-black">{item.subtotal.toLocaleString('pt-MZ')} MT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Change Breakdown */}
              <div className="pt-3 border-t border-dashed border-gray-300 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>{completedReceipt.subtotal.toLocaleString('pt-MZ')},00 MT</span>
                </div>
                {completedReceipt.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto:</span>
                    <span>-{completedReceipt.discount.toLocaleString('pt-MZ')},00 MT</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                  <span>VALOR PAGO / REGISTRADO:</span>
                  <span className="text-emerald-600">{completedReceipt.total_amount.toLocaleString('pt-MZ')},00 MT</span>
                </div>
                {completedReceipt.cash_received !== undefined && (
                  <>
                    <div className="flex justify-between text-gray-500 pt-1">
                      <span>Valor Entregue:</span>
                      <span>{completedReceipt.cash_received.toLocaleString('pt-MZ')},00 MT</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>Troco Devolvido:</span>
                      <span>{completedReceipt.change_amount?.toLocaleString('pt-MZ')},00 MT</span>
                    </div>
                  </>
                )}
              </div>

              {/* Paper Width Selector for Thermal Printers */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-500" /> Formato de Talão Térmico:
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('80mm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      thermalPaperWidth === '80mm'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    80mm (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('58mm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      thermalPaperWidth === '58mm'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    58mm (Fino)
                  </button>
                </div>
              </div>

              {/* Thermal Receipt Preview Box */}
              <div className="overflow-y-auto max-h-[300px] border border-gray-100 rounded-2xl p-2 bg-gray-50">
                <ThermalReceipt
                  companyName={completedReceipt.company_name}
                  companyNuit="123456789"
                  saleId={completedReceipt.receipt_number}
                  date={completedReceipt.created_at}
                  items={completedReceipt.items}
                  totalAmount={completedReceipt.total_amount}
                  paymentMethod={completedReceipt.payment_method}
                  changeAmount={completedReceipt.change_amount || 0}
                  customerName={completedReceipt.customer_name}
                  paperWidth={thermalPaperWidth}
                />
              </div>

              {/* Receipt Footer Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>IMPRIMIR TALÃO ({thermalPaperWidth})</span>
                </button>
                <button
                  onClick={() => setCompletedReceipt(null)}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <span>NOVA VENDA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
