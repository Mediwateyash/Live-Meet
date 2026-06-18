import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Star, Globe2 } from 'lucide-react';

export default function Statistics() {
  const stats = [
    {
      id: 1,
      icon: <Users className="h-6 w-6 text-brand-600" />,
      value: "50K+",
      label: "Students Enrolled",
      bg: "bg-brand-50"
    },
    {
      id: 2,
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      value: "1,200+",
      label: "Courses",
      bg: "bg-indigo-50"
    },
    {
      id: 3,
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      value: "4.8",
      label: "Average Rating",
      bg: "bg-yellow-50"
    },
    {
      id: 4,
      icon: <Globe2 className="h-6 w-6 text-blue-500" />,
      value: "100+",
      label: "Countries",
      bg: "bg-blue-50"
    }
  ];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-card border border-slate-100 p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center gap-4 ${index !== 0 ? 'pl-8' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
