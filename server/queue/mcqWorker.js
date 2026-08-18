import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Material from '../models/Material.js';
import MCQ from '../models/MCQ.js';
import WHQuestion from '../models/WHQuestion.js';
import { extractTextFromFile } from '../services/parserService.js';
import { generateMCQs, generateWHQuestions } from '../services/aiService.js';

dotenv.config();

/**
 * Maps file extensions to MIME types for Gemini Multimodal processing
 */
const getMimeType = (ext) => {
    switch (ext.toLowerCase()) {
        case '.pdf': return 'application/pdf';
        case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        default: return null;
    }
};

export const processMaterialJob = async (materialId, filePath, startPage, endPage, chapterName, options = {}) => {
    const { generateMCQ = true, mcqCount = 10, generateWH = false, whCount = 5 } = options;
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

            if (generateMCQ) {
                results = await generateMCQs({ fileBuffer, mimeType, numQuestions: mcqCount, startPage, endPage, chapterName });
            }
            if (generateWH) {
                const whResults = await generateWHQuestions({ fileBuffer, mimeType, numQuestions: whCount, startPage, endPage, chapterName });
                const whsWithId = whResults.map(wh => ({ ...wh, materialId }));
                await WHQuestion.insertMany(whsWithId);
                console.log(`[Worker] SUCCESS. Saved ${whResults.length} WH Questions.`);
            }
        } 
        // 2. Text Path Fallback (TXT)
        else {
            console.log(`[Worker] Using Text Extraction path for ${ext}`);
            const extractedText = await extractTextFromFile(filePath);
            if (!extractedText) throw new Error("Extracted text is empty.");
            
            await Material.findByIdAndUpdate(materialId, { extractedText });
            if (generateMCQ) {
                results = await generateMCQs({ text: extractedText, numQuestions: mcqCount, startPage, endPage, chapterName });
            }
            if (generateWH) {
                const whResults = await generateWHQuestions({ text: extractedText, numQuestions: whCount, startPage, endPage, chapterName });
                const whsWithId = whResults.map(wh => ({ ...wh, materialId }));
                await WHQuestion.insertMany(whsWithId);
                console.log(`[Worker] SUCCESS. Saved ${whResults.length} WH Questions.`);
            }
        }

        // 3. Save MCQs to DB
        if (generateMCQ && results.length > 0) {
            const mcqsWithId = results.map(mcq => ({
                ...mcq,
                materialId
            }));

            await MCQ.insertMany(mcqsWithId);
            console.log(`[Worker] SUCCESS for ${materialId}. Saved ${results.length} high-quality MCQs.`);
        }
        
        await Material.findByIdAndUpdate(materialId, { status: 'completed' });

    } catch (error) {
        console.error(`[Worker] JOB FAILED for ${materialId}:`, error.message);
        await Material.findByIdAndUpdate(materialId, { 
            status: 'failed',
            error: error.message
        });
        throw error; // Re-throw so the controller knows it failed
    }
};
