import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a base64 image string to Cloudinary.
 * If the input is not a base64 data URL, it returns the input as-is.
 * 
 * @param {string} base64Str The base64 image data URL (e.g. data:image/jpeg;base64,...)
 * @param {string} folder The folder to store the image in Cloudinary
 * @returns {Promise<string>} The Cloudinary secure URL, or the original string on failure/skip
 */
export async function uploadBase64Image(base64Str, folder = 'zenius/thumbnails') {
  if (base64Str && typeof base64Str === 'string' && base64Str.startsWith('data:image/')) {
    try {
      const result = await cloudinary.uploader.upload(base64Str, {
        folder,
      });
      return result.secure_url;
    } catch (error) {
      console.error(`Failed to upload image to Cloudinary (folder: ${folder}):`, error);
    }
  }
  return base64Str;
}
