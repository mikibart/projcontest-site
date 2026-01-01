import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface PaymentModalProps {
  contest: {
    id: string;
    title: string;
    budget: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  contest,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const platformFee = contest.budget * 0.05;

  const handleStripePayment = async () => {
    setLoading('stripe');
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contestId: contest.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del pagamento');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading('paypal');
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contestId: contest.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del pagamento');
      }

      // Redirect to PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-neutral-text">
              Pubblica il tuo concorso
            </h2>
            <p className="text-neutral-muted text-sm mt-2">
              Paga la quota di pubblicazione per attivare il concorso
            </p>
          </div>

          {/* Contest Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-neutral-text mb-2">{contest.title}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-muted">Budget concorso:</span>
              <span className="font-medium">{contest.budget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-neutral-muted">Quota di pubblicazione (5%):</span>
              <span className="font-bold text-primary">{platformFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-3">
            {/* Stripe */}
            <button
              onClick={handleStripePayment}
              disabled={loading !== null}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#635bff]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635bff"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-neutral-text">Carta di credito</div>
                  <div className="text-xs text-neutral-muted">Visa, Mastercard, AMEX</div>
                </div>
              </div>
              {loading === 'stripe' ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : (
                <span className="text-primary font-medium">{platformFee.toLocaleString()}</span>
              )}
            </button>

            {/* PayPal */}
            <button
              onClick={handlePayPalPayment}
              disabled={loading !== null}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#003087] hover:bg-[#003087]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#003087]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="#003087"/>
                    <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132l-1.41 8.936-.399 2.533a.704.704 0 00.695.813h4.89c.578 0 1.069-.42 1.159-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 00-1.343-1.029z" fill="#0070e0"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-neutral-text">PayPal</div>
                  <div className="text-xs text-neutral-muted">Paga in 3 rate senza interessi</div>
                </div>
              </div>
              {loading === 'paypal' ? (
                <Loader2 size={20} className="animate-spin text-[#003087]" />
              ) : (
                <span className="text-[#003087] font-medium">{platformFee.toLocaleString()}</span>
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-neutral-muted text-center mt-6">
            Pagamento sicuro e protetto. Il tuo concorso sara attivo dopo la conferma del pagamento.
          </p>
        </div>
      </div>
    </div>
  );
};
