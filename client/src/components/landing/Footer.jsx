import React from 'react';
import { FiInstagram, FiYoutube, FiGithub } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <img
                src="/logo.png"
                alt="SMIT Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-sm shrink-0"
                onError={(e) => { e.currentTarget.src = '/favicon.svg' }}
              />
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  SMIT
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Sandeep More Institute of Technology
                </span>
              </div>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm">
              Empowering the next generation of tech professionals with AI-driven, personalized learning experiences at Sandeep More Institute of Technology.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"
              >
                <FiInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"
              >
                <FiYoutube className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"
              >
                <FiGithub className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/browse" className="hover:text-brand-400 transition-colors">Features</Link></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Enterprise</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Certifications</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Community</a></li>
              <li><Link to="/contact" className="hover:text-brand-400 transition-colors">Support Center</Link></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/privacy-policy" className="hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-brand-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-brand-400 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-brand-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Sandeep More Institute of Technology (SMIT). All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>for learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
