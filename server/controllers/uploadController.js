import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { validateFileMagicBytes } from '../utils/fileSignature.js';

export const uploadResource = async (req, res) => {
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

        if (!isValid) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'Invalid file format or file content mismatch' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw', // Must be raw for PDFs to open correctly in browser
            folder: 'zenius/resources'
        });

        // Clean up the local file
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            url: result.secure_url,
            name: req.file.originalname
        });
    } catch (error) {
        console.error('Error uploading resource:', error);
        try { if (req.file) fs.unlinkSync(req.file.path); } catch(e) {}
        
        const responsePayload = { message: 'Failed to upload resource' };
        if (process.env.NODE_ENV !== 'production') {
            responsePayload.message = error.message || 'Failed to upload resource';
            responsePayload.details = error;
        }
        res.status(500).json(responsePayload);
    }
};
