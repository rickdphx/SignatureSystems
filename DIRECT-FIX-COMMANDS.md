# Direct Commands to Fix "No Response from AI"

Since the script is in the repo, here are the direct commands to run on your EC2 server:

## Step 1: Backup the current file
```bash
sudo cp /home/ubuntu/signaturebrain-backend/controllers/brainController.js /home/ubuntu/signaturebrain-backend/controllers/brainController.js.backup-$(date +%Y%m%d-%H%M%S)
```

## Step 2: Replace brainController.js with the fixed version
```bash
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
```

## Step 3: Restart PM2
```bash
pm2 restart all && pm2 flush
```

## Step 4: Test and Check Logs
Send a test message in the browser, then:
```bash
pm2 logs --lines 100 | grep -A 5 "🚀"
```

This will show you the debug output and reveal exactly what's wrong with the Anthropic API.
