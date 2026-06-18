import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Award, BrainCircuit, Sparkles, Star } from 'lucide-react';

export default function HeroRobot() {
  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center">
      {/* Background Ambient Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-brand-400/20 rounded-full blur-3xl"
      />
      
      {/* Main Robot Container */}
      <motion.div 
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        
        {/* Abstract Graduation Cap */}
        <motion.div 
          animate={{ rotateZ: [-2, 2, -2], y: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative -mb-6 z-30"
        >
           {/* The diamond top of the cap */}
           <div className="w-32 h-10 bg-slate-800 rounded-sm shadow-xl relative z-20" style={{ transform: 'perspective(200px) rotateX(60deg) rotateZ(45deg)' }}></div>
           {/* The base of the cap */}
           <div className="w-16 h-8 bg-slate-900 rounded-b-xl absolute top-5 left-8 z-10 shadow-lg"></div>
           {/* The tassel */}
           <motion.div 
             animate={{ rotateZ: [-15, 15, -15] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-4 left-20 origin-top z-30 flex flex-col items-center"
           >
             <div className="w-0.5 h-10 bg-yellow-400"></div>
             <div className="w-2 h-4 bg-yellow-500 rounded-b-sm"></div>
           </motion.div>
        </motion.div>

        {/* Head */}
        <div className="w-48 h-40 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden z-20">
           
           {/* Glass reflection */}
           <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-[2.5rem]" />

           {/* Geeky Glasses & Eyes */}
           <div className="absolute flex items-center justify-center gap-1.5 z-20 top-10">
              <div className="w-14 h-14 rounded-full border-[5px] border-slate-800 flex items-center justify-center bg-brand-50/50 backdrop-blur-sm shadow-inner">
                 {/* Left Eye */}
                 <motion.div 
                   animate={{ scaleY: [1, 0.1, 1, 1, 1] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.05, 0.1, 0.15, 1] }}
                   className="w-4 h-5 rounded-full bg-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                 />
              </div>
              
              {/* Glasses Bridge */}
              <div className="w-3 h-1.5 bg-slate-800 -mt-2 rounded-full" />
              
              <div className="w-14 h-14 rounded-full border-[5px] border-slate-800 flex items-center justify-center bg-brand-50/50 backdrop-blur-sm shadow-inner">
                 {/* Right Eye */}
                 <motion.div 
                   animate={{ scaleY: [1, 0.1, 1, 1, 1] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.05, 0.1, 0.15, 1] }}
                   className="w-4 h-5 rounded-full bg-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                 />
              </div>
           </div>

           {/* Cute Smile */}
           <div className="absolute bottom-6 w-8 h-3 border-b-4 border-slate-400 rounded-b-full opacity-80" />
        </div>

        {/* Neck */}
        <div className="w-10 h-6 bg-slate-200 shadow-inner z-10" />

        {/* Torso (Holding a Book) */}
        <div className="w-64 h-56 bg-gradient-to-br from-brand-50 to-indigo-100/80 backdrop-blur-md rounded-[3rem] shadow-2xl border border-white/60 relative flex flex-col items-center justify-center z-20">
           
           {/* Inspiration spark floating above book */}
           <motion.div 
             animate={{ y: [-5, 5, -5], opacity: [0.6, 1, 0.6] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-6"
           >
             <Sparkles className="w-8 h-8 text-yellow-500" />
           </motion.div>

           {/* Holding Book Layout */}
           <div className="mt-8 flex items-center justify-center relative">
             {/* Robot Hands */}
             <div className="absolute -left-6 top-6 w-12 h-10 bg-white rounded-full border border-slate-200 shadow-lg z-30 transform -rotate-12" />
             <div className="absolute -right-6 top-6 w-12 h-10 bg-white rounded-full border border-slate-200 shadow-lg z-30 transform rotate-12" />
             
             {/* Glowing Book Component */}
             <motion.div
               animate={{ y: [-2, 2, -2] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="w-36 h-28 bg-brand-600 rounded-xl shadow-[0_10px_30px_rgba(124,58,237,0.4)] relative flex items-center justify-center border-b-8 border-brand-800 z-20 overflow-hidden"
             >
               {/* Book pages effect */}
               <div className="absolute top-0 right-0 w-4 h-full bg-brand-500" />
               <div className="absolute bottom-0 left-0 w-full h-2 bg-brand-400" />
               
               <BookOpen className="w-14 h-14 text-white relative z-10" />
             </motion.div>
           </div>
        </div>
      </motion.div>

      {/* Floating Orbiting Educational Nodes */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-30 pointer-events-none"
      >
        {/* Node 1: AI Brain */}
        <div className="absolute top-10 left-10 w-12 h-12 rounded-xl bg-white shadow-xl border border-slate-100 flex items-center justify-center transform -rotate-12">
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
            <BrainCircuit className="w-6 h-6 text-brand-600" />
          </motion.div>
        </div>
        
        {/* Node 2: Award / Certificate */}
        <div className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-white shadow-[0_0_25px_rgba(234,179,8,0.3)] border border-yellow-100 flex items-center justify-center">
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
            <Award className="w-7 h-7 text-yellow-500" />
          </motion.div>
        </div>

        {/* Node 3: Perfect Score Star */}
        <div className="absolute top-1/2 -left-4 w-10 h-10 rounded-full bg-brand-600 shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center border border-brand-400">
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
