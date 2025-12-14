#!/bin/bash
# Intelligent AI Router with Model Collaboration
# Automatically selects and combines models based on task

echo "=== Implementing Intelligent AI Router ==="

# Backup current file
echo "Creating backup..."
sudo cp /home/ubuntu/signaturebrain-backend/controllers/brainController.js /home/ubuntu/signaturebrain-backend/controllers/brainController.js.backup-router

# Create intelligent router with collaboration
echo "Creating intelligent AI router..."
sudo tee /home/ubuntu/signaturebrain-backend/controllers/brainController.js > /dev/null <<'EOF'
// Intelligent AI Router with Model Collaboration
// Automatically selects best model(s) for each task

const brainController = async (message, user_id, mode) => {
  console.log(`\n🧠 BEN analyzing task: "${message.substring(0, 50)}..."`);

  // Analyze the task and determine routing strategy
  const taskAnalysis = analyzeTask(message);
  console.log(`📊 Task type: ${taskAnalysis.type}, Strategy: ${taskAnalysis.strategy}`);

  try {
    if (taskAnalysis.strategy === "collaborate") {
      // Use multiple models and synthesize
      return await collaborativeResponse(message, taskAnalysis);
    } else {
      // Route to best single model
      return await routeToModel(message, taskAnalysis);
    }
  } catch (err) {
    console.error("💥 AI Router error:", err);
    return { reply: `Error: ${err.message}` };
  }
};

// Analyze task to determine best routing strategy
function analyzeTask(message) {
  const msg = message.toLowerCase();

  // Code-related tasks → GPT-4 (best for code)
  if (msg.match(/code|function|debug|program|script|api|algorithm|regex/)) {
    return {
      type: "code",
      strategy: "single",
      model: { api: "openai", model: "gpt-4-turbo", reason: "Best for code generation" }
    };
  }

  // Creative writing → Claude (best for creative)
  if (msg.match(/write|story|poem|creative|article|blog|essay/)) {
    return {
      type: "creative",
      strategy: "single",
      model: { api: "anthropic", model: "claude-sonnet-4-20250514", reason: "Best for creative writing" }
    };
  }

  // Complex reasoning/analysis → Collaborate
  if (msg.match(/analyze|compare|evaluate|explain why|what if|strategy|plan/)) {
    return {
      type: "reasoning",
      strategy: "collaborate",
      models: [
        { api: "anthropic", model: "claude-sonnet-4-20250514", role: "analyzer" },
        { api: "openai", model: "gpt-4", role: "critic" }
      ],
      reason: "Benefits from multiple perspectives"
    };
  }

  // Math/logic → GPT-4
  if (msg.match(/calculate|solve|math|equation|formula|proof/)) {
    return {
      type: "math",
      strategy: "single",
      model: { api: "openai", model: "gpt-4-turbo", reason: "Strong at mathematical reasoning" }
    };
  }

  // Research/factual → Collaborate for accuracy
  if (msg.match(/what is|who is|when did|research|fact|history/)) {
    return {
      type: "factual",
      strategy: "collaborate",
      models: [
        { api: "anthropic", model: "claude-3-5-sonnet-20241022", role: "researcher" },
        { api: "openai", model: "gpt-4", role: "verifier" }
      ],
      reason: "Cross-check facts for accuracy"
    };
  }

  // Long-form content → Claude 3.5 (efficient)
  if (message.length > 500 || msg.match(/detailed|comprehensive|in-depth|thorough/)) {
    return {
      type: "detailed",
      strategy: "single",
      model: { api: "anthropic", model: "claude-3-5-sonnet-20241022", reason: "Efficient for long responses" }
    };
  }

  // Default: Claude Sonnet 4 (best all-around)
  return {
    type: "general",
    strategy: "single",
    model: { api: "anthropic", model: "claude-sonnet-4-20250514", reason: "Best general-purpose model" }
  };
}

// Route to single best model
async function routeToModel(message, taskAnalysis) {
  const { model } = taskAnalysis.model;
  const { api } = taskAnalysis.model;

  console.log(`🎯 Routing to ${api}/${model}`);
  console.log(`💡 Reason: ${taskAnalysis.model.reason}`);

  if (api === "anthropic") {
    return await callAnthropic(message, model);
  } else if (api === "openai") {
    return await callOpenAI(message, model);
  }

  return { reply: "Model not available" };
}

// Collaborative response from multiple models
async function collaborativeResponse(message, taskAnalysis) {
  console.log(`🤝 Collaboration mode: ${taskAnalysis.models.length} models`);

  const responses = [];

  // Get response from each model
  for (const modelConfig of taskAnalysis.models) {
    console.log(`  → ${modelConfig.role}: ${modelConfig.api}/${modelConfig.model}`);

    let response;
    if (modelConfig.api === "anthropic") {
      response = await callAnthropic(message, modelConfig.model);
    } else if (modelConfig.api === "openai") {
      response = await callOpenAI(message, modelConfig.model);
    }

    if (response && response.reply) {
      responses.push({
        role: modelConfig.role,
        model: modelConfig.model,
        content: response.reply
      });
    }
  }

  // Synthesize responses
  if (responses.length === 0) {
    return { reply: "No responses received from models" };
  }

  if (responses.length === 1) {
    return { reply: responses[0].content };
  }

  // Have the second model refine/critique the first
  console.log(`🔄 Synthesizing ${responses.length} responses...`);

  const synthesisPrompt = `I asked another AI: "${message}"

Their response was:
${responses[0].content}

Please review this response and provide:
1. If it's accurate and complete, confirm and add any missing insights
2. If there are issues, provide a corrected/improved version
3. Synthesize the best possible answer

Be concise and focus on accuracy.`;

  const finalResponse = await callAnthropic(synthesisPrompt, "claude-sonnet-4-20250514");

  console.log(`✅ Collaborative synthesis complete`);
  return finalResponse;
}

// Anthropic API handler
async function callAnthropic(message, model) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,
      messages: [{ role: "user", content: message }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Anthropic Error (${response.status}):`, data.error?.message);
    throw new Error(`Anthropic: ${data.error?.message || 'API error'}`);
  }

  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error("No text in Anthropic response");
  }

  return { reply: text.trim() };
}

// OpenAI API handler
async function callOpenAI(message, model) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }],
      max_tokens: 2048
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ OpenAI Error (${response.status}):`, data.error?.message);
    throw new Error(`OpenAI: ${data.error?.message || 'API error'}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No text in OpenAI response");
  }

  return { reply: text.trim() };
}

module.exports = brainController;
EOF

echo ""
echo "✅ Intelligent AI Router implemented!"
echo ""
echo "How it works:"
echo "  - Analyzes each message to determine task type"
echo "  - Automatically routes to best model for that task"
echo "  - Uses collaboration when beneficial (analysis, facts, etc.)"
echo "  - No manual mode selection needed"
echo ""
echo "Task Routing:"
echo "  📝 Code tasks        → OpenAI GPT-4 Turbo"
echo "  ✍️  Creative writing  → Claude Sonnet 4"
echo "  🧮 Math/Logic        → OpenAI GPT-4 Turbo"
echo "  🔬 Analysis          → Multi-model collaboration"
echo "  📚 Research/Facts    → Multi-model cross-check"
echo "  📄 Long-form         → Claude 3.5 Sonnet"
echo "  💬 General           → Claude Sonnet 4"
echo ""
echo "Restart PM2 to apply:"
echo "  pm2 restart all && pm2 flush"
EOF

chmod +x /home/ubuntu/signaturebrain-backend/INTELLIGENT-ROUTER.sh
echo "Script saved and ready to run!"
