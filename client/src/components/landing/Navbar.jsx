import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Home', 'Courses', 'Instructors', 'Success Stories', 'Pricing', 'For Business'];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3 shadow-md' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <span className="text-2xl font-bold text-brand-700 tracking-tight">zenius</span>
            <span className="bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-md">AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href="#"
                className={`text-sm font-medium transition-colors ${
                  idx === 0 ? 'text-brand-600 border-b-2 border-brand-600 pb-1' : 'text-slate-600 hover:text-brand-600'
                }`}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for courses..."
                className="pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48 lg:w-64 transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <button className="p-2 text-slate-600 hover:text-brand-600 transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-4 py-2">
              Log In
            </button>
            <button className="text-sm font-medium bg-brand-600 text-white px-5 py-2 rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/30">
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 hover:text-brand-600">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden glass border-t border-slate-100"
        >
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50"
              >
                {link}
              </a>
            ))}
            <div className="mt-4 flex flex-col space-y-3 px-3">
              <button className="w-full text-center px-4 py-2 border border-brand-200 rounded-full text-brand-600 font-medium">
                Log In
              </button>
              <button className="w-full text-center px-4 py-2 bg-brand-600 text-white rounded-full font-medium shadow-md">
                Sign Up
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
