// FIXED VERSION - Replace your sendMessage() function with this

async function sendMessage() {
    if (!isLoggedIn) return;

    // FIX: Get the input element fresh and validate
    const messageInputElement = document.getElementById("messageInput");
    if (!messageInputElement) {
        console.error("messageInput element not found!");
        return;
    }

    // FIX: Ensure we get a string value
    let text = messageInputElement.value;

    // FIX: Validate it's actually a string
    if (typeof text !== 'string') {
        console.error("BUG FOUND! messageInput.value is not a string:", text, typeof text);
        text = String(text); // Force to string
    }

    text = text.trim();

    if (!text) return;

    console.log("Sending message:", text, "Type:", typeof text);

    addMessage(text, "user");
    messageInputElement.value = "";
    messageInputElement.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    try {
        const payload = {
            user_id: currentUser || "ADMIN-001",
            message: text,  // Now guaranteed to be a string
            mode: currentMode
        };

        console.log("Payload:", payload);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const responseText = data?.reply || data?.message || data?.text || JSON.stringify(data);
        console.log("Response data:", data);
        console.log("Extracted text:", responseText);
        addMessage(responseText, "assistant");

    } catch (err) {
        console.error(err);
        addMessage("Error talking to server.", "assistant");
    } finally {
        messageInputElement.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        messageInputElement.focus();
    }
}
