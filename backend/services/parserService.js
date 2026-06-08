import fs from 'fs';
import path from 'path';

/**
 * Basic text extraction as a fallback for TXT files.
 * For PDF, PPTX, and DOCX, we now use Gemini's Native Multimodal capabilities.
 */
export const extractTextFromFile = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.txt') {
            return fs.readFileSync(filePath, 'utf8');
        } 
        
        // Return a descriptive string for other types so the worker knows it's not raw text
        return `Unsupported for direct text extraction. File type: ${ext}`;
    } catch (error) {
        console.error('Error in parserService:', error);
        return "";
    }
};
