import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI } from '../../api/courses.js';
import { formatPrice } from '../../utils/formatters.js';

const fallbackCourses = [
  {
    _id: "1",
    slug: "python-for-beginners",
    title: "Python for Beginners",
    description: "Learn Python from scratch and build real-world projects",
    instructor: { fullName: "Arjun Pandey" },
    avgRating: 4.7,
    reviewCount: 2100,
    price: 499,
    thumbnail: "/course_python_1781720852317.png",
    badge: "Bestseller",
    color: "from-blue-900 to-slate-900"
  },
  {
    _id: "2",
    slug: "react-js",
    title: "React.js - Frontend Development",
    description: "Master React and build modern interactive web apps",
    instructor: { fullName: "Neha Sharma" },
    avgRating: 4.6,
    reviewCount: 1800,
    price: 599,
    thumbnail: "/course_react_1781720871744.png",
    color: "from-slate-800 to-slate-900"
  },
  {
    _id: "3",
    slug: "javascript-complete",
    title: "JavaScript Complete Guide 2024",
    description: "From basics to advanced concepts with hands-on examples",
    instructor: { fullName: "Rohit Negi" },
    avgRating: 4.8,
    reviewCount: 3200,
    price: 449,
    thumbnail: "/course_js_1781720887062.png",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    _id: "4",
    slug: "nodejs",
    title: "Node.js - Build Scalable APIs",
    description: "Build fast, secure and scalable server-side applications",
    instructor: { fullName: "Vikas Singh" },
    avgRating: 4.6,
    reviewCount: 1600,
    price: 699,
    thumbnail: "/course_node_1781720900805.png",
    color: "from-green-700 to-emerald-900"
  }
];

const colors = [
  "from-blue-900 to-slate-900",
  "from-slate-800 to-slate-900",
  "from-yellow-500 to-yellow-600",
  "from-green-700 to-emerald-900",
  "from-purple-900 to-indigo-900",
  "from-rose-900 to-red-900"
];

export default function FeaturedCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    coursesAPI.featured()
      .then(res => {
        if (res.data && res.data.data && res.data.data.length > 0) {
          setCourses(res.data.data.slice(0, 4));
        }
      })
      .catch(err => console.error("Failed to load featured courses:", err));
  }, []);

  // Use real backend courses if available, otherwise use fallback dummy data
  const displayCourses = courses.length > 0 ? courses : fallbackCourses;

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Popular Courses</h2>
            <p className="text-slate-600">Expand your knowledge with our top-rated courses.</p>
          </div>
          <button onClick={() => navigate('/browse')} className="hidden sm:flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayCourses.map((course, index) => {
            const courseColor = course.color || colors[index % colors.length];
            const instructorName = course.instructor?.fullName || "Instructor";
            const badgeText = course.badge || (index === 0 ? "Bestseller" : null);

            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => navigate(`/course/${course.slug}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 flex flex-col h-full group cursor-pointer"
              >
                {/* Card Header with Image */}
                <div className={`h-48 w-full bg-gradient-to-br ${courseColor} relative overflow-hidden flex items-center justify-center p-6`}>
                  {badgeText && (
                    <span className="absolute top-4 left-4 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                      {badgeText}
                    </span>
                  )}
                  <img 
                    src={course.thumbnail || "/course_react_1781720871744.png"} 
                    alt={course.title}
                    className="h-full w-full object-contain mix-blend-screen group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">{course.description || "No description provided."}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {course.instructor?.avatar ? (
                      <img src={course.instructor.avatar} alt={instructorName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                          {instructorName.charAt(0)}
                        </div>
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-600 truncate">{instructorName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                      <span className="text-slate-900">{course.avgRating || "0"}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(course.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 ml-1">({course.reviewCount || "0"})</span>
                    </div>
                    <span className="font-bold text-lg text-slate-900">{formatPrice(course.price)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <div className="mt-8 sm:hidden flex justify-center">
          <button onClick={() => navigate('/browse')} className="flex items-center gap-2 text-brand-600 font-medium px-6 py-3 border border-brand-200 rounded-full hover:bg-brand-50 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
