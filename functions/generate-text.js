// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helper function to truncate text to a maximum length
const truncateText = (text, maxLength = 1000) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to summarize text (for previous chapter content)
const summarizeText = (text) => {
  if (!text) return '';
  const maxLength = 500;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to fetch project context from Supabase
const fetchProjectContext = async (projectId, userId) => {
  try {
    // Fetch locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('name, type, description, key_features')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (locationsError) throw locationsError;
    
    // Fetch timeline events
    const { data: events, error: eventsError } = await supabase
      .from('timeline_events')
      .select('name, date_time, description, created_at')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (eventsError) throw eventsError;
    
    // Fetch characters
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('name, role, traits, backstory')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (charactersError) throw charactersError;
    
    // Format the context string
    let contextString = 'Project Context:\n';
    
    // Add locations
    contextString += '\nLocations:\n';
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        contextString += `Location: ${loc.name} (${loc.type}, ${truncateText(loc.description, 200)}, ${truncateText(loc.key_features, 200)})\n`;
      });
    } else {
      contextString += 'No locations found.\n';
    }
    
    // Add timeline events
    contextString += '\nTimeline Events:\n';
    if (events && events.length > 0) {
      events.forEach(event => {
        contextString += `Event: ${event.name} on ${event.date_time} (${truncateText(event.description, 200)})\n`;
      });
    } else {
      contextString += 'No timeline events found.\n';
    }
    
    // Add characters
    contextString += '\nCharacters:\n';
    if (characters && characters.length > 0) {
      characters.forEach(char => {
        contextString += `Character: ${char.name} (${char.role}, ${truncateText(char.traits, 200)}, ${truncateText(char.backstory, 200)})\n`;
      });
    } else {
      contextString += 'No characters found.\n';
    }
    
    return contextString;
  } catch (error) {
    console.error('Error fetching project context:', error);
    return 'Error fetching project context.';
  }
};

// Helper function to fetch previous chapter
const fetchPreviousChapter = async (projectId, userId) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('content')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0 && data[0].content) {
      return summarizeText(data[0].content);
    }
    
    return 'No previous chapter found.';
  } catch (error) {
    console.error('Error fetching previous chapter:', error);
    return 'Error fetching previous chapter.';
  }
};

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
    // Add 20% buffer to ensure we don't cut off mid-sentence
    return Math.ceil(wordCount * 1.3 * 1.2);
};

// Helper function to ensure text ends with a complete sentence
const ensureCompleteSentence = (text) => {
    if (!text) return text;
    
    // Find the last occurrence of common sentence endings
    const endings = ['. ', '! ', '? ', '."', '!"', '?"', '.\n', '!\n', '?\n'];
    let lastEndIndex = -1;
    
    endings.forEach(ending => {
        const index = text.lastIndexOf(ending);
        if (index > lastEndIndex) {
            lastEndIndex = index + ending.length;
        }
    });
    
    // If we found a sentence ending, trim to that point
    if (lastEndIndex > -1) {
        return text.substring(0, lastEndIndex).trim();
    }
    
    // If no sentence ending found, return the original text
    return text.trim();
};

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || 'Request timed out')), ms)
);

// Helper function to calculate dynamic timeout based on tokens
const calculateTimeout = (maxTokens, mode, isDeepSeekModel) => {
    const BASE_TIMEOUT = 30000;   // 30 seconds base
    const MAX_TIMEOUT = 110000;   // 110 seconds maximum
    const MIN_TIMEOUT = 15000;    // 15 seconds minimum
    const MS_PER_TOKEN = 100;     // 100ms per token for scaling

    if (mode === 'chat' && isDeepSeekModel) {
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * MS_PER_TOKEN);
        return Math.min(MAX_TIMEOUT, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else if (isDeepSeekModel) {
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * 75);
        return Math.min(110000, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else {
        return mode === 'chat' ? 45000 : 60000;
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
            length = '500' 
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
        const desiredWords = Math.min(Math.max(parseInt(length) || 500, 50), 5000);
        const maxTokens = wordsToTokens(desiredWords);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);

        // Create system message based on desired length and tone
        const systemMessage = `You are a creative writing assistant that creates imaginative and engaging content. 
Generate a detailed response of approximately ${desiredWords} words${tone ? ` in a ${tone} tone` : ''}.
Ensure the response is well-structured and complete, with proper paragraph breaks and complete sentences.
Do not stop mid-sentence. If approaching the token limit, find a natural ending point.`;

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
            temperature: 0.8,
            top_p: 0.95,
            max_tokens: maxTokens,
            stream: false,
            presence_penalty: 0.5,  // Increased to encourage more diverse content
            frequency_penalty: 0.5,  // Increased to reduce repetition
            stop: ["###"]  // Add a stop sequence to prevent mid-sentence cutoff
        } : {
            inputs: `${systemMessage}\n\n${prompt}\n\nResponse:`,
            parameters: {
                temperature: 0.8,
                top_p: 0.95,
                max_new_tokens: maxTokens,
                do_sample: true,
                num_return_sequences: 1,
                length_penalty: 1.5,  // Increased to encourage longer outputs
                repetition_penalty: 1.3,  // Increased to reduce repetition
                early_stopping: true,
                stop: ["###"]
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

        // Ensure the text ends with a complete sentence
        generatedText = ensureCompleteSentence(generatedText);

        // Count actual words
        const actualWords = generatedText.trim().split(/\s+/).length;

        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                text: generatedText,
                model: modelName,
                usage: usage || null,
                requestedWords: desiredWords,
                actualWords: actualWords,
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