import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI } from '../../api/courses.js';
import CourseCard from '../shared/CourseCard.jsx';
import useUIStore from '../../store/uiStore.js';

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
    badge: "Bestseller"
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
    thumbnail: "/course_react_1781720871744.png"
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
    thumbnail: "/course_js_1781720887062.png"
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
    thumbnail: "/course_node_1781720900805.png"
  }
];

export default function FeaturedCourses() {
  const navigate = useNavigate();
  const { darkMode } = useUIStore();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    coursesAPI.featured()
      .then(res => {
        if (res.data && res.data.data && res.data.data.length > 0) {
          setCourses(res.data.data.slice(0, 8));
        }
      })
      .catch(err => console.error("Failed to load featured courses:", err));
  }, []);

  // Use real backend courses only
  const displayCourses = courses;

  if (displayCourses.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-[var(--bg-surface)] border-t border-b border-slate-100 dark:border-[var(--border-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-[var(--text-primary)] mb-2">Popular Courses</h2>
            <p className="text-slate-600 dark:text-[var(--text-secondary)]">Expand your knowledge with our top-rated courses.</p>
          </div>
          <button onClick={() => navigate('/browse')} className="hidden sm:flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
        
        <div className="mt-8 sm:hidden flex justify-center">
          <button onClick={() => navigate('/browse')} className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium px-6 py-3 border border-brand-200 dark:border-brand-800 rounded-full hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors">
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

