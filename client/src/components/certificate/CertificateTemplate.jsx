import React from 'react';
import { Award, Download, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function CertificateTemplate({ studentName, courseTitle, instructorName, issueDate }) {
  const formattedDate = new Date(issueDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownload = () => {
    window.print(); // Simple way to let users save as PDF
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white p-2 rounded-lg shadow-xl print:shadow-none print:p-0">
        <div className="border-[12px] border-[#7C3AED] p-8 md:p-12 text-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/always-grey.png')]">
          
          {/* Decorative Corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-400"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-400"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-400"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-400"></div>

          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg">
              <Award size={48} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-gray-800 mb-2 uppercase tracking-wider">
            Certificate of Completion
          </h1>
          <p className="text-gray-500 uppercase tracking-widest text-sm mb-12">
            This is to certify that
          </p>

          <h2 className="text-3xl md:text-4xl font-bold text-[#7C3AED] mb-8 font-serif border-b-2 border-gray-200 pb-4 inline-block px-12">
            {studentName || 'Student Name'}
          </h2>

          <p className="text-gray-600 mb-4 text-lg">
            has successfully completed the course
          </p>

          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-16">
            {courseTitle || 'Course Title'}
          </h3>

          <div className="flex justify-between items-end mt-12 px-8">
            <div className="text-center">
              <div className="border-b border-gray-400 w-48 mb-2 pb-2">
                <span className="font-signature text-xl">{instructorName || 'Instructor Name'}</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Course Instructor</p>
            </div>
            
            <div className="flex flex-col items-center justify-center border-4 border-yellow-400 rounded-full w-24 h-24 bg-white shadow-sm z-10 -mb-6">
              <CheckCircle2 size={32} className="text-yellow-500 mb-1" />
              <span className="text-[10px] font-bold text-yellow-600 uppercase">Verified</span>
            </div>

            <div className="text-center">
              <div className="border-b border-gray-400 w-48 mb-2 pb-2">
                <span className="text-lg font-medium text-gray-800">{formattedDate}</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Date Issued</p>
            </div>
          </div>
          
        </div>
      </div>

      <div className="mt-8 print:hidden">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download size={18} />
          Download as PDF
        </Button>
      </div>
    </div>
  );
}
