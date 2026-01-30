import { useState } from 'react';
import { X, Mail, Lock, ShoppingBag, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

interface Product {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  sellerId: string;
  sellerName: string | null;
}

interface GuestCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onCheckout: (email: string) => Promise<void>;
}

const emailSchema = z.string().email('Please enter a valid email address');

const GuestCheckoutModal = ({
  open,
  onOpenChange,
  product,
  onCheckout,
}: GuestCheckoutModalProps) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await onCheckout(email);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 border-b border-black/5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-black">
              <div className="p-2 bg-pink-500 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              Complete Your Purchase
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Product Summary */}
          <div className="flex items-center gap-4 p-4 bg-black/[0.02] rounded-xl mb-6">
            {product.iconUrl ? (
              <img
                src={product.iconUrl}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-black/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-pink-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-black truncate">{product.name}</h3>
              <p className="text-sm text-black/60">{product.sellerName || 'Uptoza'}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-black">${product.price}</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Enter your email to receive the product
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-black placeholder-black/40 focus:outline-none transition-colors ${
                    emailError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-black/10 focus:border-black/30'
                  }`}
                  disabled={loading}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-sm text-red-500">{emailError}</p>
              )}
              <p className="mt-2 text-xs text-black/50 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Your email is used only to deliver the product
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Continue to Payment</>
              )}
            </button>
          </form>

          {/* Sign In Alternative */}
          <div className="mt-6 pt-6 border-t border-black/10 text-center">
            <p className="text-sm text-black/60 mb-2">Already have an account?</p>
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors"
            >
              Sign in for faster checkout
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestCheckoutModal;
