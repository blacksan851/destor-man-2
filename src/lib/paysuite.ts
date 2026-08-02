import { supabase } from './supabase';

export interface PaySuitePaymentParams {
  amount: number;
  method: 'mpesa' | 'emola' | 'credit_card';
  reference: string;
  description?: string;
  return_url?: string;
  webhook_url?: string;
}

export interface PaySuitePayoutParams {
  amount: number;
  currency: 'MZN';
  reference: string;
  method: 'mpesa' | 'emola' | 'mkesh' | 'bank' | 'bank_transfer';
  beneficiary: {
    phone?: string;
    holder: string;
    nib?: string;
  };
  description?: string;
  webhook_url?: string;
}

export interface PaySuiteRefundParams {
  payment_id: string;
  amount: number;
  reason: string;
  webhook_url?: string;
}

export interface PaySuiteWebhookEvent {
  event: 'payment.success' | 'payment.failed' | 'payout.success' | 'payout.failed' | 'refund.success' | 'refund.failed';
  data: {
    id: string;
    payment_id?: string;
    amount: number;
    reference: string;
    method?: string;
    status?: string;
  };
}

const PAYSUITE_API_URL = 'https://paysuite.tech/api/v1';

export class PaySuiteClient {
  private apiToken: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || import.meta.env.VITE_PAYSUITE_API_TOKEN || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create a new payment request (M-Pesa, e-Mola)
   */
  async createPayment(params: PaySuitePaymentParams) {
    if (!this.apiToken) {
      console.warn('PaySuite API token not set. Operating in fallback simulation mode.');
      return {
        status: 'success',
        data: {
          id: `PAY-${Date.now()}`,
          amount: params.amount,
          reference: params.reference,
          status: 'pending',
          checkout_url: `https://paysuite.tech/checkout/PAY-${Date.now()}`
        }
      };
    }

    const response = await fetch(`${PAYSUITE_API_URL}/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  /**
   * Get specific payment details by ULID
   */
  async getPayment(paymentId: string) {
    if (!this.apiToken) {
      return {
        status: 'success',
        data: { id: paymentId, status: 'paid' }
      };
    }

    const response = await fetch(`${PAYSUITE_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    return await response.json();
  }

  /**
   * Create a Payout Request (Withdrawal / Transfer to M-Pesa / e-Mola / Bank)
   */
  async createPayout(params: PaySuitePayoutParams) {
    if (!this.apiToken) {
      return {
        status: 'success',
        data: {
          id: `PO-${Date.now()}`,
          amount: params.amount,
          reference: params.reference,
          status: 'pending'
        }
      };
    }

    const response = await fetch(`${PAYSUITE_API_URL}/payouts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  /**
   * Create a Refund request for completed payment
   */
  async createRefund(params: PaySuiteRefundParams) {
    if (!this.apiToken) {
      return {
        status: 'success',
        data: {
          id: `RF-${Date.now()}`,
          payment_id: params.payment_id,
          amount: params.amount,
          status: 'pending'
        }
      };
    }

    const response = await fetch(`${PAYSUITE_API_URL}/refunds`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  /**
   * Verify Webhook HMAC-SHA256 Signature
   */
  static async verifyWebhookSignature(payloadString: string, signature: string, secret: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign(
        'HMAC', cryptoKey, encoder.encode(payloadString)
      );

      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const calculatedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return calculatedHex === signature;
    } catch {
      return false;
    }
  }
}

export const paySuite = new PaySuiteClient();
