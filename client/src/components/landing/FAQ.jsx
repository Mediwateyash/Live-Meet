import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';

export default function FAQ() {
  const { darkMode } = useUIStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      question: "What is Zenius AI and who can use it?",
      answer: "Zenius AI is an advanced, AI-powered Learning Management System (LMS) designed for both students and instructors. Students can enroll in interactive courses, take generated quizzes, and attend live lectures, while educators can manage curriculums, host live sessions, and review student progress."
    },
    {
      question: "How does the AI MCQ and Test Generator work?",
      answer: "Zenius AI features a built-in AI MCQ Generator. Instructors can select course materials or specify custom topics, and our AI automatically analyzes the context to generate multiple-choice questions, making exam creation fast and efficient."
    },
    {
      question: "Can students interact with instructors during Live Lectures?",
      answer: "Yes! Zenius AI provides a custom virtual classroom experience. Students can join scheduled live streams, access real-time video/audio controls, interact with peers and instructors via the chat dock, and view attendance metrics."
    },
    {
      question: "How do certificates work on Zenius AI?",
      answer: "Once a student successfully completes all modules of a course and passes the required course quizzes, Zenius AI automatically generates a personalized, downloadable certificate of completion that can be shared with employers."
    },
    {
      question: "How can I submit feedback or report a bug to the administrator?",
      answer: "Logged-in users can open their profile menu and click 'Contact Us' (or 'Student Feedback' for admins) to submit tickets. You can categorise your request, write your feedback, and receive direct responses from platform administrators in your inbox."
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

