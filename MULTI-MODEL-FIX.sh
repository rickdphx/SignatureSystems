#!/bin/bash
# Multi-Model Support Implementation
# Maps different modes to different AI models

echo "=== Implementing Multi-Model Support ==="

# Step 1: Fix the export bug first
echo "Step 1: Fixing export bug..."
sudo sed -i 's/module.exports = { brainController };/module.exports = brainController;/' /home/ubuntu/signaturebrain-backend/controllers/brainController.js

# Step 2: Backup current file
echo "Step 2: Creating backup..."
sudo cp /home/ubuntu/signaturebrain-backend/controllers/brainController.js /home/ubuntu/signaturebrain-backend/controllers/brainController.js.backup-multimodel

# Step 3: Update app.js to pass mode to controller
echo "Step 3: Updating app.js to pass mode parameter..."
sudo sed -i 's/const response = await brainController(messageStr, user_id);/const mode = req.body.mode || "ben";\n    const response = await brainController(messageStr, user_id, mode);/' /home/ubuntu/signaturebrain-backend/app.js

# Step 4: Create multi-model brainController
echo "Step 4: Creating multi-model brainController..."
sudo tee /home/ubuntu/signaturebrain-backend/controllers/brainController.js > /dev/null <<'EOF'
// Multi-Model Brain Controller
// Routes different modes to different AI models

const brainController = async (message, user_id, mode = "ben") => {
  console.log(`🚀 brainController called - mode: ${mode}, message: ${message}`);

  // Model routing based on mode
  const modelConfig = {
    ben: { api: "anthropic", model: "claude-sonnet-4-20250514" },
    craft: { api: "openai", model: "gpt-4" },
    pulse: { api: "anthropic", model: "claude-3-5-sonnet-20241022" },
    shield: { api: "openai", model: "gpt-4-turbo" },
    flow: { api: "anthropic", model: "claude-sonnet-4-20250514" }
  };

  const config = modelConfig[mode] || modelConfig.ben;
  console.log(`📊 Using ${config.api} - ${config.model}`);

  try {
    if (config.api === "anthropic") {
      return await callAnthropic(message, config.model);
    } else if (config.api === "openai") {
      return await callOpenAI(message, config.model);
    } else {
      return { reply: "Model not supported yet" };
    }
  } catch (err) {
    console.error("💥 AI API error:", err);
    return { reply: `Error: ${err.message}` };
  }
};

// Anthropic API handler
async function callAnthropic(message, model) {
  console.log(`🔵 Calling Anthropic with ${model}...`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: message }]
    })
  });

  console.log(`📊 Anthropic status: ${response.status}`);
  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Anthropic Error:", data);
    return { reply: `Anthropic Error: ${data.error?.message || 'Unknown error'}` };
  }

  const text = data?.content?.[0]?.text;
  if (!text || typeof text !== "string") {
    console.error("❌ No text in response");
    return { reply: "No response from Anthropic" };
  }

  console.log("✅ Anthropic response received");
  return { reply: text.trim() };
}

// OpenAI API handler
async function callOpenAI(message, model) {
  console.log(`🟢 Calling OpenAI with ${model}...`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: message }],
      max_tokens: 1024
    })
  });

  console.log(`📊 OpenAI status: ${response.status}`);
  const data = await response.json();

  if (!response.ok) {
    console.error("❌ OpenAI Error:", data);
    return { reply: `OpenAI Error: ${data.error?.message || 'Unknown error'}` };
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    console.error("❌ No text in OpenAI response");
    return { reply: "No response from OpenAI" };
  }

  console.log("✅ OpenAI response received");
  return { reply: text.trim() };
}

module.exports = brainController;
EOF

echo ""
echo "✅ Multi-model support implemented!"
echo ""
echo "Model Routing:"
echo "  - BEN mode    → Anthropic Claude Sonnet 4"
echo "  - CRAFT mode  → OpenAI GPT-4"
echo "  - PULSE mode  → Anthropic Claude 3.5 Sonnet"
echo "  - SHIELD mode → OpenAI GPT-4 Turbo"
echo "  - FLOW mode   → Anthropic Claude Sonnet 4"
echo ""
echo "Next steps:"
echo "1. Add OPENAI_API_KEY to .env if not present"
echo "2. Restart PM2: pm2 restart all && pm2 flush"
echo "3. Test different modes in the UI"
echo ""
echo "To customize which mode uses which model, edit:"
echo "  /home/ubuntu/signaturebrain-backend/controllers/brainController.js"
echo "  (Look for the modelConfig object)"
