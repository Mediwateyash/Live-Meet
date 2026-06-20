import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto', // Use auto to let Cloudinary handle it
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
        res.status(500).json({ message: error.message || 'Failed to upload resource', details: error });
    }
};
