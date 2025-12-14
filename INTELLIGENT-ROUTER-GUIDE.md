# Intelligent AI Router - BEN's Brain

## Overview
BEN now automatically selects the best AI model(s) for each task without manual mode selection. The system analyzes the user's message and intelligently routes to the optimal model, or uses multiple models in collaboration.

## How It Works

### 1. Task Analysis
Every message is analyzed to determine:
- **Task type** (code, creative, reasoning, math, research, etc.)
- **Routing strategy** (single model vs collaboration)
- **Best model(s)** for the job

### 2. Intelligent Routing

**Single Model Tasks:**
- Code generation/debugging → GPT-4 Turbo (best at code)
- Creative writing → Claude Sonnet 4 (best at creative)
- Math/logic → GPT-4 Turbo (strong reasoning)
- Long-form content → Claude 3.5 Sonnet (efficient)
- General queries → Claude Sonnet 4 (best all-around)

**Collaborative Tasks:**
- Complex analysis → Multiple models provide perspectives
- Research/facts → Cross-check for accuracy
- Strategic planning → Different models analyze and critique

### 3. Model Collaboration

When collaboration is beneficial:
1. **Analyzer model** provides initial response
2. **Critic/Verifier model** reviews and improves it
3. **Synthesis** combines the best of both

This ensures higher quality responses for complex tasks.

## Task Type Detection

The router analyzes keywords and patterns:

| Keywords | Task Type | Model Used | Why |
|----------|-----------|------------|-----|
| code, function, debug, API | Code | GPT-4 Turbo | Best code generation |
| write, story, creative, essay | Creative | Claude Sonnet 4 | Superior creative writing |
| calculate, solve, math | Math | GPT-4 Turbo | Strong mathematical reasoning |
| analyze, compare, evaluate | Analysis | Multi-model | Benefits from multiple perspectives |
| what is, research, fact | Research | Multi-model | Cross-check for accuracy |
| detailed, comprehensive | Long-form | Claude 3.5 Sonnet | Efficient for lengthy responses |

## Installation

### Apply the Intelligent Router
```bash
cd /home/ubuntu/signaturebrain-backend
chmod +x INTELLIGENT-ROUTER.sh
./INTELLIGENT-ROUTER.sh

# Restart PM2
pm2 restart all && pm2 flush
```

### Watch It Work
```bash
pm2 logs --lines 100
```

You'll see output like:
```
🧠 BEN analyzing task: "write a python function to..."
📊 Task type: code, Strategy: single
🎯 Routing to openai/gpt-4-turbo
💡 Reason: Best for code generation
```

Or for collaboration:
```
🧠 BEN analyzing task: "analyze the benefits of..."
📊 Task type: reasoning, Strategy: collaborate
🤝 Collaboration mode: 2 models
  → analyzer: anthropic/claude-sonnet-4-20250514
  → critic: openai/gpt-4
🔄 Synthesizing 2 responses...
✅ Collaborative synthesis complete
```

## Benefits

### 1. No Manual Mode Selection
Users don't need to pick modes - BEN automatically chooses the best approach.

### 2. Cost Optimization
- Uses cheaper models (Claude 3.5 Sonnet) for simple/long tasks
- Reserves expensive models (GPT-4, Claude Sonnet 4) for complex tasks

### 3. Quality Improvement
- Collaboration ensures accuracy for research/analysis
- Task-specific routing uses each model's strengths

### 4. Transparent
- Logs show exactly which model(s) handled each request
- Easy to debug and optimize routing logic

## Customization

### Add New Task Types
Edit `/home/ubuntu/signaturebrain-backend/controllers/brainController.js`:

```javascript
function analyzeTask(message) {
  const msg = message.toLowerCase();

  // Add your custom routing logic
  if (msg.match(/your|keywords|here/)) {
    return {
      type: "custom",
      strategy: "single",
      model: {
        api: "openai",
        model: "gpt-4",
        reason: "Best for this task"
      }
    };
  }

  // ... existing logic
}
```

### Adjust Collaboration Rules
Change which tasks use collaboration:

```javascript
// Make more tasks collaborative
if (msg.match(/important|critical|review/)) {
  return {
    type: "important",
    strategy: "collaborate",
    models: [
      { api: "anthropic", model: "claude-sonnet-4-20250514", role: "primary" },
      { api: "openai", model: "gpt-4", role: "reviewer" }
    ],
    reason: "Critical tasks need review"
  };
}
```

### Add More AI Providers
Add handlers for Grok, DeepSeek, Perplexity, etc.:

```javascript
async function callGrok(message, model) {
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
  if (!response.ok) throw new Error(`Grok: ${data.error?.message}`);
  return { reply: data.choices[0].message.content.trim() };
}

// Then add to task routing:
if (msg.match(/realtime|news|current/)) {
  return {
    type: "current",
    strategy: "single",
    model: { api: "grok", model: "grok-beta", reason: "Real-time knowledge" }
  };
}
```

## Frontend Changes (Optional)

Since BEN now routes automatically, you can:

### Option 1: Remove Mode Buttons
The buttons (BEN, CRAFT, PULSE, etc.) are no longer needed. Edit `/var/www/ip-ui-admin/index.html` to remove or hide the mode pills.

### Option 2: Keep Buttons as Presets
Repurpose the buttons to send pre-configured prompts:
- BEN → General assistant
- CRAFT → "Help me write..."
- PULSE → "Analyze..."
- SHIELD → "Check this for security..."
- FLOW → "Plan a workflow for..."

### Option 3: Show Active Model
Update the UI to display which model BEN selected (requires backend to return model info).

## Performance Tips

1. **Cache common queries** - Add caching for frequently asked questions
2. **Parallel collaboration** - Call models in parallel for faster synthesis
3. **Fallback models** - If primary model fails, auto-switch to backup
4. **Usage tracking** - Log which models are used most to optimize costs

## Troubleshooting

### Router always uses default model
- Check that your keywords match the patterns in `analyzeTask()`
- Add debug logging: `console.log("Message:", msg);`
- Verify the regex patterns are matching correctly

### Collaboration too slow
- Reduce to single model for time-sensitive tasks
- Use parallel API calls instead of sequential
- Cache synthesis results for similar questions

### Wrong model selected
- Refine the keyword patterns in `analyzeTask()`
- Add more specific task types
- Use message length or complexity as additional factors

## Examples

**User:** "Write a Python function to reverse a string"
```
🧠 BEN analyzing task: "Write a Python function to..."
📊 Task type: code, Strategy: single
🎯 Routing to openai/gpt-4-turbo
💡 Reason: Best for code generation
```

**User:** "Analyze the pros and cons of renewable energy"
```
🧠 BEN analyzing task: "Analyze the pros and cons..."
📊 Task type: reasoning, Strategy: collaborate
🤝 Collaboration mode: 2 models
  → analyzer: anthropic/claude-sonnet-4-20250514
  → critic: openai/gpt-4
🔄 Synthesizing 2 responses...
✅ Collaborative synthesis complete
```

**User:** "What is quantum computing?"
```
🧠 BEN analyzing task: "What is quantum computing?"
📊 Task type: factual, Strategy: collaborate
🤝 Collaboration mode: 2 models
  → researcher: anthropic/claude-3-5-sonnet-20241022
  → verifier: openai/gpt-4
🔄 Synthesizing 2 responses...
✅ Collaborative synthesis complete
```

## Architecture

```
User Message
     ↓
Task Analysis (analyzeTask)
     ↓
   /---------\
   |         |
Single    Collaborate
Model      Models
   |         |
   |    /----+----\
   |    |         |
   |  Model A   Model B
   |    |         |
   |    \----+----/
   |         |
   |    Synthesis
   |         |
   \----+----/
        |
   Final Response
```

## Future Enhancements

1. **Learning from feedback** - Track which routing decisions get best results
2. **User preferences** - Remember which models user prefers for certain tasks
3. **Dynamic token allocation** - Adjust max_tokens based on task complexity
4. **Multi-stage processing** - Chain multiple models for complex workflows
5. **Confidence scores** - Let models indicate confidence, trigger collaboration if low
6. **A/B testing** - Compare different routing strategies automatically

---

**Result:** BEN is now an intelligent AI orchestrator that automatically selects and combines the best models for each task, without any manual mode selection. 🧠✨
