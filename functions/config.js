// functions/config.js
// This file contains configuration variables for the AI Writing Tool
// In production, these values are set as environment variables

// API Keys - Use environment variables without hardcoded fallbacks in production
const HF_API_KEY = process.env.HF_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

module.exports = {
  HF_API_KEY,
  DEEPSEEK_API_KEY,
  // Model configuration defaults
  DEFAULT_MODEL: 'distilgpt2',
  DEFAULT_TEMPERATURE: 0.9,
  DEFAULT_TOP_P: 0.92,
  // Timeout settings
  REQUEST_TIMEOUT: 30000, // 30 seconds
  // Usage limits
  MAX_LENGTH_DEFAULT: 200,
  MAX_LENGTH_LIMIT: 1000,
}; 