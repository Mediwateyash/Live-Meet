import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users2, Infinity, Award } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';

export default function WhyChooseUs() {
  const { darkMode } = useUIStore();

  const features = [
    {
      id: 1,
      icon: <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Learn at Your Pace",
      description: "Access courses anytime, anywhere. No strict schedules.",
      bg: "bg-indigo-50"
    },
    {
      id: 2,
      icon: <Users2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />,
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of experience.",
      bg: "bg-brand-50"
    },
    {
      id: 3,
      icon: <Infinity className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      title: "Lifetime Access",
      description: "Get lifetime access to course materials and future updates.",
      bg: "bg-purple-50"
    },
    {
      id: 4,
      icon: <Award className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
      title: "Certificates",
      description: "Earn certificates to boost your career and resume.",
      bg: "bg-pink-50"
    }
  ];

  return (
    <section className={`py-20 ${darkMode ? 'bg-transparent' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className={`${darkMode ? 'bg-[var(--bg-surface)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-100'} rounded-[2.5rem] p-8 md:p-12 lg:p-16 border`}
        >
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-4">Why Choose Zenius AI?</h2>
            <p className="text-slate-600 dark:text-[var(--text-secondary)] text-lg">We provide the best learning experience with modern tools, AI guidance, and expert-crafted content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300 ${darkMode ? 'bg-[var(--bg-muted)]' : feature.bg}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-[var(--text-secondary)]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

