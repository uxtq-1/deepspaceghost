// This is the loader script. It will be the single entry point for users.
// It is responsible for loading the chatbot's CSS and main JavaScript file.

(function() {
    // --- CONFIGURATION ---
    // --- CONFIGURATION ---
    // This is the base URL where you will host the chatbot assets.
    // The user of this script will need to change this to their own hosting URL.
    const SCRIPT_BASE_URL = 'https://your-hosting-provider.com/path/to/assets';

    // --- SCRIPT LOGIC ---

    // Get the current script tag to find the base path if not configured
    // This is a more advanced (but robust) way to let the script find its own assets
    const thisScript = document.currentScript;
    let baseUrl = SCRIPT_BASE_URL;

    if (thisScript && thisScript.src.includes('loader.js')) {
        // Automatically determine base URL from the loader script's own path
        baseUrl = thisScript.src.substring(0, thisScript.src.lastIndexOf('/'));
    }

    console.log("Chatbot Loader: Loading assets from", baseUrl);

    // 1. Load the CSS file
    const cssFile = 'chatbot.css';
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    cssLink.href = `${baseUrl}/${cssFile}`;
    document.head.appendChild(cssLink);

    // 2. Load the main chatbot JavaScript file
    const jsFile = 'chatbot.js';
    const jsScript = document.createElement('script');
    jsScript.src = `${baseUrl}/${jsFile}`;
    jsScript.defer = true; // Defer execution until the document is parsed
    document.head.appendChild(jsScript);

})();
