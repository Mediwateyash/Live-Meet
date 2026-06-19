import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { testimonialAPI } from '../../api/testimonial.js';
import useUIStore from '../../store/uiStore.js';

export default function Testimonials() {
  const { darkMode } = useUIStore();
  const [testimonials, setTestimonials] = useState([
    {
      _id: 'default-1',
      content: "Zenius AI completely transformed how I learn. The AI Tutor is like having a personal mentor available 24/7. I went from zero to full-stack developer in 6 months.",
      author: "Sarah Jenkins",
      role: "Software Engineer at Google",
      avatar: "S",
      rating: 5
    },
    {
      _id: 'default-2',
      content: "The quality of the courses is unmatched. The platform's UI is so clean and distraction-free, making long study sessions enjoyable. Highly recommended!",
      author: "David Chen",
      role: "Product Manager",
      avatar: "D",
      rating: 5
    },
    {
      _id: 'default-3',
      content: "I love the interactive learning approach. The real-world projects and immediate feedback helped me build a portfolio that landed my dream job.",
      author: "Elena Rodriguez",
      role: "Frontend Developer",
      avatar: "E",
      rating: 5
    }
  ]);

  useEffect(() => {
    testimonialAPI.getAll()
      .then(({ data }) => {
        if (data.data && data.data.length > 0) {
          setTestimonials(data.data.slice(0, 3)); // Only show top 3 for the landing page
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className={`py-24 ${darkMode ? 'bg-transparent' : 'bg-white'} relative overflow-hidden`}>
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 -z-10 w-96 h-96 bg-brand-50 dark:bg-slate-900/40 rounded-full blur-3xl opacity-60 transform -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-4">What Our Students Say</h2>
          <p className="text-slate-600 dark:text-[var(--text-secondary)] text-lg">Join over 50,000 satisfied learners achieving their career goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial._id || testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`${darkMode ? 'bg-[var(--bg-surface)] border-[var(--border-default)]' : 'bg-white border-slate-100'} rounded-3xl p-8 shadow-card border relative group hover:-translate-y-2 transition-transform duration-300`}
            >
              <Quote className="absolute top-6 right-8 h-10 w-10 text-brand-100 dark:text-brand-950/60 group-hover:text-brand-200 dark:group-hover:text-brand-900/60 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <p className="text-slate-700 dark:text-[var(--text-secondary)] leading-relaxed mb-8 relative z-10">"{testimonial.content}"</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-[var(--text-primary)]">{testimonial.author}</h4>
                  <p className="text-sm text-slate-500 dark:text-[var(--text-muted)]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

