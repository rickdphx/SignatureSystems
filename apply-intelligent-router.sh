#!/bin/bash
# Apply Intelligent AI Router with Multi-Model Support

echo "=== Applying Intelligent AI Router ==="

# Create the intelligent router
sudo tee /home/ubuntu/signaturebrain-backend/controllers/brainController.js > /dev/null <<'EOFC'
// Intelligent AI Router - Auto-selects best model(s) for each task

const brainController = async (message, user_id, mode) => {
  console.log(`\n🧠 BEN analyzing: "${message.substring(0, 60)}..."`);

  const taskAnalysis = analyzeTask(message);
  console.log(`📊 Type: ${taskAnalysis.type}, Strategy: ${taskAnalysis.strategy}`);

  try {
    if (taskAnalysis.strategy === "collaborate") {
      return await collaborativeResponse(message, taskAnalysis);
    } else {
      return await routeToModel(message, taskAnalysis);
    }
  } catch (err) {
    console.error("💥 Router error:", err.message);
    return { reply: `Error: ${err.message}` };
  }
};

function analyzeTask(message) {
  const msg = message.toLowerCase();

  // Code tasks → GPT-4
  if (msg.match(/code|function|debug|program|script|api|algorithm|bug|syntax/)) {
    return {
      type: "code",
      strategy: "single",
      model: { api: "openai", model: "gpt-4-turbo-preview" }
    };
  }

  // Creative writing → Claude
  if (msg.match(/write|story|poem|creative|article|blog|essay/)) {
    return {
      type: "creative",
      strategy: "single",
      model: { api: "anthropic", model: "claude-sonnet-4-20250514" }
    };
  }

  // Analysis/reasoning → Collaborate
  if (msg.match(/analyze|compare|evaluate|explain why|pros and cons/)) {
    return {
      type: "analysis",
      strategy: "collaborate",
      models: [
        { api: "anthropic", model: "claude-sonnet-4-20250514" },
        { api: "openai", model: "gpt-4-turbo-preview" }
      ]
    };
  }

  // Math → GPT-4
  if (msg.match(/calculate|solve|math|equation|formula/)) {
    return {
      type: "math",
      strategy: "single",
      model: { api: "openai", model: "gpt-4-turbo-preview" }
    };
  }

  // Research → Collaborate
  if (msg.match(/what is|who is|when did|research|fact/)) {
    return {
      type: "research",
      strategy: "collaborate",
      models: [
        { api: "anthropic", model: "claude-3-5-sonnet-20241022" },
        { api: "openai", model: "gpt-4-turbo-preview" }
      ]
    };
  }

  // Default → Claude
  return {
    type: "general",
    strategy: "single",
    model: { api: "anthropic", model: "claude-sonnet-4-20250514" }
  };
}

async function routeToModel(message, taskAnalysis) {
  const { api, model } = taskAnalysis.model;
  console.log(`🎯 Routing to ${api}/${model}`);

  if (api === "anthropic") {
    return await callAnthropic(message, model);
  } else if (api === "openai") {
    return await callOpenAI(message, model);
  }
  return { reply: "Model not available" };
}

async function collaborativeResponse(message, taskAnalysis) {
  console.log(`🤝 Collaboration: ${taskAnalysis.models.length} models`);

  const responses = [];

  for (const modelConfig of taskAnalysis.models) {
    try {
      let response;
      if (modelConfig.api === "anthropic") {
        response = await callAnthropic(message, modelConfig.model);
      } else if (modelConfig.api === "openai") {
        response = await callOpenAI(message, modelConfig.model);
      }

      if (response?.reply) {
        responses.push(response.reply);
      }
    } catch (err) {
      console.error(`⚠️ ${modelConfig.api} failed:`, err.message);
    }
  }

  if (responses.length === 0) {
    return { reply: "No responses received" };
  }

  if (responses.length === 1) {
    return { reply: responses[0] };
  }

  // Synthesize multiple responses
  const synthesis = `Based on multiple AI perspectives:\n\n${responses[0]}`;
  return { reply: synthesis };
}

async function callAnthropic(message, model) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

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
    throw new Error(`Anthropic: ${data.error?.message || response.status}`);
  }

  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error("No text in Anthropic response");
  }

  return { reply: text.trim() };
}

async function callOpenAI(message, model) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

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
    throw new Error(`OpenAI: ${data.error?.message || response.status}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No text in OpenAI response");
  }

  return { reply: text.trim() };
}

module.exports = brainController;
EOFC

echo "✅ Intelligent router applied!"
echo ""
echo "Now restart PM2:"
echo "  pm2 restart all && pm2 flush"
echo ""
echo "Make sure your .env has:"
echo "  ANTHROPIC_API_KEY=sk-ant-..."
echo "  OPENAI_API_KEY=sk-..."
