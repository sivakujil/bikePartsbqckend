import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Mask sensitive data
    const maskedMeta = maskSensitiveData(meta);
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...maskedMeta
    });
  })
);

// Mask sensitive data in logs
function maskSensitiveData(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const masked = { ...obj };

  // Mask passwords
  if (masked.password) masked.password = '***MASKED***';
  if (masked.passwordHash) masked.passwordHash = '***MASKED***';
  if (masked.token) masked.token = '***MASKED***';
  if (masked.otp) masked.otp = '***MASKED***';

  // Mask phone numbers (show last 4 digits)
  if (masked.phone && typeof masked.phone === 'string') {
    masked.phone = maskPhoneNumber(masked.phone);
  }

  // Recursively mask nested objects
  for (const key in masked) {
    if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

function maskPhoneNumber(phone) {
  if (phone.length <= 4) return '***';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production then log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const maskedMeta = maskSensitiveData(meta);
        const metaStr = Object.keys(maskedMeta).length ? ` ${JSON.stringify(maskedMeta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    )
  }));
}

export default logger;





