import Material from '../models/Material.js';
import { processMaterialJob } from '../queue/mcqWorker.js';
import path from 'path';
import url from 'url';
import fs from 'fs';
import { validateFileMagicBytes } from '../utils/fileSignature.js';

export const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate magic bytes
        const detected = validateFileMagicBytes(req.file.path);
        const ext = path.extname(req.file.originalname).toLowerCase();
        
        let isValid = false;
        if (ext === '.pdf' && detected === 'pdf') isValid = true;
        else if ((ext === '.docx' || ext === '.pptx') && detected === 'zip') isValid = true;
        else if ((ext === '.doc' || ext === '.ppt') && detected === 'ole') isValid = true;
        else if (ext === '.txt' && detected === 'txt') isValid = true;
        else if ((ext === '.jpg' || ext === '.jpeg') && detected === 'jpeg') isValid = true;
        else if (ext === '.png' && detected === 'png') isValid = true;

        if (!isValid) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'Invalid file format or file content mismatch' });
        }

        let startPage = req.body.startPage ? parseInt(req.body.startPage, 10) : null;
        let endPage = req.body.endPage ? parseInt(req.body.endPage, 10) : null;
        let mcqCount = req.body.mcqCount ? parseInt(req.body.mcqCount, 10) : 10;
        let chapterName = req.body.chapterName || null;
        
        let generateMCQ = req.body.generateMCQ === 'true' || req.body.generateMCQ === true;
        let generateWH = req.body.generateWH === 'true' || req.body.generateWH === true;
        let whCount = req.body.whCount ? parseInt(req.body.whCount, 10) : 5;
        
        // If neither is selected (fallback to MCQ for backward compatibility)
        if (!generateMCQ && !generateWH) {
            generateMCQ = true;
        }

        // Validation
        if (mcqCount < 1 || mcqCount > 15) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'MCQ count must be between 1 and 15.' });
        }
        if (startPage && startPage < 1) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'Start page must be 1 or greater.' });
        }
        if (startPage && endPage && startPage > endPage) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'End page must be greater than or equal to start page.' });
        }

        let courseId = req.body.courseId || null;

        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const material = await Material.create({
            fileName: safeName,
            fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
            chapterName: chapterName,
            startPage: startPage,
            endPage: endPage,
            uploadedBy: req.user._id,
            courseId: courseId,
            status: 'pending' // Initial status
        });

        // Process in background without blocking the response (bypassing Redis/BullMQ)
        processMaterialJob(material._id, req.file.path, startPage, endPage, chapterName, { generateMCQ, mcqCount, generateWH, whCount }).catch(console.error);

        res.status(201).json({
            message: 'Material uploaded and queued for processing successfully',
            material
        });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({ message: error.message });
    }
};

export const getMaterials = async (req, res) => {
    try {
        let query = {};
        if (req.query.courseId) {
            query.courseId = req.query.courseId;
        }
        if (req.user.role === 'student') {
            // Students can see all successfully processed materials
            query.status = 'completed';
        } else if (req.user.role === 'instructor') {
            query.uploadedBy = req.user._id;
        }
        const materials = await Material.find(query).sort({ createdAt: -1 }).populate('uploadedBy', 'fullName');
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMaterialById = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (material) {
            if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }
            res.json(material);
        } else {
            res.status(404).json({ message: 'Material not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        
        if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Delete all associated MCQs and WH Questions
        const MCQ = (await import('../models/MCQ.js')).default;
        await MCQ.deleteMany({ materialId: material._id });
        
        const WHQuestion = (await import('../models/WHQuestion.js')).default;
        await WHQuestion.deleteMany({ materialId: material._id });
        
        // Delete the material
        await material.deleteOne();
        
        res.json({ message: 'Material and associated MCQs deleted successfully' });
    } catch (error) {
        console.error("Delete material error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
