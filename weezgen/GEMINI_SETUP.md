# Gemini AI Migration Guide

## Overview

Your codebase has been successfully migrated from OpenAI to Gemini AI. The OpenAI code has been commented out and preserved, while new Gemini AI implementation has been added.

## Required Setup

### 1. Environment Variable

Add the following environment variable to your `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your environment file

### 3. Dependencies

The required dependency is already installed:

- `@google/generative-ai: ^0.24.1`

## Changes Made

### Files Modified

- `weezgen/actions/bot/index.ts` - Main chatbot logic migrated from OpenAI to Gemini AI

### OpenAI Code Status

- All OpenAI imports and API calls have been commented out (not deleted)
- Original functionality preserved in comments
- Can be easily restored if needed

### Gemini AI Implementation

- Uses `gemini-pro` model
- Maintains same conversation flow and prompt structure
- Compatible with existing chatbot features

## Testing

After setting up the API key, test the chatbot functionality to ensure everything works correctly.

## Rollback

If you need to rollback to OpenAI:

1. Uncomment OpenAI imports and API calls
2. Comment out Gemini AI code
3. Restore `OPEN_AI_KEY` environment variable
