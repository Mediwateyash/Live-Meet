import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, BrainCircuit, BarChart3, Award } from 'lucide-react';
import HeroRobot from './HeroRobot';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 transform -translate-x-1/4 translate-y-1/4"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* Left Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12 lg:mb-0"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Learning</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              Learn Smarter, <br/> Achieve More with <br/> <span className="text-gradient">Zenius AI</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              Discover expert-led courses in tech, business, and more. Learn anytime, anywhere with personalized AI guidance.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-3.5 bg-brand-600 text-white font-medium rounded-full hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
                Explore Courses
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="px-8 py-3.5 bg-white text-slate-700 font-medium rounded-full border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <div className="bg-slate-100 rounded-full p-1"><Play className="h-4 w-4" /></div>
                Watch Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Illustration & Floating Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <HeroRobot />

            {/* Floating Card 1 - AI Tutor */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-10 left-0 md:-left-10 z-20 glass p-4 rounded-2xl flex items-center gap-3 w-48 shadow-xl"
            >
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">AI Tutor</p>
                <p className="text-xs text-slate-500 leading-tight">Get personalized support</p>
              </div>
            </motion.div>

            {/* Floating Card 2 - Progress */}
            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-32 right-0 md:-right-8 z-20 glass p-4 rounded-2xl flex items-center gap-4 w-48 shadow-xl"
            >
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset="31.4" className="text-brand-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-700">75%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Progress</p>
                <p className="text-xs text-slate-500 leading-tight">Keep on track</p>
              </div>
            </motion.div>

            {/* Floating Card 3 - Certificate */}
            <motion.div 
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-20 right-10 md:-right-4 z-20 glass p-4 rounded-2xl flex items-center gap-3 w-48 shadow-xl"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Certificate</p>
                <p className="text-xs text-slate-500 leading-tight">Earn credentials</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
