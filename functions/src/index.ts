import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Define the structured response for the client
interface ChatResponse {
    reply: string;
}

/**
 * The main Cloud Function that will be triggered by HTTPS requests from the chat client.
 * This function will eventually contain the 7-layer architecture.
 */
export const chat = functions.https.onRequest(async (request, response) => {
    // Set CORS headers for preflight requests
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");

    if (request.method === "OPTIONS") {
        // Send response to preflight OPTIONS requests
        response.status(204).send('');
        return;
    }

    // Layer 2: Input Scanning
    const userMessage: string = request.body.message || "";
    const sanitizedMessage = sanitizeInput(userMessage);

    console.log("Received message:", userMessage);
    console.log("Sanitized message:", sanitizedMessage);

    // Layers 3 & 4: Firewall, Guardrails & Data Logging
    const moderationResponse = moderateContent(sanitizedMessage);
    if (moderationResponse) {
        const reply: ChatResponse = { reply: moderationResponse };
        // Log moderated conversation to Firestore
        logConversation(sanitizedMessage, moderationResponse, true);
        response.json(reply);
        return;
    }

    // Layers 5 & 6: Tiny LLM/ML Simulation
    let replyMessage = tinyModelLogic(sanitizedMessage);

    // Layer 7: Escalation to "The Brain"
    if (!replyMessage) {
        replyMessage = brainLogic(sanitizedMessage);
    }

    const reply: ChatResponse = {
        reply: replyMessage,
    };

    // Log normal conversation to Firestore
    logConversation(sanitizedMessage, replyMessage, false);

    response.json(reply);
});

/**
 * Logs conversation data to Firestore for training purposes.
 * This is a "fire-and-forget" operation.
 * @param {string} userInput The user's sanitized message.
 * @param {string} botResponse The bot's response.
 * @param {boolean} isModerated Whether the response was from the moderator.
 */
function logConversation(userInput: string, botResponse: string, isModerated: boolean): void {
    const logData = {
        userInput,
        botResponse,
        isModerated,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    admin.firestore().collection("conversations").add(logData).catch((err) => {
        console.error("Error writing to Firestore:", err);
    });
}

/**
 * Simulates the "Tiny LLM/ML" layer (Layers 5 & 6).
 * It handles simple, predefined inputs.
 * @param {string} message The user's message.
 * @return {string | null} A response string if a keyword is matched, otherwise null.
 */
function tinyModelLogic(message: string): string | null {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
        return "Hello there! How can I help you today?";
    }
    if (lowerCaseMessage.includes("help")) {
        return "I am a simple chatbot. You can ask me about our status. Try typing 'status'.";
    }
    if (lowerCaseMessage.includes("status")) {
        return "All systems are currently operational.";
    }

    // If no specific keyword is found, return null to escalate.
    return null;
}

/**
 * Simulates "The Brain" (Layer 7).
 * This is the escalation path for more complex queries.
 * @param {string} message The user's message.
 * @return {string} A generic response for complex queries.
 */
function brainLogic(message: string): string {
    console.log(`Escalating to The Brain for message: "${message}"`);
    return "That's a great question. Let me think about that for a moment...";
}

/**
 * Layer 2: Input Scanning/Sanitization.
 * Removes HTML tags to prevent basic XSS attacks.
 * @param {string} message The raw user message.
 * @return {string} The sanitized message.
 */
function sanitizeInput(message: string): string {
    // This regex replaces any character between < and > with an empty string.
    return message.replace(/<[^>]*>/g, "");
}

/**
 * Layers 3 & 4: Firewall & Guardrails.
 * Moderates content by checking against a blocklist of keywords.
 * @param {string} message The sanitized user message.
 * @return {string | null} A moderation response if a keyword is found, otherwise null.
 */
function moderateContent(message: string): string | null {
    const blocklist = ["password", "secret", "admin", "root", "confidential"];
    const lowerCaseMessage = message.toLowerCase();

    for (const word of blocklist) {
        if (lowerCaseMessage.includes(word)) {
            console.log(`Moderation triggered for word: "${word}"`);
            return "I'm sorry, but I cannot discuss sensitive topics. Please ask something else.";
        }
    }

    return null; // Message is clean
}
