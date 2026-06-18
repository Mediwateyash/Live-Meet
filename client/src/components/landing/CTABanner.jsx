import React from 'react';
import { motion } from 'framer-motion';
import useUIStore from '../../store/uiStore.js';

export default function CTABanner() {
  const { openAuthModal } = useUIStore();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-900 shadow-2xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative px-8 py-16 md:py-20 md:px-16 lg:px-24 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Ready to transform your career?
              </h2>
              <p className="text-brand-100 text-lg mb-8 max-w-md mx-auto md:mx-0">
                Join our community of learners and start your journey to success today. Get 20% off your first course!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button onClick={() => openAuthModal('register')} className="px-8 py-3.5 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg">
                  Get Started Now
                </button>
                <button className="px-8 py-3.5 bg-brand-500/30 text-white font-medium rounded-full border border-brand-400 hover:bg-brand-500/50 transition-colors backdrop-blur-sm">
                  View Pricing
                </button>
              </div>
            </div>

            <div className="hidden lg:block relative w-64 h-64">
               {/* Decorative 3D-like spheres for visual interest */}
               <motion.div 
                 animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                 transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                 className="absolute top-0 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 shadow-2xl"
               ></motion.div>
               <motion.div 
                 animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                 className="absolute bottom-10 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-2xl"
               ></motion.div>
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 shadow-xl"
               ></motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
