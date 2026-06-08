import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-sm font-bold text-primary">Developed by Team Zenius AI</p>
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Zenius AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
