// PROPOSED FIX for the sendMessage() function
// Replace the section around lines 674-700 in /var/www/ip-ui-admin/index.html

async function sendMessage() {
    // Get the input element reference
    const messageInput = document.getElementById("messageInput");

    // DEBUG: Check what we're getting
    console.log("Debug - messageInput element:", messageInput);
    console.log("Debug - messageInput.value:", messageInput?.value);
    console.log("Debug - typeof messageInput.value:", typeof messageInput?.value);

    // Extract and validate the text
    const rawValue = messageInput?.value;

    // Ensure we have a string
    if (!rawValue || typeof rawValue !== 'string') {
        console.error("Invalid input value:", rawValue);
        return;
    }

    const text = rawValue.trim();

    // Check if message is empty
    if (!text) {
        console.log("Empty message, not sending");
        return;
    }

    console.log("Sending message:", text);
    console.log("Message length:", text.length);

    // Clear input
    messageInput.value = "";

    // Create the payload
    const payload = { message: text };
    console.log("Payload object:", payload);
    console.log("Payload stringified:", JSON.stringify(payload));

    try {
        const response = await fetch('/api/brain/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        // Handle the response...

    } catch (error) {
        console.error("Error sending message:", error);
    }
}

/*
ALTERNATIVE FIX - If the above doesn't work, the issue might be in how
messageInput is defined. Check if messageInput is being redefined somewhere.

Make sure line 647 looks like this:
const messageInput = document.getElementById("messageInput");

And NOT like this (wrong):
const messageInput = document.querySelector("#messageInput").value;
                                                             ^^^^^^
                                                             Don't add .value here!

The .value should ONLY be accessed when you need the text, not when defining the variable.
*/

// ALSO CHECK: Make sure the input element in HTML looks like:
// <input type="text" id="messageInput" placeholder="Type a message...">
//
// And NOT like:
// <textarea id="messageInput"></textarea>  (textarea should work but verify)
