import React from 'react';
import { motion } from 'framer-motion';
import useUIStore from '../../store/uiStore.js';

export default function StudentPlacements() {
  const { darkMode } = useUIStore();

  const companies = [
    { name: "Google", logo: "G" },
    { name: "Microsoft", logo: "M" },
    { name: "Amazon", logo: "A" },
    { name: "Meta", logo: "Meta" },
    { name: "Netflix", logo: "N" },
    { name: "Spotify", logo: "S" },
    { name: "Stripe", logo: "St" },
    { name: "Airbnb", logo: "Ab" },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-[var(--bg-surface)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-2">Our Students Work At</h2>
        <p className="text-slate-500 dark:text-[var(--text-muted)]">Top companies worldwide hire Zenius AI graduates</p>
      </div>

      <div className="relative">
        {/* Gradient fades for seamless loop effect */}
        <div className={`absolute top-0 left-0 w-32 h-full bg-gradient-to-r ${darkMode ? 'from-[var(--bg-surface)]' : 'from-slate-50'} to-transparent z-10`}></div>
        <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${darkMode ? 'from-[var(--bg-surface)]' : 'from-slate-50'} to-transparent z-10`}></div>

        <div className="flex w-[200%] md:w-max">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="flex gap-12 items-center px-6"
          >
            {/* Double the array for infinite scroll effect */}
            {[...companies, ...companies].map((company, index) => (
              <div 
                key={index} 
                className={`w-32 h-16 ${darkMode ? 'bg-[var(--bg-muted)] border-[var(--border-default)]' : 'bg-white border-slate-100'} rounded-xl shadow-sm border flex items-center justify-center shrink-0 grayscale hover:grayscale-0 transition-all duration-300`}
              >
                <span className="text-xl font-bold text-slate-400 dark:text-slate-600 font-sans tracking-wider">{company.logo}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

