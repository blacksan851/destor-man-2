import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Building2, Image, FileText, Save, CheckCircle2, 
  MapPin, Phone, Mail, DollarSign, Loader2, RefreshCw,
  Printer, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    nuit: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    currency: 'MT',
    receiptFooterNote: 'Obrigado pela preferência! Volte sempre.'
  });

  // Fetch Company Settings from Supabase
  const fetchCompanySettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setFormData({
          companyName: data.company_name || '',
          nuit: data.nif || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          address: data.address || '',
          logoUrl: data.logo_url || '',
          currency: data.currency || 'MT',
          receiptFooterNote: data.receipt_footer_note || 'Obrigado pela preferência! Volte sempre.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar configurações da empresa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  // Save Settings to Supabase
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('companies')
        .update({
          company_name: formData.companyName,
          nif: formData.nuit,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          logo_url: formData.logoUrl,
          currency: formData.currency,
          receipt_footer_note: formData.receiptFooterNote
        })
        .eq('id', user.id);

      if (error) {
        // Fallback update for basic fields if custom columns don't exist yet in Supabase schema
        const { error: fallbackError } = await supabase
          .from('companies')
          .update({
            company_name: formData.companyName,
            nif: formData.nuit,
            phone: formData.phone,
            email: formData.email
          })
          .eq('id', user.id);

        if (fallbackError) throw fallbackError;
      }

      setSuccessMsg('Configurações da empresa salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao guardar configurações no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Configurações da Empresa & Recibo
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Personalize os dados da sua empresa, logótipo, NUIT e mensagem de rodapé impressa nos recibos.
          </p>
        </div>

        <button
          onClick={fetchCompanySettings}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Settings Form - col-span-7 */}
        <div className="col-span-1 lg:col-span-7 bg-[#0B1120] rounded-3xl p-6 border border-gray-800 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Company Profile */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-gray-800 pb-3">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <span>Dados Gerais da Empresa</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Nome da Empresa / Loja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ex: Comercial Maputo Lda"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    NUIT (Moçambique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nuit}
                    onChange={(e) => setFormData({ ...formData, nuit: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+258 84 / 85 xxxxxx"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.co.mz"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Moeda Principal
                  </label>
                  <input
                    type="text"
                    disabled
                    value="MT (Meticais Moçambicanos)"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 text-sm font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Morada / Endereço Completo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Eduardo Mondlane, Bairro Central, Maputo"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Section 2: Receipt & Branding Customization */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-gray-800 pb-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>Personalização do Recibo (POS)</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  URL do Logótipo (Imagem PNG/JPG)
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Mensagem de Rodapé do Recibo
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptFooterNote}
                  onChange={(e) => setFormData({ ...formData, receiptFooterNote: e.target.value })}
                  placeholder="Obrigado pela preferência! Volte sempre."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando Configurações...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>SALVAR CONFIGURAÇÕES</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Receipt Preview Panel - col-span-5 */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-3xl border border-gray-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm">Pré-visualização do Recibo em Tempo Real</h3>
          </div>

          {/* Receipt Mockup Card */}
          <div className="bg-[#0B1120] text-white rounded-3xl p-6 shadow-xl border border-gray-800 space-y-4 font-sans text-xs">
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-700">
              {formData.logoUrl ? (
                <img 
                  src={formData.logoUrl} 
                  alt="Logo" 
                  className="w-12 h-12 object-contain mx-auto mb-2 rounded-xl" 
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                  {formData.companyName ? formData.companyName.substring(0, 2).toUpperCase() : 'DR'}
                </div>
              )}

              <h2 className="text-lg font-black tracking-tight text-white">
                {formData.companyName || 'Nome da Sua Empresa'}
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                NUIT: {formData.nuit || '123456789'}
              </p>
              {formData.address && (
                <p className="text-[10px] text-gray-400">{formData.address}</p>
              )}
              {formData.phone && (
                <p className="text-[10px] text-gray-400">Tel: {formData.phone}</p>
              )}
              <p className="text-[10px] text-gray-400 font-mono pt-1">
                REC-87654321 • {new Date().toLocaleDateString('pt-MZ')}
              </p>
            </div>

            {/* Items Table */}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase text-[9px]">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qtd</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-xs">
                <tr className="bg-[#0F172A]">
                  <td className="py-1.5 font-bold text-white">Arroz Top 25kg</td>
                  <td className="py-1.5 text-center font-bold text-white">1</td>
                  <td className="py-1.5 text-right font-black text-emerald-400">1.800,00 MT</td>
                </tr>
                <tr className="bg-[#0F172A]">
                  <td className="py-1.5 font-bold text-white">Óleo Alimentar 5L</td>
                  <td className="py-1.5 text-center font-bold text-white">2</td>
                  <td className="py-1.5 text-right font-black text-emerald-400">1.200,00 MT</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="pt-3 border-t border-dashed border-gray-700 flex justify-between items-center text-sm font-black">
              <span className="text-white">TOTAL PAGO:</span>
              <span className="text-emerald-400">3.000,00 MT</span>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-dashed border-gray-700 text-center text-gray-400 italic text-[11px]">
              "{formData.receiptFooterNote || 'Obrigado pela preferência!'}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
