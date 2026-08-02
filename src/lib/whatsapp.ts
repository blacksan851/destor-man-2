/**
 * Utilitário de Integração com WhatsApp para Cobrança de Fiado (Dr Gestor MZ)
 */

export function formatMozambiquePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('258') && cleaned.length === 12) {
    return cleaned;
  }

  // If 9 digits starting with 82, 83, 84, 85, 86, 87
  if (cleaned.length === 9 && /^8[2-7]/.test(cleaned)) {
    return `258${cleaned}`;
  }

  return cleaned;
}

export interface SendDebtNotificationOptions {
  customerName: string;
  customerPhone: string;
  companyName: string;
  companyPhone?: string;
  debtAmount: number;
}

export function sendDebtNotificationWhatsApp({
  customerName,
  customerPhone,
  companyName,
  companyPhone,
  debtAmount
}: SendDebtNotificationOptions) {
  const cleanPhone = formatMozambiquePhone(customerPhone);
  if (!cleanPhone) {
    alert('Número de telefone do cliente inválido para WhatsApp.');
    return;
  }

  const formattedAmount = `${debtAmount.toLocaleString('pt-MZ')},00 MT`;
  const paymentContact = companyPhone ? `para o número *${companyPhone}*` : 'através das nossas carteiras móveis';

  const message = `Olá *${customerName}*, tudo bem? 👋\n\nEscrevemos da empresa *${companyName}*.\n\nConsta registado no nosso sistema um saldo pendente (fiado) no valor de *${formattedAmount}*.\n\nPoderá efetuar o pagamento via M-Pesa ou e-Mola ${paymentContact}.\n\nAgradecemos a sua preferência e ficamos à disposição! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}

export interface SendPayoffReceiptOptions {
  customerName: string;
  customerPhone: string;
  companyName: string;
  paidAmount: number;
  remainingBalance: number;
}

export function sendPayoffReceiptWhatsApp({
  customerName,
  customerPhone,
  companyName,
  paidAmount,
  remainingBalance
}: SendPayoffReceiptOptions) {
  const cleanPhone = formatMozambiquePhone(customerPhone);
  if (!cleanPhone) return;

  const paidFormatted = `${paidAmount.toLocaleString('pt-MZ')},00 MT`;
  const remainingFormatted = `${remainingBalance.toLocaleString('pt-MZ')},00 MT`;

  const message = `Olá *${customerName}*! ✅\n\nConfirmamos o pagamento/abate no valor de *${paidFormatted}* no seu fiado na empresa *${companyName}*.\n\nSeu saldo devedor atualizado é de: *${remainingFormatted}*.\n\nMuito obrigado pela preferência! 🙌`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}
