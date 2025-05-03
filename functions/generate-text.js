// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config');

// Helper function to validate API keys
const validateApiKeys = (modelName) => {
    const isDeepSeekModel = modelName.includes('deepseek');
    
    if (isDeepSeekModel && (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === '')) {
        throw new Error('DEEPSEEK_API_KEY is not configured. Please set this environment variable.');
    }
    
    if (!isDeepSeekModel && (!process.env.HF_API_KEY || process.env.HF_API_KEY === '')) {
        throw new Error('HF_API_KEY is not configured. Please set this environment variable.');
    }
};

// Helper function to convert words to tokens (approximate)
const wordsToTokens = (wordCount) => {
    // Average ratio of tokens to words is roughly 1.3
    return Math.ceil(wordCount * 1.3);
};

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || 'Request timed out')), ms)
);

// Helper function to calculate dynamic timeout based on tokens
const calculateTimeout = (maxTokens, mode, isDeepSeekModel) => {
    const BASE_TIMEOUT = 20000;   // 20 seconds base
    const MAX_TIMEOUT = 110000;   // 110 seconds maximum
    const MIN_TIMEOUT = 10000;    // 10 seconds minimum
    const MS_PER_TOKEN = 75;      // 75ms per token for scaling

    if (mode === 'chat' && isDeepSeekModel) {
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * MS_PER_TOKEN);
        return Math.min(MAX_TIMEOUT, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else if (isDeepSeekModel) {
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * 50);
        return Math.min(90000, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else {
        return mode === 'chat' ? 25000 : 45000;
    }
};

// Helper function to fetch with timeout
const fetchWithTimeout = async (url, options, timeout) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await Promise.race([
            fetch(url, { ...options, signal: controller.signal }),
            timeoutPromise(timeout)
        ]);
        
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
};

// Export using the proper format for Netlify Functions
exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    try {
        // Basic validation
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    error: 'Method not allowed. Please use POST.',
                    success: false
                })
            };
        }

        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing request body',
                    success: false
                })
            };
        }

        // Parse request
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON in request body',
                    success: false
                })
            };
        }

        const { 
            prompt = '', 
            context = [], 
            mode = 'generate', 
            tone = '', 
            length = '200' 
        } = parsedBody;

        if (!prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Prompt is required',
                    success: false
                })
            };
        }

        const modelName = event.queryStringParameters?.model || config.DEFAULT_MODEL;
        
        // Validate API keys before making request
        try {
            validateApiKeys(modelName);
        } catch (error) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: error.message,
                    success: false
                })
            };
        }

        const isDeepSeekModel = modelName.includes('deepseek');
        const apiUrl = isDeepSeekModel 
            ? 'https://api.deepseek.com/v1/chat/completions'
            : `https://api-inference.huggingface.co/models/${modelName}`;

        // Convert desired word length to tokens and ensure minimum/maximum bounds
        const desiredWords = Math.min(Math.max(parseInt(length) || 200, 50), 2000);
        const maxTokens = wordsToTokens(desiredWords);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);

        // Create system message based on desired length and tone
        const systemMessage = `You are a creative writing assistant that creates imaginative and engaging content. 
Generate approximately ${desiredWords} words of text${tone ? ` in a ${tone} tone` : ''}.
Ensure the response is detailed and well-structured.`;

        // Create request body
        const requestBody = isDeepSeekModel ? {
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: maxTokens,
            stream: false,
            presence_penalty: 0.3,  // Encourage more diverse content
            frequency_penalty: 0.3   // Reduce repetition
        } : {
            inputs: `${systemMessage}\n\n${prompt}`,
            parameters: {
                temperature: 0.7,
                top_p: 0.9,
                max_new_tokens: maxTokens,
                do_sample: true,
                num_return_sequences: 1,
                length_penalty: 1.2,  // Encourage longer outputs
                repetition_penalty: 1.2  // Reduce repetition
            }
        };

        // Make API request
        const response = await fetchWithTimeout(
            apiUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${isDeepSeekModel ? process.env.DEEPSEEK_API_KEY : process.env.HF_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            },
            timeout
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `API request failed with status ${response.status}`,
                    details: errorText,
                    success: false
                })
            };
        }

        const result = await response.json();
        
        // Extract text and usage info
        let generatedText = '';
        let usage = null;

        if (isDeepSeekModel && result.choices?.[0]?.message?.content) {
            generatedText = result.choices[0].message.content;
            usage = result.usage;
        } else if (Array.isArray(result) && result[0]?.generated_text) {
            generatedText = result[0].generated_text;
        } else if (result.generated_text) {
            generatedText = result.generated_text;
        } else {
            throw new Error('Invalid response format from API');
        }

        if (!generatedText) {
            throw new Error('No text was generated');
        }

        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                text: generatedText.trim(),
                model: modelName,
                usage: usage || null,
                requestedWords: desiredWords,
                actualTokens: usage?.total_tokens || null
            })
        };

    } catch (error) {
        console.error('Error in generate-text:', error);
        
        const statusCode = error.message.includes('timed out') ? 408 
            : error.message.includes('API key') ? 401 
            : 500;

        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: error.message,
                success: false
            })
        };
    }
}; 