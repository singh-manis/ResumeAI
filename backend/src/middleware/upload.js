import multer from 'multer';
import path from 'path';

// Use memory storage to temporarily hold the file buffer before uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter - only allow specific file types for resumes
const resumeFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

// Configure multer for resumes
export const uploadResume = multer({
    storage,
    fileFilter: resumeFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    }
});

// Avatar filter - only images
const avatarFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

// Configure multer for avatars
export const uploadAvatar = multer({
    storage, // Reuse memory storage
    fileFilter: avatarFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
