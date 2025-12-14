// PASTE THIS IN BROWSER CONSOLE (F12 -> Console tab)
// This will test and fix the issue immediately

(function() {
    console.log("=== DIAGNOSTIC TEST ===");

    // Test 1: Check input element
    const input = document.getElementById("messageInput");
    console.log("1. Input element:", input);
    console.log("   Tag:", input?.tagName);

    // Test 2: Check current value
    console.log("2. Current value:", input?.value);
    console.log("   Type:", typeof input?.value);

    // Test 3: Set test value
    input.value = "DIAGNOSTIC TEST";
    const text = String(input.value || "").trim();
    console.log("3. After String():", text);
    console.log("   Type:", typeof text);

    // Test 4: Check what's actually being sent
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        if (args[0].includes('/api/chat')) {
            console.log("🚀 INTERCEPTED FETCH TO:", args[0]);
            console.log("📦 Request body:", args[1]?.body);
            try {
                const parsed = JSON.parse(args[1]?.body);
                console.log("📨 Parsed message:", parsed.message);
                console.log("📊 Message type:", typeof parsed.message);
            } catch (e) {
                console.log("❌ Could not parse body");
            }
        }
        return originalFetch.apply(this, args);
    };

    console.log("\n✅ Test complete! Now send a message and watch the console.");
    console.log("You should see: 🚀 INTERCEPTED FETCH with the message details");
})();
