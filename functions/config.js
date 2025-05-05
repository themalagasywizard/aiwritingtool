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
  DEFAULT_MODEL: 'deepseek-chat',
  DEFAULT_TEMPERATURE: 0.9,
  DEFAULT_TOP_P: 0.92,
  // Timeout settings
  REQUEST_TIMEOUT: 30000, // 30 seconds
  // Usage limits
  MAX_LENGTH_DEFAULT: 200,
  MAX_LENGTH_LIMIT: 1000,
  FALLBACK_RESPONSE: 'I apologize, but I couldn\'t generate a response at this time. Please try again later.',
  HUGGING_FACE_MODELS: [
    'distilgpt2',
    'gpt2-medium',
    'Qwen/Qwen3-0.6B',
    'google/gemma-2b',
    'meta-llama/Llama-3-8B-Instruct',
    'tiiuae/falcon-7b-instruct',
    'mistralai/Mixtral-8x7B-Instruct-v0.1'
  ],
  DEEPSEEK_MODELS: [
    'deepseek-chat',
    'deepseek-reasoner'
  ]
}; 