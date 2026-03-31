import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '../src/types';
import { Wind, Brush, Droplets, Sparkles } from 'lucide-react';

interface AnimatedPromoHeaderProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
}

const SLIDES = [
  {
    id: 1,
    badge: 'PREMIUM SERVICE',
    title: 'Summer Ready AC Service',
    subtitle: 'Expert maintenance starting at ₹499',
    buttonText: 'BOOK NOW',
    categoryId: '1', // AC Repair
    bgColor: 'from-slate-900 to-slate-800',
    image: 'https://images.pexels.com/photos/3680440/pexels-photo-3680440.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: <Wind size={24} className="text-blue-400" />
  },
  {
    id: 2,
    badge: 'HYGIENE FIRST',
    title: 'Professional Deep Cleaning',
    subtitle: '50% OFF for first-time bookings',
    buttonText: 'EXPLORE',
    categoryId: '3', // Cleaning
    bgColor: 'from-teal-950 to-slate-900',
    image: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: <Brush size={24} className="text-teal-400" />
  },
  {
    id: 3,
    badge: 'EXPERT CARE',
    title: 'Reliable Plumbing Solutions',
    subtitle: 'Verified professionals at your doorstep',
    buttonText: 'GET HELP',
    categoryId: '4', // Plumbing
    bgColor: 'from-indigo-950 to-slate-900',
    image: 'https://images.pexels.com/photos/342800/pexels-photo-342800.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: <Droplets size={24} className="text-indigo-400" />
  }
];

export const AnimatedPromoHeader: React.FC<AnimatedPromoHeaderProps> = ({ categories, onCategoryClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  const handlePress = () => {
    const cat = categories.find(c => c.id === slide.categoryId);
    if (cat) onCategoryClick(cat);
  };

  return (
    <div className="px-5">
      <div 
        className="relative w-full h-[240px] rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 cursor-pointer group" 
        onClick={handlePress}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} flex items-center`}
          >
            {/* Background Image with Ken Burns Effect */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.img 
                key={`img-${slide.id}`}
                src={slide.image} 
                alt=""
                initial={{ scale: 1 }}
                animate={{ scale: 1.15 }}
                transition={{ duration: 10, ease: "linear" }}
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative w-full h-full p-8 flex flex-col justify-center z-20">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-[70%]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                    {slide.icon}
                  </div>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                    {slide.badge}
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-white/70 text-sm font-medium mb-6">
                  {slide.subtitle}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden bg-white text-gray-900 px-8 py-3.5 rounded-2xl text-xs font-bold tracking-widest shadow-xl group-hover:shadow-white/10 transition-shadow"
                >
                  <span className="relative z-10">{slide.buttonText}</span>
                  <motion.div 
                    animate={{ 
                      x: ['-100%', '200%'],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3, 
                      ease: "easeInOut",
                      repeatDelay: 1
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  />
                </motion.button>
              </motion.div>
            </div>

            {/* Subtle Decorative Elements */}
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={120} className="text-white" strokeWidth={0.5} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 right-8 flex gap-1.5 z-30">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
