// PASTE THIS INTO BROWSER CONSOLE (F12) TO DIAGNOSE THE ISSUE
// This will test the messageInput element and show what's wrong

console.log("=== DIAGNOSTIC TEST ===");

// Test 1: Get the input element
const testInput = document.getElementById("messageInput");
console.log("1. Input element:", testInput);
console.log("   - tagName:", testInput?.tagName);
console.log("   - type:", testInput?.type);

// Test 2: Check current value
console.log("\n2. Current value:");
console.log("   - value:", testInput?.value);
console.log("   - typeof value:", typeof testInput?.value);

// Test 3: Set a test value and read it
if (testInput) {
    testInput.value = "test message";
    console.log("\n3. After setting 'test message':");
    console.log("   - value:", testInput.value);
    console.log("   - typeof value:", typeof testInput.value);

    const trimmed = testInput.value.trim();
    console.log("   - trimmed:", trimmed);
    console.log("   - typeof trimmed:", typeof trimmed);

    // Test 4: Test JSON.stringify
    const payload = { message: trimmed };
    console.log("\n4. Payload test:");
    console.log("   - payload:", payload);
    console.log("   - JSON.stringify:", JSON.stringify(payload));
}

// Test 5: Check if there's a global 'text' variable that might be interfering
console.log("\n5. Check for global 'text' variable:");
console.log("   - window.text:", window.text);
console.log("   - typeof window.text:", typeof window.text);

// Test 6: Check how sendMessage is defined
console.log("\n6. sendMessage function:");
console.log("   - typeof sendMessage:", typeof sendMessage);
if (typeof sendMessage === 'function') {
    console.log("   - function source (first 200 chars):");
    console.log("   ", sendMessage.toString().substring(0, 200));
}

console.log("\n=== END DIAGNOSTIC TEST ===");
console.log("\nIf 'typeof value' is not 'string', that's the problem!");
console.log("If JSON.stringify shows [object Object], the payload is wrong!");
