#!/bin/bash
# Quick deployment script for the fix

echo "=== Deploying sendMessage Fix ==="

# Backup original file
echo "1. Creating backup..."
sudo cp /var/www/ip-ui-admin/index.html /var/www/ip-ui-admin/index.html.backup-$(date +%Y%m%d-%H%M%S)

echo "2. Finding the sendMessage function..."
# Find the line number where async function sendMessage() starts
START_LINE=$(grep -n "async function sendMessage()" /var/www/ip-ui-admin/index.html | cut -d: -f1)

echo "   Found at line: $START_LINE"

echo ""
echo "3. MANUAL FIX REQUIRED:"
echo "   Edit /var/www/ip-ui-admin/index.html"
echo "   Find the sendMessage() function (around line $START_LINE)"
echo "   Replace this line:"
echo "      const text = (messageInput?.value || \"\").trim();"
echo ""
echo "   With these lines:"
echo "      const messageInputElement = document.getElementById(\"messageInput\");"
echo "      if (!messageInputElement) { console.error(\"messageInput not found!\"); return; }"
echo "      let text = messageInputElement.value;"
echo "      if (typeof text !== 'string') {"
echo "          console.error(\"BUG! messageInput.value is not a string:\", text, typeof text);"
echo "          text = String(text);"
echo "      }"
echo "      text = text.trim();"
echo "      console.log(\"Sending message:\", text, \"Type:\", typeof text);"
echo ""
echo "4. After editing, test in browser console"
echo "5. Check the console.log output to confirm it says 'Type: string'"

echo ""
echo "=== Quick one-liner fix (alternative) ==="
echo "Replace the line with:"
echo "const text = String(document.getElementById('messageInput')?.value || '').trim();"
