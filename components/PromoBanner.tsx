import React from 'react';
import { motion } from 'motion/react';

interface PromoBannerProps {
  onPress: () => void;
}

/**
 * PromoBanner Component
 * 
 * A high-quality animated promo banner inspired by Swiggy/Zomato creatives.
 * Adapted for React Web using motion/react for high-performance animations.
 */
export const PromoBanner: React.FC<PromoBannerProps> = ({ onPress }) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="px-5 mb-8 mt-2"
    >
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-500 to-emerald-600 p-7 shadow-2xl shadow-emerald-200/50 border border-white/10">
        {/* Background Decorative Elements */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-white/20 to-transparent transform -skew-x-12" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="max-w-[62%]">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Campus Saver Deals
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-2 text-2xl font-black leading-[1.1] text-white tracking-tight"
            >
              50% OFF on your <br/>first Cleaning!
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-6 text-xs font-bold text-teal-50/80 leading-relaxed"
            >
              Professional deep cleaning for your home. Limited time offer for students!
            </motion.p>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#f0fdfa' }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 10px 15px -3px rgba(6, 78, 59, 0.1)",
                  "0 20px 25px -5px rgba(6, 78, 59, 0.2)",
                  "0 10px 15px -3px rgba(6, 78, 59, 0.1)"
                ]
              }}
              transition={{ 
                scale: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                boxShadow: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={onPress}
              className="rounded-2xl bg-white px-7 py-3.5 text-xs font-black uppercase tracking-widest text-emerald-700 transition-colors"
            >
              Book Now
            </motion.button>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: 15, x: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
            transition={{ 
              delay: 0.7, 
              type: "spring", 
              stiffness: 80,
              damping: 12
            }}
            className="relative h-36 w-36 flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl animate-pulse" />
            <img 
              src="https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=400&auto=format&fit=crop" 
              alt="Cleaning Service" 
              className="h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
              style={{ width: '100%', height: '100%' }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
