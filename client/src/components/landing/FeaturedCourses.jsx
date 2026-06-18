import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

export default function FeaturedCourses() {
  const courses = [
    {
      id: 1,
      title: "Python for Beginners",
      description: "Learn Python from scratch and build real-world projects",
      instructor: "Arjun Pandey",
      rating: 4.7,
      reviews: "2.1K",
      price: "₹499",
      image: "/course_python_1781720852317.png",
      badge: "Bestseller",
      color: "from-blue-900 to-slate-900"
    },
    {
      id: 2,
      title: "React.js - Frontend Development",
      description: "Master React and build modern interactive web apps",
      instructor: "Neha Sharma",
      rating: 4.6,
      reviews: "1.8K",
      price: "₹599",
      image: "/course_react_1781720871744.png",
      color: "from-slate-800 to-slate-900"
    },
    {
      id: 3,
      title: "JavaScript Complete Guide 2024",
      description: "From basics to advanced concepts with hands-on examples",
      instructor: "Rohit Negi",
      rating: 4.8,
      reviews: "3.2K",
      price: "₹449",
      image: "/course_js_1781720887062.png",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: 4,
      title: "Node.js - Build Scalable APIs",
      description: "Build fast, secure and scalable server-side applications",
      instructor: "Vikas Singh",
      rating: 4.6,
      reviews: "1.6K",
      price: "₹699",
      image: "/course_node_1781720900805.png",
      color: "from-green-700 to-emerald-900"
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Popular Courses</h2>
            <p className="text-slate-600">Expand your knowledge with our top-rated courses.</p>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 flex flex-col h-full group"
            >
              {/* Card Header with Image */}
              <div className={`h-48 w-full bg-gradient-to-br ${course.color} relative overflow-hidden flex items-center justify-center p-6`}>
                {course.badge && (
                  <span className="absolute top-4 left-4 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                    {course.badge}
                  </span>
                )}
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="h-full w-full object-contain mix-blend-screen group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">{course.description}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                      {course.instructor.charAt(0)}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{course.instructor}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                    <span className="text-slate-900">{course.rating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 ml-1">({course.reviews})</span>
                  </div>
                  <span className="font-bold text-lg text-slate-900">{course.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 sm:hidden flex justify-center">
          <button className="flex items-center gap-2 text-brand-600 font-medium px-6 py-3 border border-brand-200 rounded-full hover:bg-brand-50 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
