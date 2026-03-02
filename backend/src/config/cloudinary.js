import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a buffer to Cloudinary via stream.
 * @param {Buffer} buffer - The file buffer to upload.
 * @param {string} folder - The Cloudinary folder to upload into.
 * @param {string} resourceType - 'image', 'raw', or 'auto' (default: 'auto').
 * @returns {Promise<Object>} The Cloudinary upload response.
 */
export const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: resourceType
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Deletes a file from Cloudinary given its public ID.
 * @param {string} publicId - The Cloudinary public ID.
 * @param {string} resourceType - 'image', 'raw', or 'video' (default: 'image').
 * @returns {Promise<Object>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        throw error;
    }
};

export default cloudinary;
