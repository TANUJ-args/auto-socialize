/**
 * Secure logging utilities to prevent sensitive data exposure
 */

const sensitiveKeys = [
  'password', 'token', 'accessToken', 'secret', 'key', 'auth', 'authorization',
  'cookie', 'session', 'credential', 'private', 'confidential'
];

/**
 * Sanitize an object by removing or masking sensitive data
 * @param {any} data - The data to sanitize
 * @param {string[]} additionalSensitiveKeys - Additional keys to consider sensitive
 * @returns {any} - Sanitized data safe for logging
 */
export const sanitizeForLogging = (data, additionalSensitiveKeys = []) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const allSensitiveKeys = [...sensitiveKeys, ...additionalSensitiveKeys];
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, additionalSensitiveKeys));
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = allSensitiveKeys.some(sensitiveKey => 
      keyLower.includes(sensitiveKey.toLowerCase())
    );
    
    if (isSensitive) {
      if (typeof value === 'string' && value.length > 0) {
        // Show first 4 and last 4 characters for tokens/keys
        if (value.length > 8) {
          sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value, additionalSensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Safe console.log that automatically sanitizes sensitive data
 * @param {string} message - Log message
 * @param {any} data - Data to log (will be sanitized)
 * @param {string[]} additionalSensitiveKeys - Additional keys to consider sensitive
 */
export const safeLog = (message, data = null, additionalSensitiveKeys = []) => {
  if (data) {
    console.log(message, sanitizeForLogging(data, additionalSensitiveKeys));
  } else {
    console.log(message);
  }
};

/**
 * Safe console.error that automatically sanitizes sensitive data
 * @param {string} message - Error message
 * @param {any} data - Data to log (will be sanitized)
 * @param {string[]} additionalSensitiveKeys - Additional keys to consider sensitive
 */
export const safeError = (message, data = null, additionalSensitiveKeys = []) => {
  if (data) {
    console.error(message, sanitizeForLogging(data, additionalSensitiveKeys));
  } else {
    console.error(message);
  }
};

export default {
  sanitizeForLogging,
  safeLog,
  safeError
};