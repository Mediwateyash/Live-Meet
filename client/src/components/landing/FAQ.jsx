import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';

export default function FAQ() {
  const { darkMode } = useUIStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      question: "How does the AI Tutor work?",
      answer: "Our AI Tutor analyzes your learning patterns, identifies areas where you struggle, and provides personalized explanations, practice exercises, and study recommendations in real-time."
    },
    {
      question: "Are the certificates recognized by employers?",
      answer: "Yes! Our certificates are industry-recognized and can be directly added to your LinkedIn profile. Many of our top corporate partners use our platform for internal training."
    },
    {
      question: "Can I access the courses on mobile?",
      answer: "Absolutely. Our platform is fully responsive and we have dedicated mobile apps for iOS and Android, allowing you to download lessons for offline viewing."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee. If you're not completely satisfied with your learning experience, you can request a full refund within the first 30 days."
    }
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-[var(--bg-surface)] border-t border-slate-100 dark:border-[var(--border-default)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-[var(--text-secondary)]">Got questions? We've got answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${darkMode ? 'bg-[var(--bg-muted)] border-[var(--border-default)]' : 'bg-white border-slate-200'} rounded-2xl border overflow-hidden shadow-sm`}
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-semibold text-slate-900 dark:text-[var(--text-primary)] pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-5 w-5 text-slate-400 dark:text-[var(--text-muted)]" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-600 dark:text-[var(--text-secondary)] leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

