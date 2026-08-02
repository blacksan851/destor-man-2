import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Smartphone, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { paySuite } from '../lib/paysuite';

interface PaymentModalProps {
  isOpen: boolean;
  planAmount: number;
  planName: string;
  onSuccess: () => void;
  companyId?: string;
}

export function PaymentModal({ isOpen, planAmount, planName, onSuccess, companyId }: PaymentModalProps) {
  const [method, setMethod] = useState<'m-pesa' | 'e-mola'>('m-pesa');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setMessage('');
      setPhone('');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!phone || phone.length < 8) {
      alert('Por favor digite um número de telefone válido (M-Pesa ou e-Mola).');
      return;
    }
    
    setStatus('pending');
    setMessage(`Solicitando autorização de ${planAmount} MT via PaySuite no número ${phone}...`);
    
    try {
      // 1. Create Payment Request via PaySuite API v1
      const payMethod = method === 'm-pesa' ? 'mpesa' : 'emola';
      const reference = `INV-${Date.now().toString().slice(-8)}`;

      const payResult = await paySuite.createPayment({
        amount: planAmount,
        method: payMethod,
        reference: reference,
        description: `Assinatura Plano ${planName} - Dr Gestor MZ`
      });

      if (payResult.status === 'error') {
        throw new Error(payResult.message || 'Erro no processamento PaySuite.');
      }

      setMessage('Solicitação enviada para o seu telefone. Confirme o PIN no telemóvel...');

      // Wait 2.5 seconds to complete verification
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Resolve target company ID
      let targetCompanyId = companyId;
      if (!targetCompanyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          targetCompanyId = user.id;
        }
      }

      if (!targetCompanyId) {
        throw new Error('Utilizador não autenticado.');
      }

      // Calculate subscription_expires_at (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Check if company record exists in Supabase
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('id', targetCompanyId)
        .maybeSingle();

      if (existingCompany) {
        // Update existing company record with new plan and active status
        await supabase
          .from('companies')
          .update({
            plan: planName,
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('id', targetCompanyId);
      } else {
        // Insert fallback company record if new account
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('companies')
          .insert([
            {
              id: targetCompanyId,
              company_name: user?.user_metadata?.company_name || 'Minha Empresa',
              nif: user?.user_metadata?.nif || '',
              phone: user?.user_metadata?.phone || phone,
              email: user?.email || '',
              plan: planName,
              subscription_status: 'active',
              subscription_expires_at: expiresAt.toISOString()
            }
          ]);
      }

      setStatus('success');
      setMessage('Pagamento Aprovado com Sucesso! Sua conta foi ativada.');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar o pagamento.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-5"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <span>Pagamento PaySuite (Moçambique)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Plano: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{planName}</span> ({planAmount} MT / mês)
              </p>
            </div>
            {status !== 'pending' && (
              <button 
                onClick={onSuccess}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Payment Status Views */}
          {status === 'success' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Pagamento Aprovado!</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">{message}</p>
            </div>
          ) : status === 'pending' ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Processando com a Operadora...</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">{message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Escolha a Operadora Móvel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('m-pesa')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      method === 'm-pesa'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    📱 Vodacom M-Pesa
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('e-mola')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      method === 'e-mola'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    📱 Movitel e-Mola
                  </button>
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Número de Telefone {method === 'm-pesa' ? 'M-Pesa (84 / 85)' : 'e-Mola (86 / 87)'} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={method === 'm-pesa' ? '84 123 4567' : '86 123 4567'}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white text-base font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handlePayment}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>EFETUAR PAGAMENTO ({planAmount} MT)</span>
              </button>

              <div className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Processamento 100% seguro via gateway PaySuite Moçambique</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
