// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config'); // Make sure this file exists and has DEFAULT_MODEL
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client with error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  console.log('Testing Supabase connection...');
  supabase.from('projects').select('id', { count: 'exact', head: true }).limit(1) // More efficient test
    .then(({ error, count }) => {
      if (error) throw error;
      console.log('Supabase connection successful. Projects table accessible, count:', count);
    })
    .catch(error => {
      console.error('Supabase connection test failed:', error);
      throw error; // Re-throw to be caught by outer try-catch
    });
} catch (error) {
  console.error('Error initializing Supabase client:', error.message);
  supabase = null; // Ensure supabase is null if initialization fails
}

// Helper function to check Supabase connection
const ensureSupabaseConnection = async () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables and initialization logs.');
  }
  try {
    const { error } = await supabase.from('projects').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection test failed during ensureSupabaseConnection:', error);
    throw new Error('Failed to connect to Supabase. Please check your configuration and RLS policies.');
  }
};

// Helper function to truncate text
const truncateText = (text, maxLength = 1000) => {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
};

// Helper function to summarize text
const summarizeText = (text, maxLength = 500) => {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
};

// Helper function to fetch project context from Supabase
const fetchProjectContext = async (projectId) => {
  try {
    await ensureSupabaseConnection();
    console.log(`Fetching context for project_id: ${projectId}`);

    // Fetch project with all related data in one go.
    // This requires foreign key relationships to be correctly set up in Supabase.
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        locations (
          id, name, type, description, key_features,
          timeline_events (id, name, date_time)
        ),
        characters (
          id, name, role, traits, backstory,
          timeline_event_characters!inner (
            timeline_events!inner (id, name, date_time)
          )
        ),
        timeline_events (
          id, name, description, date_time, location_id,
          locations (id, name),
          timeline_event_characters!inner (
            characters!inner (id, name, role)
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error(`Error fetching comprehensive project context for project ${projectId}:`, projectError);
      return `Project Context:\n\nError fetching project context: ${projectError.message}. Please check if project ID exists and RLS policies allow access.`;
    }

    if (!projectData) {
        console.warn('No project data found for project_id:', projectId);
        return 'Project Context:\n\nNo project data found (project might not exist or no related items are accessible).';
    }

    const { locations, characters, timeline_events: events } = projectData;

    console.log('Locations fetched:', locations?.length || 0);
    console.log('Characters fetched:', characters?.length || 0);
    console.log('Events fetched:', events?.length || 0);

    let contextString = 'Project Context:\n\n';

    contextString += 'Characters:\n';
    if (characters && characters.length > 0) {
      characters.forEach(char => {
        contextString += `Character: ${char.name}\n`;
        contextString += `  Role: ${char.role || 'Unspecified'}\n`;
        if (char.traits) contextString += `  Traits: ${truncateText(char.traits, 150)}\n`;
        if (char.backstory) contextString += `  Backstory: ${truncateText(char.backstory, 250)}\n`;
        
        const charEvents = char.timeline_event_characters?.map(tec => tec.timeline_events).filter(Boolean);
        if (charEvents?.length > 0) {
          contextString += `  Appears in events: ${charEvents.map(event => `${event.name} (${event.date_time || 'unknown time'})`).join(', ')}\n`;
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No characters found for this project.\n\n';
    }

    contextString += 'Locations:\n';
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        contextString += `Location: ${loc.name}\n`;
        contextString += `  Type: ${loc.type || 'Unspecified'}\n`;
        if (loc.description) contextString += `  Description: ${truncateText(loc.description, 150)}\n`;
        if (loc.key_features) contextString += `  Key Features: ${truncateText(loc.key_features, 150)}\n`;
        
        if (loc.timeline_events?.length > 0) {
          contextString += `  Events at this location: ${loc.timeline_events.map(event => `${event.name} (${event.date_time || 'unknown time'})`).join(', ')}\n`;
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No locations found for this project.\n\n';
    }

    contextString += 'Timeline Events (chronological if dated):\n';
    if (events && events.length > 0) {
      const sortedEvents = [...events].sort((a, b) => {
        if (a.date_time && b.date_time) return new Date(a.date_time) - new Date(b.date_time);
        if (a.date_time) return -1;
        if (b.date_time) return 1;
        return (a.name || '').localeCompare(b.name || ''); // Fallback sort by name
      });
      
      sortedEvents.forEach(event => {
        contextString += `Event: ${event.name || 'Unnamed Event'}\n`;
        if (event.date_time) contextString += `  Time: ${event.date_time}\n`;
        if (event.description) contextString += `  Description: ${truncateText(event.description, 150)}\n`;
        if (event.locations) contextString += `  Location: ${event.locations.name}\n`;
        
        const involvedCharacters = event.timeline_event_characters
          ?.map(tec => tec.characters?.name)
          .filter(Boolean);
        
        if (involvedCharacters?.length > 0) {
          contextString += `  Characters involved: ${involvedCharacters.join(', ')}\n`;
        }
        contextString += '\n';
      });
    } else {
      contextString += 'No timeline events found for this project.\n';
    }
    
    return contextString;
  } catch (error) {
    console.error('Error in fetchProjectContext:', error);
    return `Project Context:\n\nError fetching project context: ${error.message}. Check server logs for details.`;
  }
};

// Helper function to fetch previous chapters
const fetchPreviousChapters = async (projectId, prompt = '') => {
  try {
    await ensureSupabaseConnection();
    console.log(`Fetching previous chapters for project_id: ${projectId}`);
    
    const chapterMatch = prompt.match(/chapter\s+(\d+)/i);
    const targetChapterNum = chapterMatch ? parseInt(chapterMatch[1]) : null;
    
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, title, content, order_index, chapter_number') // Select specific columns
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    
    if (chaptersError) {
      console.error('Chapters query error:', chaptersError);
      return 'Error fetching chapters: ' + chaptersError.message;
    }
    
    if (!chapters || chapters.length === 0) {
      console.log('No previous chapters found for this project.');
      return 'No previous chapters found.';
    }

    console.log(`Found ${chapters.length} chapters. Target chapter from prompt: ${targetChapterNum}`);
    let chaptersText = 'PREVIOUS CHAPTERS:\n\n';
    
    if (targetChapterNum) {
      const targetIndex = chapters.findIndex(ch => (ch.chapter_number === targetChapterNum) || (ch.order_index === targetChapterNum -1)); // order_index is 0-based
      
      if (targetIndex !== -1) {
        const targetChapterData = chapters[targetIndex];
        const actualChNum = targetChapterData.chapter_number || targetChapterData.order_index + 1;
        chaptersText += `CURRENT CHAPTER TO CONTINUE FROM (Chapter ${actualChNum}):\n`;
        chaptersText += `Title: ${targetChapterData.title || 'Untitled'}\n`;
        chaptersText += `${targetChapterData.content}\n\n`;
        
        if (targetIndex > 0) {
          const previousChapter = chapters[targetIndex - 1];
          const prevChNum = previousChapter.chapter_number || previousChapter.order_index + 1;
          chaptersText += `PREVIOUS CHAPTER (Chapter ${prevChNum}):\n`;
          chaptersText += `Title: ${previousChapter.title || 'Untitled'}\n`;
          chaptersText += `${summarizeText(previousChapter.content, 300)}\n\n`;
        }
        if (targetIndex > 1) {
          chaptersText += 'EARLIER CHAPTERS SUMMARY:\n';
          chapters.slice(0, targetIndex - 1).forEach(chapter => {
            const chNum = chapter.chapter_number || chapter.order_index + 1;
            chaptersText += `Chapter ${chNum}: ${chapter.title || 'Untitled'} - ${summarizeText(chapter.content, 150)}\n`;
          });
          chaptersText += '\n';
        }
      } else {
        chaptersText += `Warning: Chapter ${targetChapterNum} not found. Listing all available chapters:\n`;
        chapters.forEach(ch => {
            const chNum = ch.chapter_number || ch.order_index + 1;
            chaptersText += `Chapter ${chNum}: ${ch.title || 'Untitled'} - ${summarizeText(ch.content, 200)}\n`;
        });
      }
    } else {
      chapters.forEach((chapter, index) => {
        const chNum = chapter.chapter_number || chapter.order_index + 1;
        chaptersText += `Chapter ${chNum}: ${chapter.title || 'Untitled'}\n`;
        if (index === chapters.length - 1) { // Full content for the most recent
          chaptersText += `${chapter.content}\n\n`;
        } else {
          chaptersText += `${summarizeText(chapter.content, 300)}\n\n`;
        }
      });
    }
    return chaptersText;
  } catch (error) {
    console.error('Error fetching previous chapters:', error);
    return 'Error fetching previous chapters: ' + error.message;
  }
};

// Helper function to validate API keys
const validateApiKeys = (modelName) => {
    const isDeepSeekModel = modelName.includes('deepseek');
    if (isDeepSeekModel && (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === '')) {
        throw new Error('DEEPSEEK_API_KEY is not configured.');
    }
    if (!isDeepSeekModel && (!process.env.HF_API_KEY || process.env.HF_API_KEY === '')) {
        throw new Error('HF_API_KEY is not configured.');
    }
};

// Helper function to convert words to tokens (approximate)
const wordsToTokens = (wordCount) => Math.ceil(wordCount * 1.3 * 1.2);

// Helper function to ensure text ends with a complete sentence
const ensureCompleteSentence = (text) => {
    if (!text || text.trim() === '') return text;
    text = text.trim();
    const endings = ['.', '!', '?', '"', '\n']; // Simpler check for common endings
    if (endings.some(ending => text.endsWith(ending))) {
        return text;
    }
    // Find last punctuation if not ending with one already
    const lastPunc = Math.max(text.lastIndexOf('. '), text.lastIndexOf('! '), text.lastIndexOf('? '));
    if (lastPunc > -1 && lastPunc > text.length - 200) { // Only if punctuation is reasonably close to end
        return text.substring(0, lastPunc + 1).trim();
    }
    return text; // Return as is if no clear sentence ending found or if it's too far back
};

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || 'Request timed out')), ms)
);

// Helper function to calculate dynamic timeout
const calculateTimeout = (maxTokens, mode, isDeepSeekModel) => {
    const base = mode === 'chat' ? 15000 : 25000;
    const perTokenMs = mode === 'chat' ? 40 : 80;
    const min = mode === 'chat' ? 10000 : 15000;
    const max = 110000;

    let timeout = base + (maxTokens * perTokenMs);
    if (!isDeepSeekModel) { // HF can be slower
        timeout = mode === 'chat' ? 35000 : 60000;
    }
    return Math.min(max, Math.max(min, timeout));
};

// Helper function to fetch with timeout
const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
    }
};

// System message creation logic
const createSystemMessage = (mode, userName, desiredWords, tone, contextString, previousChapters, prompt) => {
    let baseIntro = `You are an AI writing assistant collaborating with ${userName} on a creative writing project.`;

    if (mode === 'chat') {
        return `${baseIntro}
You are currently in BRAINSTORMING & PLANNING MODE.

Your Role: Act as an insightful brainstorming partner and world-building assistant. Your primary goal is to help ${userName} explore ideas, develop characters, outline plots, refine their creative vision, and flesh out their story world. Focus on asking clarifying questions and offering targeted suggestions rather than generating full narrative prose.

Interaction Style:
- Engage in a CONVERSATIONAL manner.
- Ask PROBING QUESTIONS that encourage deeper thought (e.g., "What might be ${userName}'s motivation for that?", "How does this event impact the overall theme?").
- Provide CONCISE, ACTIONABLE suggestions, ideas, or alternative perspectives in bullet points or short descriptions.
- Help ORGANIZE thoughts or identify potential inconsistencies or unexplored areas.
- REFER to elements from the "BACKGROUND LORE" (Project Context & Previous Chapters) to ground your suggestions and ensure consistency. For example: "Given that Location Y is described as 'ancient and foreboding', how might that influence the mood of this scene?"
- Keep responses relatively brief and focused, generally under ${Math.min(desiredWords, 250)} words.
- If asked directly about the context, answer based on the provided information.

What to AVOID:
- Writing long narrative passages or full scenes.
- Making decisions FOR the user; instead, present options.
- Asking generic, unhelpful questions.

${contextString ? `BACKGROUND LORE (Reference for consistency):\nProject Context:\n${contextString}` : ''}
${previousChapters ? `Previous Chapters Summary:\n${previousChapters}` : ''}
Current focus of discussion based on user's input: "${prompt}"
`;
    } else { // 'generate' mode
        return `${baseIntro}
You are currently in WRITING MODE.

Your Task: Write an engaging and creative continuation of the story, approximately ${desiredWords} words long${tone ? `, in a ${tone} tone` : ''}. The narrative must flow naturally, advance the plot, develop characters, and maintain deep consistency with the established world.

Core Principles for Your Writing:
1. NARRATIVE PROGRESSION & CREATIVITY: Advance the story meaningfully. Show, Don't Just Tell. Develop characters through actions and reactions. Creatively build upon established facts with plausible minor details. Avoid stagnation.
2. INTEGRATING PROVIDED INFORMATION: The "BACKGROUND LORE" and "PREVIOUS CHAPTERS" are your continuity anchor, not a rigid script. Use this information implicitly for consistency in character traits, backstories, settings, and past events. Explicitly mention context elements ONLY when natural and serving the narrative.
3. SEAMLESS CONTINUITY: If continuing a chapter, pick up precisely where it left off (scene, time, character dispositions). Maintain consistent character voices and motivations. Address immediate cliffhangers unless directed otherwise.
4. EXECUTING THE USER'S PROMPT: Carefully fulfill the user's specific instructions, weaving them into a coherent narrative that respects all other guidelines.
5. WRITING QUALITY: Produce well-structured prose with clear paragraphs, complete sentences, and vivid language.

What to AVOID:
- Mechanical listing of context facts or forced mentions.
- Contradicting established lore, character arcs, or plot points.
- Introducing major, unprompted plot twists, characters, or locations that overshadow existing elements. Minor, plausible additions are acceptable if they enhance the scene.

${contextString ? `BACKGROUND LORE (Guide for consistency and inspiration):\nProject Context:\n${contextString}` : ''}
${previousChapters ? `PREVIOUS CHAPTERS (Ensure your writing flows logically from here):\n${previousChapters}` : ''}
User's specific writing instruction: "${prompt}"
Begin your creative continuation now:
`;
    }
};

// Netlify Function Handler
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Use POST.', success: false }) };
    }

    if (!supabase) { // Check if Supabase failed to initialize earlier
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase client failed to initialize. Check server logs.', success: false }) };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body.', success: false }) };
        }
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON in request body.', success: false }) };
        }

        const { 
            prompt = '', 
            mode = 'generate', 
            tone = '', 
            length = (mode === 'chat' ? '200' : '500'), // Default length based on mode
            user_id = '', // Ensure these are actually used for auth/RLS if needed
            project_id = ''
        } = parsedBody;

        if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required.', success: false }) };
        if (!project_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'project_id is required.', success: false }) };
        // user_id might not be strictly required for anon key access if RLS is public for project_id

        const modelName = event.queryStringParameters?.model || config.DEFAULT_MODEL || 'deepseek-chat'; // Fallback default model
        validateApiKeys(modelName);

        let userName = 'User'; // Default
        // User fetching logic (optional, can be expanded if user-specific data is needed beyond anon access)
        // For now, this example assumes anon access to project data via project_id and RLS
        // If you used supabase.auth.getUser(), you'd need to handle JWTs from the client.
        // The current anon key setup means RLS on Supabase tables determines visibility.

        console.log(`Processing request for project: ${project_id}, mode: ${mode}, model: ${modelName}`);
        
        const contextString = await fetchProjectContext(project_id);
        const previousChapters = await fetchPreviousChapters(project_id, prompt);

        console.log('Context String Length:', contextString.length);
        console.log('Previous Chapters Length:', previousChapters.length);

        const isDeepSeekModel = modelName.includes('deepseek');
        const apiUrl = isDeepSeekModel 
            ? 'https://api.deepseek.com/v1/chat/completions'
            : `https://api-inference.huggingface.co/models/${modelName}`;

        const maxWords = mode === 'chat' ? 300 : 5000;
        const minWords = mode === 'chat' ? 30 : 100;
        const desiredWords = Math.min(Math.max(parseInt(length) || (mode === 'chat' ? 150 : 500), minWords), maxWords);
        const maxTokens = wordsToTokens(desiredWords);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);

        const systemMessage = createSystemMessage(mode, userName, desiredWords, tone, contextString, previousChapters, prompt);

        const temp = mode === 'chat' ? 0.8 : 0.75;
        const presPenalty = mode === 'chat' ? 0.6 : 0.4;
        const freqPenalty = mode === 'chat' ? 0.5 : 0.4;
        const topP = mode === 'chat' ? 0.9 : 0.95;
        const stopSequences = ["###", "\n\n\nUSER:", "\n\n\nASSISTANT:", "<|endoftext|>"];

        const requestBody = isDeepSeekModel ? {
            model: modelName,
            messages: [{ role: "system", content: systemMessage }, { role: "user", content: prompt }],
            temperature: temp, top_p: topP, max_tokens: maxTokens, stream: false,
            presence_penalty: presPenalty, frequency_penalty: freqPenalty, stop: stopSequences.slice(0,1) // DeepSeek might only support one stop
        } : {
            inputs: systemMessage, // System message already contains prompt contextually
            parameters: {
                temperature: temp, top_p: topP, max_new_tokens: maxTokens, do_sample: true,
                num_return_sequences: 1, repetition_penalty: mode === 'chat' ? 1.3 : 1.15,
                early_stopping: true, stop: stopSequences
            }
        };
        
        console.log(`Requesting ${desiredWords} words (~${maxTokens} tokens) from ${modelName}. Timeout: ${timeout}ms.`);

        const response = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${isDeepSeekModel ? process.env.DEEPSEEK_API_KEY : process.env.HF_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        }, timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}) from ${modelName}:`, errorText);
            return { statusCode: response.status, headers, body: JSON.stringify({ error: `API request failed: ${response.statusText}`, details: errorText, success: false }) };
        }

        const result = await response.json();
        let generatedText = '';
        let usage = null;

        if (isDeepSeekModel && result.choices?.[0]?.message?.content) {
            generatedText = result.choices[0].message.content;
            usage = result.usage;
        } else if (Array.isArray(result) && result[0]?.generated_text) {
            generatedText = result[0].generated_text.replace(systemMessage, "").trim(); // Attempt to remove prompt from HF model if it includes it
        } else if (result.generated_text) {
             generatedText = result.generated_text.replace(systemMessage, "").trim(); // Attempt to remove prompt
        } else {
            console.error("Invalid response format from API:", result);
            throw new Error('Invalid response format from API or no text generated.');
        }

        if (!generatedText && mode === 'generate') { // Only critical if generate mode expects text
             console.warn("No text was generated by the API, result:", result);
             // Potentially return an error or a message indicating no text. For now, let it pass to ensureCompleteSentence.
        }
        
        generatedText = ensureCompleteSentence(generatedText);
        const actualWords = generatedText.trim().split(/\s+/).filter(Boolean).length;

        const debugInfo = {
            modelName, mode, requestedWords: desiredWords, actualWords, 
            tokensUsed: usage?.total_tokens || null,
            contextStringLength: contextString.length,
            previousChaptersLength: previousChapters.length,
            systemMessageLength: systemMessage.length,
            // Be cautious about logging full context/chapters if they are very large or sensitive
            // contextSample: truncateText(contextString, 200), 
            // chaptersSample: truncateText(previousChapters, 200)
        };

        return {
            statusCode: 200, headers,
            body: JSON.stringify({
                success: true, text: generatedText, model: modelName, mode,
                usage: usage || { note: "Usage data not available for this model." },
                requestedWords: desiredWords, actualWords,
                debug: debugInfo
            })
        };

    } catch (error) {
        console.error('Error in generate-text handler:', error);
        const statusCode = error.message.includes('timed out') ? 408 
            : error.message.includes('API key') || error.message.includes('configured') ? 401
            : error.message.includes('Supabase') ? 503 // Service unavailable for DB issues
            : 500;
        return {
            statusCode, headers,
            body: JSON.stringify({ error: error.message, success: false, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined })
        };
    }
};


Key Changes and Consolidations in this Final Version:

Supabase Initialization:

More robust error handling during initialization.

ensureSupabaseConnection simplified and errors made more specific.

Initial connection test made more efficient (head: true).

fetchProjectContext:

Switched to a single comprehensive query from the projects table, selecting related locations, characters, and timeline_events with their own nested relations. This is more efficient if your relationships are set up correctly. This is a significant change and requires your Supabase schema to have these relationships defined. If not, you'll need to revert to fetching each table (locations, characters, timeline_events) separately with eq('project_id', projectId) and then using nested selects within those queries as previously discussed.

Improved error messages and handling if projectData is not found.

Slightly shorter truncation for context elements to save token space.

Simplified joining of related items in the context string (e.g., join(', ')).

fetchPreviousChapters:

More specific column selection.

Slightly improved logic for finding targetChapterNum considering order_index (0-based) vs chapter_number (1-based).

More concise summaries.

ensureCompleteSentence:

Simplified the logic slightly. It will try to trim to the last punctuation if found reasonably close to the end, otherwise returns the trimmed text. This is a heuristic and might not be perfect for all cases.

calculateTimeout:

Adjusted base values and per-token multipliers for potentially better responsiveness.

createSystemMessage:

The refined versions for both chat and generate modes are included.

Summaries of context/chapters are now explicitly labeled in the prompt.

Main Handler (exports.handler):

Default Model: Added || 'deepseek-chat' as a fallback if config.DEFAULT_MODEL is not set.

Length Parameter: Default length now depends on the mode.

Error Handling:

Checked for !supabase client initialization failure early.

More specific status codes for different error types.

Conditional stack trace in debug output based on NODE_ENV.

API Request Parameters:

Slightly tuned temperature, presencePenalty, frequencyPenalty, topP. These are good starting points but might need further model-specific tuning.

Added more stopSequences. DeepSeek might only use the first one in an array.

Hugging Face Response Processing: Added .replace(systemMessage, "").trim() to try and remove the prompt if the HF model echoes it in the generated_text. This is a common workaround.

Debug Info: Made debugInfo more concise, with commented-out options for logging context samples to avoid overly large log entries.

CORS: Ensured Access-Control-Allow-Methods includes POST, OPTIONS.

Before Deploying:

Supabase Schema for fetchProjectContext:

Crucially, verify your Supabase table relationships. The updated fetchProjectContext relies heavily on foreign keys:

projects table is the parent.

locations.project_id -> projects.id

characters.project_id -> projects.id

timeline_events.project_id -> projects.id

timeline_events.location_id -> locations.id (nullable)

timeline_event_characters (join table) with event_id -> timeline_events.id AND character_id -> characters.id.

If your projects table doesn't act as the central point for these relations, you'll need to adjust fetchProjectContext to query locations, characters, timeline_events individually using .eq('project_id', projectId) and then perform the nested selects within each of those main queries.

Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY, DEEPSEEK_API_KEY, HF_API_KEY.

config.js: Ensure it exists and exports DEFAULT_MODEL or rely on the fallback in the code.

RLS Policies: Your Supabase Row Level Security policies must allow the anon role to read the necessary data from projects, locations, characters, timeline_events, and chapters tables based on the project_id. The queries now use !inner in some places, which means if a related item isn't found (or RLS blocks it), the parent item might also be excluded. Test thoroughly.

Test Thoroughly: Test both chat and generate modes with various prompts and project data. Pay attention to logs for errors and the quality of AI responses.

This consolidated version should provide a strong foundation. Remember that LLM prompting and parameter tuning is an iterative process!
