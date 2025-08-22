# API and Embedding Usage Guide

This document provides examples of how to interact with the chatbot service in different environments.

The base URL for the API endpoint is:
`https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/chat`

**Important:** Remember to replace `YOUR_REGION` and `YOUR_PROJECT_ID` with your actual Firebase project values.

---

## 1. Web Embedding (HTML)

This is the simplest way to add the chatbot to any existing website. Just add the following `<script>` tag to your HTML file, preferably right before the closing `</body>` tag.

**Note:** You must host the `loader.js`, `chatbot.js`, and `chatbot.css` files on a server (like Firebase Hosting) and point the `src` attribute to the location of your `loader.js` file.

```html
<script src="https://your-hosting.com/path/to/loader.js" defer></script>
```

---

## 2. cURL Command

You can interact with the chatbot API directly from your command line using `cURL`. This is useful for testing and scripting.

```bash
curl -X POST \\
  https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"message": "Hello from cURL"}'
```

**Expected Response:**
```json
{
  "reply": "Hello there! How can I help you today?"
}
```

---

## 3. Node.js Example

Here is how you can call the chatbot API from a Node.js backend application using the standard `https` module.

```javascript
const https = require('https');

const postData = JSON.stringify({
  message: 'Hello from Node.js'
});

const options = {
  hostname: 'YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net',
  port: 443,
  path: '/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(postData);
req.end();
```

---

## 4. JSON Data Format

The API uses a simple JSON structure for requests and responses.

### Request Format

The request must be a `POST` request with a JSON body containing a single `message` key.

- `Content-Type` must be `application/json`.

**Example Request Body:**
```json
{
  "message": "This is the user's input."
}
```

### Response Format

A successful response (`200 OK`) will be a JSON object containing a single `reply` key.

**Example Response Body:**
```json
{
  "reply": "This is the chatbot's response."
}
```
