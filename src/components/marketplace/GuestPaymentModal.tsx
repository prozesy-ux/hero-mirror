import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Mail, Lock, Loader2, CreditCard, 
  AlertCircle, ExternalLink, Copy 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  sellerId?: string;
  sellerName: string | null;
  type: 'ai' | 'seller';
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon_url: string | null;
  qr_image_url: string | null;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_automatic: boolean;
  is_enabled: boolean;
  currency_code: string | null;
  exchange_rate: number | null;
}

interface GuestPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

const emailSchema = z.string().email('Please enter a valid email address');

// Currency helper
const getCurrencySymbol = (code: string | null): string => {
  switch (code) {
    case 'BDT': return '৳';
    case 'INR': return '₹';
    case 'PKR': return 'Rs';
    default: return '$';
  }
};

const formatLocalAmount = (usdAmount: number, method: PaymentMethod | undefined): string => {
  if (!method || method.currency_code === 'USD' || !method.currency_code) {
    return `$${usdAmount.toFixed(2)}`;
  }
  const rate = method.exchange_rate || 1;
  const localAmount = usdAmount * rate;
  const symbol = getCurrencySymbol(method.currency_code);
  return `${symbol}${localAmount.toFixed(0)}`;
};

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

const GuestPaymentModal = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}: GuestPaymentModalProps) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('stripe');
  const [transactionId, setTransactionId] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        setPaymentMethods(data);
        if (data.length > 0) {
          setSelectedMethod(data[0].code);
        }
      }
    };

    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  // Load Razorpay script
  useEffect(() => {
    if (!document.querySelector('script[src*="razorpay"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEmail('');
      setEmailError(null);
      setTransactionId('');
      setLoading(false);
    }
  }, [open]);

  const currentMethod = paymentMethods.find(m => m.code === selectedMethod);
  const isManualPayment = currentMethod && !currentMethod.is_automatic;

  const handlePayment = async () => {
    if (!product) return;

    // For manual payments, validate email
    if (isManualPayment) {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        setEmailError(result.error.errors[0].message);
        return;
      }

      if (!transactionId.trim()) {
        toast.error('Please enter your transaction ID');
        return;
      }
    }

    setLoading(true);

    try {
      if (selectedMethod === 'stripe') {
        // Stripe checkout - email collected on Stripe Checkout page
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-guest-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              productId: product.id,
              productName: product.name,
              price: product.price,
              productType: product.type,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        window.location.href = url;
        
      } else if (selectedMethod === 'razorpay') {
        // Razorpay checkout - email collected in Razorpay popup
        if (!razorpayLoaded) {
          toast.error('Payment system is loading. Please try again.');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-guest-razorpay`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              productId: product.id,
              productName: product.name,
              price: product.price,
              productType: product.type,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create Razorpay order');
        }

        const data = await response.json();
        
        // Close modal before opening Razorpay
        onOpenChange(false);

        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: 'Uptoza',
          description: `Purchase: ${product.name}`,
          order_id: data.order_id,
          handler: async (response: { 
            razorpay_order_id: string; 
            razorpay_payment_id: string; 
            razorpay_signature: string 
          }) => {
            toast.info('Verifying payment...');
            try {
              const verifyResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-guest-razorpay`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    guestToken: data.guestToken,
                  }),
                }
              );

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                if (verifyData.isNewUser && verifyData.session) {
                  await supabase.auth.setSession({
                    access_token: verifyData.session.access_token,
                    refresh_token: verifyData.session.refresh_token,
                  });
                  toast.success('Account created! Check your email for your password.');
                } else {
                  toast.success('Purchase complete!');
                }
                onSuccess?.();
                window.location.href = '/dashboard/marketplace?tab=purchases';
              } else {
                toast.error(verifyData.error || 'Payment verification failed');
              }
            } catch (err) {
              console.error('Razorpay verification error:', err);
              toast.error('Payment verification failed. Contact support.');
            }
          },
          theme: { color: '#FF90E8' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.info('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          toast.error('Payment failed. Please try again.');
          setLoading(false);
        });
        rzp.open();
        return;

      } else {
        // Manual payment (bKash, Nagad, etc.) - email required in modal
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-guest-manual-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              productId: product.id,
              productName: product.name,
              price: product.price,
              guestEmail: email,
              productType: product.type,
              paymentMethod: selectedMethod,
              transactionId: transactionId.trim(),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit order');
        }

        toast.success('Order submitted! You\'ll receive an email once approved.');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border border-black rounded p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Pink accent bar */}
        <div className="h-1 bg-[#FF90E8]" />
        
        {/* Header */}
        <div className="bg-white p-5 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-black">
              <div className="p-2 bg-[#FF90E8] border border-black rounded">
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              Complete Your Purchase
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-5">
          {/* Product Summary */}
          <div className="flex items-center gap-4 p-4 bg-[#FBF8F3] rounded border border-black/10">
            {product.iconUrl ? (
              <img
                src={product.iconUrl}
                alt={product.name}
                className="w-14 h-14 rounded border border-black/10 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded border border-black/10 bg-[#FF90E8] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-black" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-black truncate">{product.name}</h3>
              <p className="text-sm text-black/60">{product.sellerName || 'Uptoza'}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-black">${product.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.code)}
                  className={`p-3 rounded border-2 transition-all text-center ${
                    selectedMethod === method.code
                      ? 'border-black bg-[#FF90E8]'
                      : 'border-black/30 hover:border-black'
                  }`}
                >
                  {method.icon_url ? (
                    <img 
                      src={method.icon_url} 
                      alt={method.name}
                      className="h-6 w-auto mx-auto mb-1.5 object-contain"
                    />
                  ) : (
                    <CreditCard className="h-6 w-6 mx-auto mb-1.5 text-black/40" />
                  )}
                  <p className="text-xs font-medium text-black truncate">{method.name}</p>
                  {method.currency_code && method.currency_code !== 'USD' && (
                    <p className="text-[10px] text-black/50">
                      {formatLocalAmount(product.price, method)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Automatic Payment Note */}
          {currentMethod?.is_automatic && (
            <div className="p-3 bg-[#FFF5FB] rounded border border-[#FF90E8]/30">
              <p className="text-sm text-black/70 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                You'll enter your email on the secure payment page
              </p>
            </div>
          )}

          {/* Manual Payment Section - Email + Instructions */}
          {isManualPayment && (
            <div className="space-y-4">
              {/* Email Input - Only for manual payments */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <Mail className="w-4 h-4 inline mr-1.5" />
                  Email (for account and delivery)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 border rounded text-black placeholder-black/40 focus:outline-none transition-colors ${
                    emailError
                      ? 'border-red-500'
                      : 'border-black focus:ring-2 focus:ring-[#FF90E8]/50'
                  }`}
                />
                {emailError && (
                  <p className="mt-1.5 text-sm text-red-500">{emailError}</p>
                )}
              </div>

              {/* Manual Payment Instructions */}
              <div className="p-4 bg-amber-50 rounded border border-amber-200 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Manual Payment</p>
                    <p className="text-sm text-amber-700">
                      Send {formatLocalAmount(product.price, currentMethod)} to the account below, then enter your transaction ID.
                    </p>
                  </div>
                </div>

                {/* Account Details */}
                {currentMethod.account_number && (
                  <div className="bg-white p-3 rounded border border-black/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-black/50">Account Number</p>
                        <p className="font-mono font-semibold">{currentMethod.account_number}</p>
                        {currentMethod.account_name && (
                          <p className="text-sm text-black/60">{currentMethod.account_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(currentMethod.account_number!)}
                        className="p-2 hover:bg-black/5 rounded border border-transparent hover:border-black transition-all"
                      >
                        <Copy className="w-4 h-4 text-black/40" />
                      </button>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {currentMethod.qr_image_url && (
                  <div className="flex justify-center">
                    <img 
                      src={currentMethod.qr_image_url} 
                      alt="Payment QR Code"
                      className="w-32 h-32 rounded border border-black/10"
                    />
                  </div>
                )}

                {/* Instructions */}
                {currentMethod.instructions && (
                  <p className="text-sm text-amber-700">{currentMethod.instructions}</p>
                )}

                {/* Transaction ID Input */}
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter your transaction ID"
                    className="w-full px-4 py-3 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading || (isManualPayment && (!email || !transactionId.trim()))}
            className="w-full py-3.5 bg-[#FF90E8] border border-black text-black font-semibold rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : currentMethod?.is_automatic ? (
              <>Pay {formatLocalAmount(product.price, currentMethod)}</>
            ) : (
              <>Submit Order</>
            )}
          </button>

          {/* Automatic payment note */}
          {currentMethod?.is_automatic && (
            <p className="text-xs text-center text-black/50 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secure payment - your account will be created automatically
            </p>
          )}

          {/* Sign In Alternative */}
          <div className="pt-4 border-t border-black/10 text-center">
            <p className="text-sm text-black/60 mb-1">Already have an account?</p>
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#FF90E8] hover:underline transition-colors"
            >
              Sign in for faster checkout
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestPaymentModal;
