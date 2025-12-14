# Multi-Model Support Implementation Guide

## Overview
The Signature Brain system now supports multiple AI models across different modes:
- **BEN mode** → Anthropic Claude Sonnet 4
- **CRAFT mode** → OpenAI GPT-4
- **PULSE mode** → Anthropic Claude 3.5 Sonnet
- **SHIELD mode** → OpenAI GPT-4 Turbo
- **FLOW mode** → Anthropic Claude Sonnet 4

## What Was Fixed

### Issue 1: Export Error ✅
**Problem:** `TypeError: brainController is not a function`

**Root Cause:** The module export was using object syntax:
```javascript
module.exports = { brainController };  // WRONG
```

**Fix:** Changed to direct function export:
```javascript
module.exports = brainController;  // CORRECT
```

### Issue 2: Single Model Limitation ✅
**Problem:** Backend only supported Claude, ignoring the `mode` parameter from frontend

**Solution:** Implemented intelligent model routing based on mode:
```javascript
const modelConfig = {
  ben: { api: "anthropic", model: "claude-sonnet-4-20250514" },
  craft: { api: "openai", model: "gpt-4" },
  pulse: { api: "anthropic", model: "claude-3-5-sonnet-20241022" },
  shield: { api: "openai", model: "gpt-4-turbo" },
  flow: { api: "anthropic", model: "claude-sonnet-4-20250514" }
};
```

## How to Apply

### Step 1: Run the Fix Script
```bash
cd /home/ubuntu/signaturebrain-backend
chmod +x MULTI-MODEL-FIX.sh
./MULTI-MODEL-FIX.sh
```

### Step 2: Add OpenAI API Key
```bash
# Edit .env file
sudo nano /home/ubuntu/signaturebrain-backend/.env

# Add this line (replace with your actual key):
OPENAI_API_KEY=sk-...your-key-here...
```

### Step 3: Restart PM2
```bash
pm2 restart all && pm2 flush
```

### Step 4: Test Each Mode
Open the UI and click each mode pill (BEN, CRAFT, PULSE, SHIELD, FLOW), then send a test message. Watch the PM2 logs to see which model is being used:

```bash
pm2 logs --lines 100
```

You should see:
- `🚀 brainController called - mode: ben, message: test`
- `🔵 Calling Anthropic with claude-sonnet-4-20250514...` (for BEN/PULSE/FLOW)
- `🟢 Calling OpenAI with gpt-4...` (for CRAFT/SHIELD)
- `✅ Anthropic response received` or `✅ OpenAI response received`

## Customizing Model Routing

Edit `/home/ubuntu/signaturebrain-backend/controllers/brainController.js` and modify the `modelConfig` object:

```javascript
const modelConfig = {
  ben: { api: "anthropic", model: "claude-sonnet-4-20250514" },
  craft: { api: "openai", model: "gpt-4" },
  pulse: { api: "anthropic", model: "claude-3-5-sonnet-20241022" },
  shield: { api: "openai", model: "gpt-4-turbo" },
  flow: { api: "anthropic", model: "claude-sonnet-4-20250514" }
};
```

### Available Models

**Anthropic:**
- `claude-sonnet-4-20250514`
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

**OpenAI:**
- `gpt-4`
- `gpt-4-turbo`
- `gpt-4o`
- `gpt-3.5-turbo`

## Adding More AI Providers

To add Grok, DeepSeek, Perplexity, etc., add new handler functions in `brainController.js`:

```javascript
// Example: Add Grok support
async function callGrok(message, model) {
  console.log(`🟣 Calling Grok with ${model}...`);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return { reply: `Grok Error: ${data.error?.message}` };
  }

  return { reply: data.choices[0].message.content.trim() };
}

// Then add to modelConfig:
const modelConfig = {
  ben: { api: "grok", model: "grok-beta" },
  // ...
};

// And add to the router:
if (config.api === "grok") {
  return await callGrok(message, config.model);
}
```

## Troubleshooting

### "No response from AI"
- Check API keys in `.env`
- Check PM2 logs for specific error messages
- Verify API key has credits/quota

### "brainController is not a function"
- Make sure the export is NOT using curly braces
- Should be: `module.exports = brainController;`
- NOT: `module.exports = { brainController };`

### Mode not routing to correct model
- Check PM2 logs for the mode being received
- Verify the mode name matches exactly (case-sensitive)
- Default is "ben" if mode is undefined

## Files Modified

1. `/home/ubuntu/signaturebrain-backend/controllers/brainController.js`
   - Added multi-model routing logic
   - Added OpenAI API support
   - Added debug logging

2. `/home/ubuntu/signaturebrain-backend/app.js`
   - Updated to pass `mode` parameter to brainController

3. `/home/ubuntu/signaturebrain-backend/.env`
   - Added `OPENAI_API_KEY` (you need to add this manually)

## Environment Variables Required

```bash
# .env file should have:
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Success Indicators

When working correctly, you'll see in PM2 logs:
```
🚀 brainController called - mode: craft, message: hello
🟢 Calling OpenAI with gpt-4...
📊 OpenAI status: 200
✅ OpenAI response received
```

And in the browser, you'll get responses from different AI models depending on which mode pill you clicked!
