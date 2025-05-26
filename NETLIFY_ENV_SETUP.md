# Netlify Environment Variables Setup

## Current Issue
Your Netlify environment variables are using the old naming convention, but the Next.js app expects the `NEXT_PUBLIC_` prefix for client-side access.

## Required Changes in Netlify Dashboard

Go to your Netlify site dashboard → Site settings → Environment variables

### Update these environment variables:

1. **Change `SUPABASE_URL` to `NEXT_PUBLIC_SUPABASE_URL`**
   - Delete the old `SUPABASE_URL` variable
   - Create new `NEXT_PUBLIC_SUPABASE_URL` with the same value

2. **Change `SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Delete the old `SUPABASE_ANON_KEY` variable  
   - Create new `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same value

3. **Keep these as they are:**
   - `DEEPSEEK_API_KEY` (for server-side functions)
   - `HF_API_KEY` (for server-side functions)
   - `OPENROUTER_API_KEY` (for server-side functions)

## Why This Change is Needed

Next.js requires environment variables that are accessed in client-side code (browser) to have the `NEXT_PUBLIC_` prefix. This is a security feature to prevent accidentally exposing server-side secrets to the browser.

Since Supabase needs to be accessed from the browser for authentication and database operations, these variables need the `NEXT_PUBLIC_` prefix.

## After Making These Changes

1. Trigger a new deployment (push a commit or manually redeploy)
2. The authentication should work properly
3. The "Failed to fetch" error should be resolved 