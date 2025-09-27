import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary
const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET &&
                     !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
                     !process.env.CLOUDINARY_API_KEY.includes('your_') &&
                     !process.env.CLOUDINARY_API_SECRET.includes('your_');

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('[Cloudinary] Configuration loaded successfully');
} else {
  console.warn('[Cloudinary] Configuration missing - upload functions will throw errors');
}

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64Data - Base64 image data (without data:image/... prefix)
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Custom public ID (optional)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBase64Image = async (base64Data, folder = 'ai-generated', publicId = null) => {
  try {
    if (!isConfigured) {
      throw new Error('Cloudinary not configured - missing environment variables');
    }
    
    // Generate unique public ID if not provided
    const finalPublicId = publicId || `${folder}/${uuidv4()}`;
    
    console.log('[Cloudinary] Uploading image to folder:', folder);
    
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        public_id: finalPublicId,
        folder: folder,
        resource_type: 'image',
        format: 'jpg', // Convert to JPG for better compression
        quality: 'auto:good', // Automatic quality optimization
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      }
    );
    
    console.log('[Cloudinary] Upload successful:', result.secure_url);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw new Error(`Failed to upload image to CDN: ${error.message}`);
  }
};

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBuffer = async (buffer, folder = 'uploads', filename = null) => {
  try {
    const publicId = filename ? `${folder}/${filename.split('.')[0]}` : `${folder}/${uuidv4()}`;
    
    const result = await cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',
        quality: 'auto:good'
      },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );
    
    // Convert buffer to stream and upload
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          quality: 'auto:good'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      );
      
      stream.end(buffer);
    });
  } catch (error) {
    console.error('[Cloudinary] Buffer upload failed:', error);
    throw new Error(`Failed to upload file to CDN: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary] Image deleted:', publicId);
    return { success: result.result === 'ok' };
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto:good',
    fetch_format: 'auto'
  };
  
  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations
  });
};

export default cloudinary;