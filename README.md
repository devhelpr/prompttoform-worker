# Form Generator Worker

A Cloudflare Worker that provides various form-related services including Netlify integration and email functionality.

## Features

- Netlify OAuth integration
- Form deployment to Netlify
- Email form data via Mailrelay
- AI Gateway proxy functionality with file upload support
- SQLite database storage for JSON data

## LLM API Proxy

The worker acts as a secure proxy for various LLM APIs (OpenAI, Google Gemini, etc.) with support for both JSON requests and file uploads.

### Configuration

Set the following environment variables in your Cloudflare Worker:

```bash
OPENAI_APIKEY=your_openai_api_key
GEMINI_APIKEY=your_gemini_api_key
```

### Supported File Types

The proxy supports the following file types for upload:
- **PDF**: `application/pdf`
- **Images**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

### File Size Limits

- Maximum file size: **10MB**
- Multiple files can be uploaded in a single request

### Usage

#### JSON Requests (Traditional)

Send JSON requests to LLM APIs:

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  })
});

const result = await response.json();
console.log(result);
```

#### File Upload Requests (Multipart)

Send files along with prompts to LLM APIs:

```javascript
const formData = new FormData();
formData.append('file', pdfFile); // or imageFile
formData.append('prompt', 'Analyze this document and summarize the key points');

const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

#### Multiple Files

Upload multiple files in a single request:

```javascript
const formData = new FormData();
formData.append('file1', pdfFile);
formData.append('file2', imageFile);
formData.append('prompt', 'Compare these documents and images');

const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: formData
});
```

### Request Headers

#### Required Headers

- `api-url`: The base URL of the target LLM API (e.g., `https://api.openai.com/v1`)
- `api-path`: The API endpoint path (e.g., `chat/completions`, `images/generations`)

#### Optional Headers

- `system-key`: Use predefined API keys (`openai` or `gemini`)
- `Authorization`: Custom authorization header (if not using system-key)
- `Origin`: Required for CORS validation

### Supported LLM APIs

#### OpenAI

```javascript
// Using system key
const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

// Using custom authorization
const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'Authorization': 'Bearer your-custom-openai-key'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
```

#### Google Gemini

```javascript
// Using system key
const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-url': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'api-path': '-',
    'system-key': 'gemini'
  },
  body: JSON.stringify({
    contents: [{
      parts: [{ text: 'Hello, how are you?' }]
    }]
  })
});
```

### Error Responses

#### File Validation Errors

```json
{
  "error": "Invalid file type",
  "message": "File type text/plain is not supported. Allowed types: PDF, JPEG, PNG, GIF, WebP, SVG",
  "allowedTypes": ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
}
```

```json
{
  "error": "File too large",
  "message": "File size must be less than 10MB"
}
```

```json
{
  "error": "Invalid form data",
  "message": "Failed to parse multipart form data"
}
```

#### Proxy Errors

```json
{
  "error": "Missing api-url or api-path",
  "message": "Missing api-url or api-path null null"
}
```

### CORS Support

The proxy includes CORS headers for the following origins:
- `https://app.prompttoform.ai/`
- `https://demo.codeflowcanvas.io/`
- `https://ocif-generator.vercel.app/`
- `*.prompttoform.pages.dev` (for PR branches)

### Example Use Cases

#### Document Analysis

```javascript
const formData = new FormData();
formData.append('file', pdfDocument);
formData.append('prompt', 'Extract all the key information from this document and format it as a structured summary');

const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: formData
});
```

#### Image Description

```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('prompt', 'Describe this image in detail, including any text visible in the image');

const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: formData
});
```

#### Code Review

```javascript
const formData = new FormData();
formData.append('file', codeFile);
formData.append('prompt', 'Review this code for potential bugs, security issues, and suggest improvements');

const response = await fetch('https://your-worker.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'api-url': 'https://api.openai.com/v1',
    'api-path': 'chat/completions',
    'system-key': 'openai'
  },
  body: formData
});
```

## Email Endpoint

The worker includes an endpoint for sending form data via email using Mailrelay.

### Configuration

Set the following environment variables in your Cloudflare Worker:

```bash
MAILRELAY_API_KEY=your_mailrelay_api_key
MAILRELAY_DOMAIN=your_mailrelay_domain
```

### Usage

Send a POST request to `/email/form-data` with the following JSON structure:

```json
{
  "to": "recipient@example.com",
  "subject": "New Form Submission",
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world"
  },
  "from": "noreply@yourdomain.com"
}
```

#### Request Parameters

- `to` (required): Email address of the recipient
- `subject` (optional): Email subject line (defaults to "New Form Submission")
- `formData` (required): Object containing the form data to be sent
- `from` (optional): Sender email address (defaults to "noreply@yourdomain.com")

#### Response

Success response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "message_id_from_mailrelay"
}
```

Error response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Example

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/email/form-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'admin@example.com',
    subject: 'Contact Form Submission',
    formData: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      message: 'I would like to inquire about your services.'
    }
  })
});

const result = await response.json();
console.log(result);
```

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
``` 


## Database API Endpoints

The worker includes a comprehensive API for storing and managing JSON data in a Cloudflare D1 SQLite database.

### Configuration

1. Create a D1 database in your Cloudflare dashboard
2. Update the `database_id` in `wrangler.jsonc` with your actual database ID
3. Deploy the worker

### Endpoints

#### POST /api/data - Store new data

Store JSON data in the database.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello world",
  "customField": "any value"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data stored successfully",
  "data": {
    "id": 1,
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello world",
      "customField": "any value"
    },
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/data - Get all data

Retrieve all stored data with pagination support.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "id": 2,
      "data": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "created_at": "2023-01-02T00:00:00.000Z",
      "updated_at": "2023-01-02T00:00:00.000Z"
    },
    {
      "id": 1,
      "data": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 2
  }
}
```

#### GET /api/data/:id - Get specific data

Retrieve a specific record by ID.

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "id": 1,
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/data/:id - Update data

Update an existing record.

**Request:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data updated successfully",
  "data": {
    "id": 1,
    "data": {
      "name": "John Updated",
      "email": "john.updated@example.com"
    },
    "updated_at": "2023-01-01T12:00:00.000Z"
  }
}
```

#### DELETE /api/data/:id - Delete data

Delete a specific record.

**Response:**
```json
{
  "success": true,
  "message": "Data deleted successfully"
}
```

### Example Usage

```javascript
// Store new data
const response = await fetch('https://your-worker.your-subdomain.workers.dev/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from the form!'
  })
});

const result = await response.json();
console.log('Stored data ID:', result.data.id);

// Retrieve all data
const allDataResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/data?limit=10&offset=0');
const allData = await allDataResponse.json();
console.log('All data:', allData.data);

// Get specific data
const specificDataResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/data/1');
const specificData = await specificDataResponse.json();
console.log('Specific data:', specificData.data);

// Update data
const updateResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/data/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Updated',
    email: 'john.updated@example.com'
  })
});

// Delete data
const deleteResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/data/1', {
  method: 'DELETE'
});
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid JSON, missing required fields)
- `404` - Not Found (record doesn't exist)
- `500` - Internal Server Error (database errors)

## TODO email 

https://support.mailchannels.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Email-API