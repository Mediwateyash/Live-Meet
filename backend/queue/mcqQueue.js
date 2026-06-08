import { processMaterialJob } from './mcqWorker.js';

export const addMaterialProcessingJob = async (materialId, filePath, startPage, endPage, mcqCount, chapterName) => {
    // Run asynchronously without awaiting so the main thread (API response) finishes immediately
    // This allows the server to not block while processing the file
    processMaterialJob(materialId, filePath, startPage, endPage, mcqCount, chapterName).catch(err => {
        console.error("Background job failed:", err);
    });
};
