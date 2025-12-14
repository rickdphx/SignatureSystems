#!/bin/bash
# Fix for "No response from AI" error
# Run this on your EC2 server

echo "=== Fixing 'No response from AI' Error ==="

# Backup
echo "Creating backup..."
sudo cp /home/ubuntu/signaturebrain-backend/controllers/brainController.js /home/ubuntu/signaturebrain-backend/controllers/brainController.js.backup-$(date +%Y%m%d-%H%M%S)

echo "Applying fix with debug logging..."

# Create the fixed brainController.js
sudo tee /home/ubuntu/signaturebrain-backend/controllers/brainController.js > /dev/null <<'EOF'
const brainController = async (message, user_id) => {
  try {
    console.log("🚀 brainController called with message:", message);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: message }]
      })
    });

    console.log("📊 Anthropic API status:", response.status);

    const data = await response.json();
    console.log("📦 Anthropic API response:", JSON.stringify(data, null, 2));

    // Check for API errors
    if (!response.ok) {
      console.error("❌ API Error:", data);
      return { reply: `API Error: ${data.error?.message || 'Unknown error'}` };
    }

    // Parse the response
    const text = data?.content?.[0]?.text;
    console.log("✅ Extracted text:", text);

    if (!text || typeof text !== "string") {
      console.error("❌ No text in response. Full data:", data);
      return { reply: "No response from AI" };
    }

    return { reply: text.trim() };
  } catch (err) {
    console.error("💥 Anthropic API error:", err);
    return { reply: `Error processing request: ${err.message}` };
  }
};

module.exports = brainController;
EOF

echo "✅ Fix applied with debug logging!"
echo ""
echo "Now restart PM2:"
echo "  cd /home/ubuntu/signaturebrain-backend"
echo "  pm2 restart all && pm2 flush"
echo ""
echo "Then test by sending a message and check the logs:"
echo "  pm2 logs --lines 50"
echo ""
echo "You should see:"
echo "  🚀 brainController called with message: [your message]"
echo "  📊 Anthropic API status: 200"
echo "  📦 Anthropic API response: [full JSON]"
echo "  ✅ Extracted text: [AI response]"
echo ""
echo "If you see an error, the logs will show exactly what went wrong."
