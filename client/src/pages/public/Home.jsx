import React from 'react'
import PageLayout from '../../components/layout/PageLayout.jsx'

// New landing components
import Hero from '../../components/landing/Hero.jsx'
import Statistics from '../../components/landing/Statistics.jsx'
import FeaturedCourses from '../../components/landing/FeaturedCourses.jsx'
import WhyChooseUs from '../../components/landing/WhyChooseUs.jsx'
import StudentPlacements from '../../components/landing/StudentPlacements.jsx'
import Testimonials from '../../components/landing/Testimonials.jsx'
import FAQ from '../../components/landing/FAQ.jsx'
import CTABanner from '../../components/landing/CTABanner.jsx'

export default function Home() {
  return (
    <PageLayout>
      <div className="bg-white">
        <Hero />
        <Statistics />
        <FeaturedCourses />
        <WhyChooseUs />
        <StudentPlacements />
        <Testimonials />
        <FAQ />
        <CTABanner />
      </div>
    </PageLayout>
  )
}
