// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config');

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || 'Request timed out')), ms)
);

// Helper function to calculate dynamic timeout based on tokens
const calculateTimeout = (maxTokens, mode, isDeepSeekModel) => {
    // Adjust timeouts to be within Netlify's limits
    const BASE_TIMEOUT = 20000;   // 20 seconds base
    const MAX_TIMEOUT = 110000;   // 110 seconds maximum (below Netlify's 120s limit)
    const MIN_TIMEOUT = 10000;    // 10 seconds minimum
    const MS_PER_TOKEN = 75;      // 75ms per token for scaling

    if (mode === 'chat' && isDeepSeekModel) {
        // Scale timeout with token length for DeepSeek chat
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * MS_PER_TOKEN);
        return Math.min(MAX_TIMEOUT, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else if (isDeepSeekModel) {
        // For non-chat DeepSeek modes, use a lower scaling factor
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * 50); // 50ms per token
        return Math.min(90000, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else {
        // For other models, use shorter timeouts
        return mode === 'chat' ? 25000 : 45000;
    }
};

// Helper function to create error response
const createErrorResponse = (error, isTimeout = false) => {
    const errorMessage = isTimeout
        ? 'The request is taking longer than expected. Please try with a shorter length or a faster model.'
        : (error.message || 'An unexpected error occurred');

    return {
        statusCode: isTimeout ? 408 : 500, // Use proper status codes
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: false,
            error: errorMessage,
            model: 'error'
        })
    };
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
const handler = async (event) => {
    try {
        // Basic validation
        if (!event.body) {
            return createErrorResponse(new Error('Missing request body'));
        }

        // Parse request
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (e) {
            return createErrorResponse(new Error('Invalid JSON in request body'));
        }

        const { 
            prompt = '', 
            context = [], 
            mode = 'generate', 
            tone = '', 
            length = '200' 
        } = parsedBody;

        if (!prompt) {
            return createErrorResponse(new Error('Prompt is required'));
        }

        const modelName = event.queryStringParameters?.model || config.DEFAULT_MODEL;
        const isDeepSeekModel = modelName.includes('deepseek');
        const apiUrl = isDeepSeekModel 
            ? 'https://api.deepseek.com/chat/completions' 
            : `https://api-inference.huggingface.co/models/${modelName}`;

        // Calculate max tokens and timeout
        const maxTokens = Math.min(parseInt(length) || 200, 800);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);

        // Create request body
        const requestBody = isDeepSeekModel ? {
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: "You are a creative writing assistant that creates imaginative and engaging content."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: maxTokens,
            stream: false
        } : {
            inputs: prompt,
            parameters: {
                temperature: 0.7,
                top_p: 0.9,
                max_length: maxTokens,
                do_sample: true
            }
        };

        // Make API request
        const response = await fetchWithTimeout(
            apiUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${isDeepSeekModel ? config.DEEPSEEK_API_KEY : config.HF_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            },
            timeout
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        // Parse response
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
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                text: generatedText.trim(),
                model: modelName,
                usage: usage || null
            })
        };

    } catch (error) {
        console.error('Error in generate-text:', error);
        const isTimeout = error.message.includes('timed out') || error.name === 'AbortError';
        return createErrorResponse(error, isTimeout);
    }
};

module.exports = { handler }; 