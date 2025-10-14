# 🤖 AI Features Setup Guide

This guide will help you set up the AI features in this project.

## Prerequisites

- Google Gemini API Key
- Supabase Account
- Node.js 18+

## Environment Variables

Add these to your `.env.local`:

```env
# AI Features
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Setup Steps

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste into `.env.local`

### 2. Setup Supabase Vector Database

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL script in `scripts/supabase-setup.sql`
3. Copy your project URL and anon key to `.env.local`

### 3. Generate Embeddings

```bash
npm run generate-embeddings
```

This will create vector embeddings for all your listings.

## Testing

Test the AI assistant by clicking the floating AI button on the homepage.

Example queries:
- "Find beach houses for families"
- "What's available Jan 1st to 7th"
- "When is the best time to book"

## Troubleshooting

- **No API key**: Make sure `GEMINI_API_KEY` is set in `.env.local`
- **No results**: Run `npm run generate-embeddings` first
- **Errors**: Check Supabase SQL setup

For more details, see [CICD_SETUP.md](./CICD_SETUP.md)

