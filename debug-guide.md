# Debug Guide: "[object Object]" Issue

## Problem
Backend receives `[object Object]` instead of actual message text.

## Root Cause Analysis

Looking at line 681: `const text = (messageInput?.value || "").trim();`

The issue is likely one of these:

### **Most Likely Cause:**
The `text` variable is somehow getting an object. This could happen if:

1. **Event object confusion**: If `sendMessage()` is being called with an event parameter and accidentally using it
2. **messageInput reference issue**: The `messageInput` variable might be getting reassigned somewhere
3. **Value property returning object**: Unlikely but possible if there's a custom getter

## Debugging Steps

### Step 1: Add console.log to see what's actually in the text variable

In `/var/www/ip-ui-admin/index.html`, modify around line 681:

```javascript
const text = (messageInput?.value || "").trim();
console.log("Debug - messageInput:", messageInput);
console.log("Debug - messageInput.value:", messageInput?.value);
console.log("Debug - text type:", typeof text);
console.log("Debug - text value:", text);
```

### Step 2: Check the fetch body

Around line 695-700, add:

```javascript
const payload = {message: text};
console.log("Debug - payload:", payload);
console.log("Debug - stringified:", JSON.stringify(payload));

const response = await fetch('/api/brain/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});
```

### Step 3: Verify the input element

Check line 647:

```javascript
const messageInput = document.getElementById("messageInput");
console.log("Debug - messageInput element:", messageInput);
console.log("Debug - messageInput tagName:", messageInput?.tagName);
```

## **Likely Fix**

Based on common patterns, the issue might be that somewhere the code is doing this:

```javascript
// WRONG - if sendMessage receives event parameter
async function sendMessage(event) {
    const text = event;  // <- This would cause [object Object]

// OR
    const text = messageInput;  // <- Using element instead of .value
}
```

### **Solution: Ensure text is extracted correctly**

Change line 681 to explicitly ensure string conversion:

```javascript
// Get the value and ensure it's a string
const text = String(messageInput?.value || "").trim();
```

### **Better: Type-safe version**

```javascript
const textValue = messageInput?.value;
console.log("Raw value:", textValue, "Type:", typeof textValue);

if (typeof textValue !== 'string') {
    console.error("ERROR: messageInput.value is not a string!", textValue);
    return;
}

const text = textValue.trim();
if (!text) {
    console.log("Empty message, not sending");
    return;
}

console.log("Sending message:", text);
```

## Expected Output

After adding the debugging logs, you should see in the browser console:
- What type `text` is
- What value `text` contains
- Whether it's an object or string

This will tell us exactly where the object is coming from.

## Next Steps

1. Add the console.log statements
2. Try sending a message
3. Check the browser console (F12)
4. Share the console output

The logs will reveal whether:
- `messageInput` is the correct DOM element
- `messageInput.value` returns a string
- Something is replacing `text` with an object
- The issue is in serialization
