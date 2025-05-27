const fetch = require('node-fetch');

// Helper function to validate API keys
const validateApiKeys = (modelName) => {
    const isDeepSeekModel = modelName.includes('deepseek');
    
    if (isDeepSeekModel && (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === '')) {
        throw new Error('DEEPSEEK_API_KEY is not configured. Please set this environment variable.');
    }
};

// Helper function to convert words to tokens (approximate)
const wordsToTokens = (wordCount) => {
    return Math.ceil(wordCount * 1.3 * 1.2);
};

// Helper function to ensure text ends with a complete sentence
const ensureCompleteSentence = (text) => {
    if (!text) return text;
    
    const endings = ['. ', '! ', '? ', '."', '!"', '?"', '.\n', '!\n', '?\n'];
    let lastEndIndex = -1;
    
    endings.forEach(ending => {
        const index = text.lastIndexOf(ending);
        if (index > lastEndIndex) {
            lastEndIndex = index + ending.length;
        }
    });
    
    if (lastEndIndex > -1) {
        return text.substring(0, lastEndIndex).trim();
    }
    
    return text.trim();
};

// Create system message based on mode
const createSystemMessage = (mode, userName, desiredWords, tone) => {
    const baseIntro = `You are an AI writing assistant helping ${userName} with a creative writing project.`;
    
    if (mode === 'chat') {
        return `${baseIntro} You are in BRAINSTORMING MODE.

As a brainstorming assistant, help the user explore ideas, develop characters, and plan plot points.

GUIDELINES:
1. Focus on DISCUSSING rather than CREATING final content.
2. Ask thoughtful questions to help develop ideas.
3. Provide concise, helpful suggestions.
4. Respond conversationally with shorter answers.

Keep responses under ${Math.min(desiredWords, 300)} words${tone ? ` in a ${tone} tone` : ''}.`;
    } else {
        return `${baseIntro} You are in WRITING MODE.

Write a creative story continuation of ${desiredWords} words${tone ? ` in a ${tone} tone` : ''}.
Your writing must:
1. Be engaging and creative
2. Use vivid language and well-structured paragraphs
3. Follow the user's specific instructions
4. Show, don't tell

Create compelling narrative content based on the user's prompt.`;
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
        console.log('=== SIMPLE GENERATE-TEXT FUNCTION START ===');
        
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
            mode = 'generate',
            tone = '', 
            length = '500',
            user_id = '',
            project_id = ''
        } = parsedBody;

        console.log('Request parameters:', { prompt: prompt.substring(0, 100) + '...', mode, tone, length, user_id, project_id });

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

        const modelName = 'deepseek-chat'; // Use DeepSeek by default
        
        // Validate API keys
        try {
            validateApiKeys(modelName);
            console.log('API key validation passed for model:', modelName);
        } catch (error) {
            console.error('API key validation failed:', error.message);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: error.message,
                    success: false
                })
            };
        }

        // Convert desired word length to tokens
        const maxDesiredWords = mode === 'chat' ? 500 : 5000;
        const minDesiredWords = mode === 'chat' ? 50 : 100;
        
        const desiredWords = Math.min(Math.max(parseInt(length) || (mode === 'chat' ? 200 : 500), minDesiredWords), maxDesiredWords);
        const maxTokens = wordsToTokens(desiredWords);

        console.log('Calculated parameters:', { desiredWords, maxTokens });

        // Create system message
        const systemMessage = createSystemMessage(mode, 'User', desiredWords, tone);

        // Create request body for DeepSeek
        const requestBody = {
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
            temperature: mode === 'chat' ? 0.9 : 0.8,
            top_p: 0.95,
            max_tokens: maxTokens,
            stream: false,
            presence_penalty: mode === 'chat' ? 0.8 : 0.5,
            frequency_penalty: mode === 'chat' ? 0.7 : 0.5,
            stop: ["###"]
        };

        // Make API request to DeepSeek
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        };

        console.log('Making API request to:', apiUrl);
        console.log('Request body size:', JSON.stringify(requestBody).length, 'characters');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('API Response received, processing...');

        // Extract text and usage info
        let generatedText = '';
        let usage = null;

        if (result.choices?.[0]?.message?.content) {
            generatedText = result.choices[0].message.content;
            usage = result.usage;
        } else {
            console.error('Unexpected API response:', result);
            throw new Error('Invalid response format from API');
        }

        // Ensure we have generated text
        if (!generatedText) {
            console.error('No text generated from API response:', result);
            throw new Error('No text was generated from the API response');
        }

        // Ensure the text ends with a complete sentence
        generatedText = ensureCompleteSentence(generatedText);

        // Count actual words
        const actualWords = generatedText.trim().split(/\s+/).length;

        console.log('Generation successful:', { actualWords, tokensUsed: usage?.total_tokens });

        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                text: generatedText,
                model: modelName,
                userName: 'User',
                mode: mode,
                contextProvided: false,
                previousChaptersProvided: false,
                usage: usage,
                requestedWords: desiredWords,
                actualWords: actualWords,
                actualTokens: usage?.total_tokens || null
            })
        };

    } catch (error) {
        console.error('Error in generate-text-simple:', error);
        
        let errorMessage = error.message;
        let statusCode = 500;
        
        if (error.message.includes('API key')) {
            statusCode = 401;
            errorMessage = 'API key error: ' + error.message;
        } else if (error.message.includes('status 429')) {
            statusCode = 429;
            errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
        } else if (error.message.includes('status 5')) {
            statusCode = 503;
            errorMessage = 'The AI service is currently unavailable. Please try again later.';
        }

        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: errorMessage,
                success: false,
                debug: {
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : null
                }
            })
        };
    }
}; 