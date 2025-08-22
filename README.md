# Form Generator Worker

A Cloudflare Worker that provides various form-related services including Netlify integration and email functionality.

## Features

- Netlify OAuth integration
- Form deployment to Netlify
- Email form data via Mailrelay
- AI Gateway proxy functionality

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