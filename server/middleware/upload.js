import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

// Ensure upload directory exists dynamically
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    setTimeout: 300000,
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /pdf|doc|docx|ppt|pptx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ];
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype) || filetypes.test(file.mimetype);

    if (extname && mimetypeValid) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Incompatible file type or MIME type mismatch'));
    }
};

export const upload = multer({
    storage,
    fileFilter
});
