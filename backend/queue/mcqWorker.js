import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Material from '../models/Material.js';
import MCQ from '../models/MCQ.js';
import { extractTextFromFile } from '../services/parserService.js';
import { generateMCQs } from '../services/aiService.js';

dotenv.config();

/**
 * Maps file extensions to MIME types for Gemini Multimodal processing
 */
const getMimeType = (ext) => {
    switch (ext.toLowerCase()) {
        case '.pdf': return 'application/pdf';
        case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        default: return null;
    }
};

export const processMaterialJob = async (materialId, filePath, startPage, endPage, mcqCount, chapterName) => {
    console.log(`[Worker] Started processing for Material ${materialId} - ${filePath}`);

    try {
        await Material.findByIdAndUpdate(materialId, { status: 'processing' });

        const ext = path.extname(filePath).toLowerCase();
        const mimeType = getMimeType(ext);
        let results = [];

        // 1. Multimodal Path (PDF, PPTX, DOCX) - 2026 Native AI Support
        if (mimeType) {
            console.log(`[Worker] Using Multimodal path for ${mimeType}`);
            const fileBuffer = fs.readFileSync(filePath);
            
            // Check file size (approx limit 100MB for inlineData)
            const stats = fs.statSync(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            
            if (fileSizeMB > 100) {
                throw new Error("File size exceeds 100MB limit for prompt processing.");
            }

            results = await generateMCQs({ fileBuffer, mimeType, numQuestions: mcqCount, startPage, endPage, chapterName });
        } 
        // 2. Text Path Fallback (TXT)
        else {
            console.log(`[Worker] Using Text Extraction path for ${ext}`);
            const extractedText = await extractTextFromFile(filePath);
            if (!extractedText) throw new Error("Extracted text is empty.");
            
            await Material.findByIdAndUpdate(materialId, { extractedText });
            results = await generateMCQs({ text: extractedText, numQuestions: mcqCount, startPage, endPage, chapterName });
        }

        // 3. Save MCQs to DB
        const mcqsWithId = results.map(mcq => ({
            ...mcq,
            materialId
        }));

        await MCQ.insertMany(mcqsWithId);
        await Material.findByIdAndUpdate(materialId, { status: 'completed' });
        
        console.log(`[Worker] SUCCESS for ${materialId}. Saved ${results.length} high-quality MCQs.`);

    } catch (error) {
        console.error(`[Worker] JOB FAILED for ${materialId}:`, error.message);
        await Material.findByIdAndUpdate(materialId, { 
            status: 'failed',
            error: error.message
        });
    }
};
