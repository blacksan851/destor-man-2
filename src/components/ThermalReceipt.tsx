import React from 'react';

export interface ThermalReceiptItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  unit_price?: number;
  subtotal: number;
}

export interface ThermalReceiptProps {
  companyName?: string;
  companyNuit?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  receiptFooterNote?: string;
  saleId?: string;
  date?: string;
  items?: ThermalReceiptItem[];
  totalAmount?: number;
  paymentMethod?: string;
  changeAmount?: number;
  customerName?: string;
  customerNuit?: string;
  paperWidth?: '58mm' | '80mm';
}

export function ThermalReceipt({
  companyName = 'Dr Gestor MZ',
  companyNuit = '000000000',
  companyPhone = '',
  companyAddress = '',
  logoUrl = '',
  receiptFooterNote = 'Obrigado pela preferência! Volte sempre.',
  saleId = 'REC-000001',
  date = new Date().toLocaleDateString('pt-MZ'),
  items = [],
  totalAmount = 0,
  paymentMethod = 'M-Pesa',
  changeAmount = 0,
  customerName,
  customerNuit,
  paperWidth = '80mm'
}: ThermalReceiptProps) {
  const is58mm = paperWidth === '58mm';
  const displayId = (saleId || 'REC-000001').substring(0, 12).toUpperCase();

  return (
    <div className={`thermal-receipt-container ${is58mm ? 'w-[58mm] max-w-[210px]' : 'w-[80mm] max-w-[290px]'} bg-white text-black font-mono text-[11px] leading-tight p-2 mx-auto select-none border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0`}>
      {/* Header Info */}
      <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1 print:block" />
        ) : (
          <div className="font-extrabold text-sm uppercase tracking-wider">
            *** {companyName} ***
          </div>
        )}

        <p className="font-bold text-xs uppercase">{companyName}</p>
        <p className="text-[10px]">NUIT: {companyNuit}</p>
        {companyAddress && <p className="text-[9px]">{companyAddress}</p>}
        {companyPhone && <p className="text-[9px]">Tel: {companyPhone}</p>}
      </div>

      {/* Sale Details Header */}
      <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>RECIBO #:</span>
          <span className="font-bold">{displayId}</span>
        </div>
        <div className="flex justify-between">
          <span>DATA:</span>
          <span>{date}</span>
        </div>
        {customerName && (
          <div className="flex justify-between font-bold pt-1">
            <span>CLIENTE:</span>
            <span>{customerName}</span>
          </div>
        )}
        {customerNuit && (
          <div className="flex justify-between text-[9px]">
            <span>NUIT CLIENTE:</span>
            <span>{customerNuit}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-black">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black text-[9px] uppercase font-bold">
              <th className="py-0.5">QTD x ITEM</th>
              <th className="py-0.5 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(items || []).map((item, idx) => {
              const priceVal = item.unitPrice ?? item.unit_price ?? 0;
              const subtotalVal = item.subtotal ?? 0;

              return (
                <tr key={idx} className="text-[10px]">
                  <td className="py-1 pr-1">
                    <div className="font-bold uppercase leading-none">{item.name || 'Produto'}</div>
                    <div className="text-[9px] text-gray-700">
                      {item.quantity || 1} x {priceVal.toLocaleString('pt-MZ')},00
                    </div>
                  </td>
                  <td className="py-1 text-right font-bold align-top">
                    {subtotalVal.toLocaleString('pt-MZ')},00 MT
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total & Payment Method */}
      <div className="py-2 border-b border-dashed border-black space-y-1">
        <div className="flex justify-between text-xs font-black">
          <span>TOTAL PAGO:</span>
          <span>{(totalAmount || 0).toLocaleString('pt-MZ')},00 MT</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>FORMA PGTO:</span>
          <span className="font-bold uppercase">{paymentMethod || 'M-Pesa'}</span>
        </div>
        {changeAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>TROCO ENTREGUE:</span>
            <span className="font-bold">{(changeAmount || 0).toLocaleString('pt-MZ')},00 MT</span>
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="pt-3 text-center text-[9px] space-y-1">
        <p className="italic">"{receiptFooterNote}"</p>
        <p className="font-bold pt-1">*** PROCESSADO POR DR GESTOR MZ ***</p>
        <p className="text-[8px]">Software de Gestão Empresarial Moçambicano</p>
      </div>

      {/* Tear Indicator */}
      <div className="mt-4 pt-2 border-t border-dotted border-gray-400 text-center text-[8px] text-gray-400 print:hidden">
        - - - CORTE O PAPEL AQUI - - -
      </div>
    </div>
  );
}
