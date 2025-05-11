// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client with error handling
let supabase;
try {
  // Check if Supabase environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }

  // Initialize Supabase client with explicit error handling
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false // Since this is a serverless function
      }
    }
  );

  // Test the connection
  console.log('Testing Supabase connection...');
  supabase.from('projects').select('count').limit(1)
    .then(() => {
      console.log('Supabase connection successful');
    })
    .catch(error => {
      console.error('Supabase connection test failed:', error);
      throw error;
    });

} catch (error) {
  console.error('Error initializing Supabase client:', error);
  supabase = null;
}

// Add a helper function to check Supabase connection
const ensureSupabaseConnection = async () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.');
  }
  
  try {
    // Test the connection with a simple query
    await supabase.from('projects').select('count').limit(1);
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    throw new Error('Failed to connect to Supabase. Please check your configuration.');
  }
};

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
    // Ensure Supabase connection is working
    await ensureSupabaseConnection();
    
    console.log(`Fetching context for project_id: ${projectId}, user_id: ${userId}`);
    
    // Fetch locations with specific fields and detailed logging
    console.log('Executing locations query with project_id:', projectId);
    const locationsQuery = supabase
      .from('locations')
      .select('id, name, type, description, key_features')
      .eq('project_id', projectId);
    
    console.log('Locations query:', locationsQuery.toSQL()); // Log the SQL query
    
    const { data: locations, error: locationsError } = await locationsQuery;
    
    if (locationsError) {
      console.error('Location query error:', locationsError);
      throw locationsError;
    }

    // Log the exact data received
    console.log('Locations query response:', {
      success: !!locations,
      count: locations?.length || 0,
      data: locations
    });
    
    if (!locations) {
      console.warn('No locations data returned from query');
    } else if (locations.length === 0) {
      console.warn('Zero locations found for project:', projectId);
    } else {
      console.log('Successfully fetched locations:', locations.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type
      })));
    }

    // Test query to verify table access
    const { count, error: countError } = await supabase
      .from('locations')
      .select('*', { count: 'exact' });
      
    console.log('Total locations in database:', count);
    if (countError) {
      console.error('Error counting locations:', countError);
    }

    // Fetch timeline events with relationships
    console.log('Querying timeline_events with:', { project_id: projectId });
    const { data: events, error: eventsError } = await supabase
      .from('timeline_events')
      .select(`
        *,
        locations (id, name),
        timeline_event_characters (
          characters (id, name, role)
        )
      `)
      .eq('project_id', projectId);
    
    if (eventsError) {
      console.error('Events query error:', eventsError);
      throw eventsError;
    }
    console.log('Raw events data:', events);
    console.log(`Fetched ${events ? events.length : 0} events`);
    
    // Fetch characters with detailed query logging
    console.log('Querying characters with:', { project_id: projectId });
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId);
    
    if (charactersError) {
      console.error('Characters query error:', charactersError);
      throw charactersError;
    }
    console.log('Raw characters data:', characters);
    console.log(`Fetched ${characters ? characters.length : 0} characters`);
    
    // Format the context string with more detailed information
    let contextString = 'Project Context:\n\n';
    
    // Add characters section with detailed information
    contextString += 'Characters:\n';
    if (characters && characters.length > 0) {
      characters.forEach(char => {
        contextString += `Character: ${char.name}\n`;
        contextString += `  Role: ${char.role}\n`;
        if (char.traits) contextString += `  Traits: ${truncateText(char.traits, 200)}\n`;
        if (char.backstory) contextString += `  Backstory: ${truncateText(char.backstory, 300)}\n`;
        
        // Add character's involvement in events
        const characterEvents = events?.filter(event => 
          event.timeline_event_characters?.some(tec => 
            tec.characters?.id === char.id
          )
        );
        if (characterEvents?.length > 0) {
          contextString += `  Appears in events:\n`;
          characterEvents.forEach(event => {
            contextString += `    - ${event.name} (${event.date_time})\n`;
          });
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No characters found.\n\n';
    }
    
    // Add locations section with detailed information
    contextString += 'Locations:\n';
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        contextString += `Location: ${loc.name}\n`;
        contextString += `  Type: ${loc.type || 'Unspecified'}\n`;
        if (loc.description) contextString += `  Description: ${truncateText(loc.description, 200)}\n`;
        if (loc.key_features) contextString += `  Key Features: ${truncateText(loc.key_features, 200)}\n`;
        
        // Add events that occur at this location
        const locationEvents = events?.filter(event => event.location_id === loc.id);
        if (locationEvents?.length > 0) {
          contextString += `  Events at this location:\n`;
          locationEvents.forEach(event => {
            contextString += `    - ${event.name} (${event.date_time})\n`;
          });
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No locations found.\n\n';
    }
    
    // Add timeline events section with detailed information
    contextString += 'Timeline Events (in chronological order):\n';
    if (events && events.length > 0) {
      events.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      events.forEach(event => {
        contextString += `Event: ${event.name}\n`;
        contextString += `  Time: ${event.date_time}\n`;
        if (event.description) contextString += `  Description: ${truncateText(event.description, 200)}\n`;
        
        // Add location information
        if (event.locations) {
          contextString += `  Location: ${event.locations.name}\n`;
        }
        
        // Add involved characters
        const involvedCharacters = event.timeline_event_characters
          ?.map(tec => tec.characters?.name)
          .filter(Boolean);
        
        if (involvedCharacters?.length > 0) {
          contextString += `  Characters involved: ${involvedCharacters.join(', ')}\n`;
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No timeline events found.\n';
    }
    
    return contextString;
  } catch (error) {
    console.error('Error in fetchProjectContext:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
};

// Helper function to fetch previous chapters with focus on continuity
const fetchPreviousChapters = async (projectId, userId, prompt = '') => {
  try {
    // Ensure Supabase connection is working
    await ensureSupabaseConnection();
    
    console.log(`Fetching previous chapters for project_id: ${projectId}`);
    console.log('Querying chapters with:', { project_id: projectId });
    
    // Extract chapter number from prompt if it exists
    const chapterMatch = prompt.match(/chapter\s+(\d+)/i);
    const targetChapter = chapterMatch ? parseInt(chapterMatch[1]) : null;
    
    // Fetch all chapters with detailed query logging
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Chapters query error:', error);
      throw error;
    }
    
    console.log('Raw chapters data:', data);
    console.log(`Fetched ${data ? data.length : 0} chapters`);
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} chapters`);
      let chaptersText = 'PREVIOUS CHAPTERS:\n\n';
      
      if (targetChapter) {
        // If continuing a specific chapter, focus on that chapter and its immediate predecessor
        const targetIndex = data.findIndex(chapter => chapter.order_index === targetChapter - 1);
        if (targetIndex !== -1) {
          // Add the target chapter
          const targetChapterData = data[targetIndex];
          chaptersText += `CURRENT CHAPTER TO CONTINUE FROM (Chapter ${targetChapter}):\n`;
          chaptersText += `Title: ${targetChapterData.title || 'Untitled'}\n`;
          chaptersText += `${targetChapterData.content}\n\n`;
          
          // Add the previous chapter for context if it exists
          if (targetIndex > 0) {
            const previousChapter = data[targetIndex - 1];
            chaptersText += `PREVIOUS CHAPTER (Chapter ${targetChapter - 1}):\n`;
            chaptersText += `Title: ${previousChapter.title || 'Untitled'}\n`;
            chaptersText += `${summarizeText(previousChapter.content)}\n\n`;
          }
          
          // Add a brief summary of earlier chapters
          if (targetIndex > 1) {
            chaptersText += 'EARLIER CHAPTERS SUMMARY:\n';
            data.slice(0, targetIndex - 1).forEach((chapter, index) => {
              chaptersText += `Chapter ${index + 1}: ${chapter.title || 'Untitled'}\n`;
              chaptersText += `${summarizeText(chapter.content, 200)}\n\n`;
            });
          }
        } else {
          chaptersText += `Warning: Chapter ${targetChapter} not found. Here are all available chapters:\n\n`;
          data.forEach((chapter, index) => {
            chaptersText += `Chapter ${index + 1}: ${chapter.title || 'Untitled'}\n`;
            chaptersText += `${summarizeText(chapter.content)}\n\n`;
          });
        }
      } else {
        // If not continuing a specific chapter, include all chapters with most recent in full
        data.forEach((chapter, index) => {
          chaptersText += `Chapter ${index + 1}: ${chapter.title || 'Untitled'}\n`;
          // Show full content for the most recent chapter, summaries for others
          if (index === data.length - 1) {
            chaptersText += `${chapter.content}\n\n`;
          } else {
            chaptersText += `${summarizeText(chapter.content)}\n\n`;
          }
        });
      }
      
      return chaptersText;
    }
    
    console.log('No previous chapters found');
    return 'No previous chapters found.';
  } catch (error) {
    console.error('Error fetching previous chapters:', error);
    return 'Error fetching previous chapters: ' + error.message;
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
            length = '500',
            user_id = '',
            project_id = ''
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
        
        // Validate user_id and project_id
        if (!user_id || !project_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'user_id and project_id are required',
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
        
        // Fetch user data, project context, and previous chapters
        let userName = 'User'; // Default value
        let contextString = '';
        let previousChapters = '';
        
        try {
            // Get authenticated user data if Supabase is available
            if (supabase) {
                // Get user from auth
                const { data: authData, error: authError } = await supabase.auth.getUser();
                
                if (!authError && authData && authData.user) {
                    // Try to get user's name from auth.users table
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')  // Assuming a profiles table exists with user names
                        .select('name')
                        .eq('id', authData.user.id)
                        .single();
                    
                    if (!userError && userData && userData.name) {
                        userName = userData.name;
                    } else {
                        console.log('User profile not found, using email or default name');
                        // Fallback to email address if available
                        userName = authData.user.email?.split('@')[0] || 'User';
                    }
                } else {
                    console.log('Auth user not found, using default name');
                }
                
                // Fetch project context
                contextString = await fetchProjectContext(project_id, user_id);
                
                // Fetch all previous chapters
                previousChapters = await fetchPreviousChapters(project_id, user_id, prompt);
                
                // Store the context information
                const debugInfo = {
                    contextString,
                    previousChapters
                };
                
                console.log('========== CONTEXT BEING FED TO AI ==========');
                console.log('Context String:', contextString);
                console.log('----------------------------------------');
                console.log('Previous Chapters:', previousChapters);
                console.log('==========================================');
                
                console.log('Fetched context data successfully');
            } else {
                console.warn('Supabase client not available, skipping context fetching');
            }
        } catch (contextError) {
            console.error('Error fetching context data:', contextError);
            // Don't fail the entire request, just log the error and proceed with defaults
        }

        const isDeepSeekModel = modelName.includes('deepseek');
        const apiUrl = isDeepSeekModel 
            ? 'https://api.deepseek.com/v1/chat/completions'
            : `https://api-inference.huggingface.co/models/${modelName}`;

        // Convert desired word length to tokens and ensure minimum/maximum bounds
        const desiredWords = Math.min(Math.max(parseInt(length) || 500, 50), 5000);
        const maxTokens = wordsToTokens(desiredWords);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);

        // Create system message based on desired length, tone, and context data
        const systemMessage = `You are a creative writing assistant helping ${userName} write a coherent narrative arc.
Generate a detailed response of approximately ${desiredWords} words${tone ? ` in a ${tone} tone` : ''}.
Ensure the response is well-structured and complete, with proper paragraph breaks and complete sentences.

IMPORTANT INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. You MUST incorporate ALL characters, locations, and events from the project context in your response.
2. When continuing a specific chapter, you MUST start EXACTLY where that chapter left off, maintaining perfect continuity.
3. Your writing MUST follow the user's specific instructions (e.g., "kill protagonist," "end with a cliffhanger") while maintaining narrative consistency.
4. You MUST explicitly use character names, locations, timeline events, and plot points from the context.
5. You MUST resolve any cliffhangers or open questions from the previous chapter unless specifically instructed not to.
6. You MUST maintain consistent character voices, relationships, and plot threads established in previous chapters.
7. Never invent new major plot elements unless clearly asked by the user.
8. Avoid contradicting established facts in previous chapters or project context.
9. When continuing a chapter, use the exact scene, location, time of day, and character positions from where the previous chapter ended.

${contextString ? `PROJECT CONTEXT (USE ALL ELEMENTS BELOW):
${contextString}
` : ''}
${previousChapters ? `${previousChapters}` : ''}
FAILURE TO MAINTAIN PERFECT CONTINUITY WITH THE PREVIOUS CHAPTERS IS NOT ALLOWED.`;

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

        // Return success response with debug info
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                text: generatedText,
                model: modelName,
                userName: userName,
                contextProvided: !!contextString,
                previousChaptersProvided: !!previousChapters,
                usage: usage || null,
                requestedWords: desiredWords,
                actualWords: actualWords,
                actualTokens: usage?.total_tokens || null,
                debug: debugInfo
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