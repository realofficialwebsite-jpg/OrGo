import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  Ticket, 
  Info, 
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../src/CartContext';
import { AppView } from '../src/types';

interface CartProps {
  onClose: () => void;
  setView: (view: AppView) => void;
}

const PROMO_CODES = [
  { code: 'WELCOME50', discount: 50, description: '₹50 off on your first booking', minOrder: 500 },
  { code: 'ORGO100', discount: 100, description: '₹100 off on orders above ₹1000', minOrder: 1000 },
  { code: 'FESTIVE20', discount: 200, description: '₹200 off on orders above ₹2000', minOrder: 2000 },
];

export const Cart: React.FC<CartProps> = ({ onClose, setView }) => {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<typeof PROMO_CODES[0] | null>(null);
  const [showPromoList, setShowPromoList] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const platformFee = 49;
  const taxes = Math.round(cartTotal * 0.18);
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const grandTotal = cartTotal + platformFee + taxes - discount;

  const handleApplyPromo = (code: string) => {
    setPromoError(null);
    setPromoSuccess(null);
    
    const promo = PROMO_CODES.find(p => p.code === code.toUpperCase());
    if (promo) {
      if (cartTotal >= promo.minOrder) {
        setAppliedPromo(promo);
        setPromoCode(promo.code);
        setShowPromoList(false);
        setPromoSuccess(`Applied ${promo.code} successfully!`);
        setTimeout(() => setPromoSuccess(null), 3000);
      } else {
        setPromoError(`Minimum order value for ${code} is ₹${promo.minOrder}`);
      }
    } else {
      setPromoError('Invalid promo code. Please check and try again.');
    }
  };

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-10 text-center"
      >
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added any services yet. Explore our categories to find what you need.</p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Explore Services
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-900" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 font-display">My Cart</h2>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cart Items */}
        <div className="p-5 space-y-4">
          {cart.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <img 
                  src={item.imageUrl || `https://source.unsplash.com/featured/800x600?${item.title.replace(/\s+/g, '')},repair,professional`} 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                  style={{ width: '100%', height: '100%' }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-2">₹{item.price} per unit</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Promo Code Section */}
        <div className="px-5 mb-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-primary" />
                <h3 className="font-bold text-gray-900 text-sm">Offers & Promo Codes</h3>
              </div>
              <button 
                onClick={() => setShowPromoList(true)}
                className="text-primary text-xs font-bold hover:underline"
              >
                View All
              </button>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                className={`w-full bg-gray-50 border rounded-xl pl-4 pr-24 py-3 text-sm font-medium focus:outline-none transition-colors ${
                  promoError ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-primary'
                }`}
              />
              <button 
                onClick={() => handleApplyPromo(promoCode)}
                className="absolute right-1 top-1 bottom-1 px-5 bg-gray-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-transform"
              >
                APPLY
              </button>
            </div>

            {promoError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[10px] font-bold text-red-500 px-1"
              >
                {promoError}
              </motion.p>
            )}

            {promoSuccess && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[10px] font-bold text-emerald-600 px-1"
              >
                {promoSuccess}
              </motion.p>
            )}

            {appliedPromo && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <Plus size={12} className="rotate-45" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Applied: {appliedPromo.code}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">You saved ₹{appliedPromo.discount}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCode('');
                  }}
                  className="text-emerald-700 text-[10px] font-bold hover:underline"
                >
                  REMOVE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="px-5 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Bill Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Item Total</span>
                <span className="text-gray-900 font-bold">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Platform Fee</span>
                  <Info size={14} className="text-gray-300" />
                </div>
                <span className="text-gray-900 font-bold">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Taxes (18%)</span>
                <span className="text-gray-900 font-bold">₹{taxes}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="font-medium">Promo Discount</span>
                  <span className="font-bold">-₹{appliedPromo.discount}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Grand Total</span>
                <span className="text-xl font-bold text-primary">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView(AppView.CHECKOUT)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] opacity-80 uppercase tracking-widest">Proceed to Checkout</span>
            <span className="text-lg">₹{grandTotal}</span>
          </div>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Promo List Modal */}
      <AnimatePresence>
        {showPromoList && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPromoList(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[70] p-8 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 font-display">Available Offers</h3>
                <button onClick={() => setShowPromoList(false)} className="p-2 bg-gray-50 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {PROMO_CODES.map((promo) => (
                  <div 
                    key={promo.code}
                    className="p-5 border-2 border-dashed border-gray-100 rounded-3xl hover:border-primary/30 transition-colors cursor-pointer group"
                    onClick={() => handleApplyPromo(promo.code)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wider">
                        {promo.code}
                      </span>
                      <span className="text-primary text-xs font-bold group-hover:underline">APPLY</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{promo.description}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Min order value: ₹{promo.minOrder}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
