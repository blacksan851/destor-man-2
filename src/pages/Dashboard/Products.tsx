import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, 
  AlertTriangle, CheckCircle2, XCircle, DollarSign, 
  Loader2, X, RefreshCw, Barcode, Scan, FolderPlus,
  Camera, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

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
  created_at?: string;
}

interface Category {
  id: string;
  company_id: string;
  name: string;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Modal states for Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal states for Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Scanner Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'sku'>('search');
  const [cameraActive, setCameraActive] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Alimentação',
    price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_alert: '5',
    unit: 'UN',
    image_url: ''
  });

  const defaultCategories = ['Alimentação', 'Bebidas', 'Higiene & Limpeza', 'Eletrónicos', 'Outros'];
  const allCategories = ['Todas', ...Array.from(new Set([...defaultCategories, ...dbCategories]))];

  // Fetch products and categories from Supabase
  const fetchData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (prodError && prodError.code === '42P01') {
        setDbError('A tabela "products" ainda não existe no seu Supabase. Execute o script SQL fornecido no plano para ativá-la.');
      } else if (prodError) {
        setDbError(prodError.message);
      } else {
        setProducts(prodData || []);
      }

      // 2. Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .eq('company_id', user.id);

      if (catData && catData.length > 0) {
        setDbCategories(catData.map((c: any) => c.name));
      }
    } catch (err: any) {
      console.error(err);
      setDbError('Erro de conexão ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle open modal for create product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: dbCategories[0] || 'Alimentação',
      price: '',
      cost_price: '',
      stock_quantity: '',
      min_stock_alert: '5',
      unit: 'UN',
      image_url: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle open modal for edit product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      category: product.category || 'Alimentação',
      price: product.price.toString(),
      cost_price: product.cost_price ? product.cost_price.toString() : '0',
      stock_quantity: product.stock_quantity.toString(),
      min_stock_alert: product.min_stock_alert.toString(),
      unit: product.unit || 'UN',
      image_url: product.image_url || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Category to Supabase
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSubmittingCategory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const catName = newCategoryName.trim();

      // Insert category into database
      const { error } = await supabase
        .from('categories')
        .insert([{ company_id: user.id, name: catName }]);

      if (error && error.code !== '42P01') {
        throw error;
      }

      setDbCategories(prev => [...prev, catName]);
      setFormData(prev => ({ ...prev, category: catName }));
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      alert(`Aviso ao salvar categoria: ${err.message}`);
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Save (Create / Edit) Product
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('O nome do produto é obrigatório.');
      return;
    }

    const priceNum = parseFloat(formData.price) || 0;
    const costNum = parseFloat(formData.cost_price) || 0;
    const stockNum = parseInt(formData.stock_quantity) || 0;
    const minAlertNum = parseInt(formData.min_stock_alert) || 5;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      if (editingProduct) {
        // Update product
        const payload: any = {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: priceNum,
          cost_price: costNum,
          stock_quantity: stockNum,
          min_stock_alert: minAlertNum,
          unit: formData.unit,
        };
        if (formData.image_url) {
          payload.image_url = formData.image_url;
        }

        let { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .eq('company_id', user.id);

        // Fallback: If image_url column is missing in DB schema cache, retry without image_url
        if (error && error.message?.includes("image_url")) {
          delete payload.image_url;
          const retryRes = await supabase
            .from('products')
            .update(payload)
            .eq('id', editingProduct.id)
            .eq('company_id', user.id);
          error = retryRes.error;
        }

        if (error) throw error;
      } else {
        // Create product
        const payload: any = {
          company_id: user.id,
          name: formData.name,
          sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}`,
          category: formData.category,
          price: priceNum,
          cost_price: costNum,
          stock_quantity: stockNum,
          min_stock_alert: minAlertNum,
          unit: formData.unit
        };

        if (formData.image_url) {
          payload.image_url = formData.image_url;
        }

        let { error } = await supabase
          .from('products')
          .insert([payload]);

        // Fallback: If image_url column is missing in DB schema cache, retry without image_url
        if (error && error.message?.includes("image_url")) {
          delete payload.image_url;
          const retryRes = await supabase
            .from('products')
            .insert([payload]);
          error = retryRes.error;
        }

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao guardar produto no Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('company_id', user.id);

      if (error) throw error;

      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao eliminar produto: ${err.message}`);
    }
  };

  // Camera & Barcode Scanner logic
  const handleOpenScanner = (target: 'search' | 'sku') => {
    setScannerTarget(target);
    setManualBarcodeInput('');
    setIsScannerOpen(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);

      // Attempt native BarcodeDetector if supported
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
        });

        const detectLoop = async () => {
          if (!videoRef.current || !mediaStreamRef.current) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              applyScannedCode(code);
              return;
            }
          } catch (e) {
            // Detector loop error ignore
          }
          if (mediaStreamRef.current) {
            requestAnimationFrame(detectLoop);
          }
        };
        requestAnimationFrame(detectLoop);
      }
    } catch (err) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCloseScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
  };

  const applyScannedCode = (code: string) => {
    stopCamera();
    setIsScannerOpen(false);

    if (scannerTarget === 'search') {
      setSearchQuery(code);
    } else if (scannerTarget === 'sku') {
      setFormData(prev => ({ ...prev, sku: code }));
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate KPIs
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Produtos & Estoque
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Controle os itens à venda, scanner de código de barras, categorias e alertas de reposição.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-3 bg-[#0B1120] border border-gray-800 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-emerald-500" />
            <span>+ Categoria</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* DB Table Alert if Missing */}
      {dbError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Atenção sobre o Banco de Dados</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{dbError}</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recarregar
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1120] p-5 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total de Produtos</p>
            <p className="text-2xl font-bold text-white">{totalProducts}</p>
          </div>
        </div>

        <div className="bg-[#0B1120] p-5 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Estoque Baixo</p>
            <p className="text-2xl font-bold text-amber-400">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-[#0B1120] p-5 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Esgotados</p>
            <p className="text-2xl font-bold text-red-400">{outOfStockCount}</p>
          </div>
        </div>

        <div className="bg-[#0B1120] p-5 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Valor em Inventário</p>
            <p className="text-2xl font-bold text-white">
              {totalInventoryValue.toLocaleString('pt-MZ')},00 MT
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Barcode Scanner Controls */}
      <div className="bg-[#0B1120] p-4 rounded-2xl border border-gray-800 shadow-xl flex flex-col sm:flex-row justify-between gap-4">
        {/* Search Bar with Scanner Button */}
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do produto ou escaneie o código SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#0F172A] border border-gray-800 rounded-xl outline-none text-white focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleOpenScanner('search')}
            title="Escanear Código de Barras / Câmera"
            className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Barcode className="w-5 h-5" />
            <span className="hidden md:inline">Escanear</span>
          </button>
        </div>

        {/* Dynamic Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table View */}
      <div className="bg-[#0B1120] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">Carregando catálogo de produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum produto encontrado</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || selectedCategory !== 'Todas'
                ? 'Tente me ajustar os seus filtros de pesquisa para encontrar o item.'
                : 'Você ainda não cadastrou nenhum produto no seu inventário.'}
            </p>
            {!searchQuery && selectedCategory === 'Todas' && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Cadastrar Primeiro Produto
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#0F172A] text-xs font-black text-gray-300 uppercase tracking-wider">
                    <th className="py-4 px-6">Produto</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Preço Venda</th>
                    <th className="py-4 px-6">Preço Custo</th>
                    <th className="py-4 px-6">Estoque atual</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#0F172A] text-sm">
                  {filteredProducts.map((p) => {
                    const isOut = p.stock_quantity <= 0;
                    const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert;

                    return (
                      <tr key={p.id} className="bg-[#0F172A] hover:bg-[#1E293B] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-700 bg-gray-800 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-white flex items-center gap-2 text-sm">
                                <span>{p.name}</span>
                              </div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-emerald-500" />
                                <span>{p.sku || 'Sem SKU'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          <span className="px-2.5 py-1 bg-[#1E293B] border border-gray-700 rounded-lg text-xs font-bold text-gray-200">
                            {p.category || 'Geral'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-black text-white text-sm">
                          {p.price.toLocaleString('pt-MZ')},00 MT
                        </td>
                        <td className="py-4 px-6 text-gray-400 font-semibold">
                          {p.cost_price ? `${p.cost_price.toLocaleString('pt-MZ')},00 MT` : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                              {p.stock_quantity} {p.unit || 'UN'}
                            </span>

                            {isOut && (
                              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800 rounded-md">
                                Esgotado
                              </span>
                            )}
                            {isLow && (
                              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Baixo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Editar produto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-800 bg-[#0F172A]">
            {filteredProducts.map((p) => {
              const isOut = p.stock_quantity <= 0;
              const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert;

              return (
                <div key={p.id} className="p-4 space-y-3 bg-[#0F172A] hover:bg-[#1E293B] transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-gray-700 bg-gray-800 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-base">{p.name}</h4>
                        <p className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-emerald-500" />
                          <span>{p.sku || 'Sem SKU'}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#1E293B] border border-gray-700 rounded-lg text-xs font-semibold text-gray-200 shrink-0">
                      {p.category || 'Geral'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#1E293B] p-3 rounded-xl border border-gray-800">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Preço Venda</p>
                      <p className="font-black text-emerald-400 text-sm">
                        {p.price.toLocaleString('pt-MZ')},00 MT
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Estoque</p>
                      <div className="flex items-center gap-1">
                        <span className={`font-black text-xs ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                          {p.stock_quantity} {p.unit || 'UN'}
                        </span>
                        {isOut && <span className="text-[9px] font-extrabold text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded">Esgotado</span>}
                        {isLow && <span className="text-[9px] font-extrabold text-amber-400 bg-amber-900/40 px-1.5 py-0.5 rounded">Baixo</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 text-slate-700 dark:text-gray-300 hover:text-emerald-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      {/* Modal: Create / Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 my-8"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Arroz 25kg Top"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Imagem do Produto (URL da foto)
                  </label>
                  <div className="flex gap-2 items-center">
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-11 h-11 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50" />
                    )}
                    <input
                      type="url"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem-do-produto.jpg"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Insira a URL de uma imagem da internet para ser exibida no POS e no Catálogo.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 flex justify-between items-center">
                      <span>SKU / Código</span>
                      <button
                        type="button"
                        onClick={() => handleOpenScanner('sku')}
                        className="text-xs text-emerald-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Scan className="w-3 h-3" /> Escanear
                      </button>
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Ex: 5601234567"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 flex justify-between items-center">
                      <span>Categoria</span>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-xs text-emerald-500 font-bold hover:underline cursor-pointer"
                      >
                        + Nova
                      </button>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-medium"
                    >
                      {allCategories.filter(c => c !== 'Todas').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Preço de Venda (MT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Preço de Custo (MT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Estoque Inicial *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Alerta Mínimo
                    </label>
                    <input
                      type="number"
                      value={formData.min_stock_alert}
                      onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                      placeholder="5"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-medium"
                    >
                      <option value="UN">UN</option>
                      <option value="KG">KG</option>
                      <option value="L">L</option>
                      <option value="Pacote">Pacote</option>
                      <option value="Caixa">Caixa</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Create Category */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-emerald-500" />
                  <span>Cadastrar Nova Categoria</span>
                </h3>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Mercearia, Padaria, Talho..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCategory || !newCategoryName.trim()}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Categoria'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Camera / Barcode Scanner */}
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
                  <h3 className="text-lg font-bold">Leitor de Código de Barras</h3>
                </div>
                <button 
                  onClick={handleCloseScanner}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Camera Video / Reticle Container */}
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser Overlay Animation */}
                <div className="absolute inset-0 border-2 border-emerald-500/50 m-12 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_#10B981] animate-pulse"></div>
                </div>

                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Barcode className="w-12 h-12 text-emerald-500 opacity-60" />
                    <p className="text-sm font-medium text-gray-300">
                      Aponte a câmera para o código de barras ou insira o número manualmente abaixo.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Input Fallback */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Entrada Manual ou Leitor USB</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite ou escaneie com leitor físico..."
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualBarcodeInput.trim()) {
                        applyScannedCode(manualBarcodeInput.trim());
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl outline-none text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    onClick={() => manualBarcodeInput.trim() && applyScannedCode(manualBarcodeInput.trim())}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Delete */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Produto?</h3>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita. O produto será removido permanentemente do seu inventário.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
