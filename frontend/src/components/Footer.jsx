import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Major Project Sem 8
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Watumull Institute of  Engineering and Technology
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-primary mb-3 text-center md:text-right">Developed By Team Zenius AI</h4>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-gray-600 font-semibold">
                                <span>Yash Diwate</span>
                                <span>Anush Gajbhiye</span>
                                <span>Mrityunjay Dwivedi</span>
                                <span>Sneha Shinde</span>
                            </div>
                        </div>
                        <div className="w-full pt-3 border-t border-gray-100 mt-1 flex justify-center md:justify-end">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Guide: Prof. Sandeep More</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Zenius AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
