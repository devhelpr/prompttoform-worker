# Form Generator Worker

A Cloudflare Worker that provides proxy functionality for AI APIs and Netlify OAuth integration.

## Features

- **AI API Proxy**: Routes requests to various AI providers (OpenAI, Gemini) with proper authentication
- **Netlify OAuth**: Handles OAuth authentication flow for Netlify integration

## Netlify OAuth Integration

This worker includes a Netlify OAuth endpoint that handles the authentication callback from Netlify and redirects users to `demo.codeflowcanvas.io`.

### Setup

1. **Create a Netlify OAuth App**:
   - Go to [Netlify OAuth Apps](https://app.netlify.com/user/applications)
   - Create a new OAuth application
   - Set the redirect URI to: `https://your-worker.your-subdomain.workers.dev/netlify/auth`

2. **Configure Environment Variables**:
   Add the following environment variables to your worker:

   ```bash
   wrangler secret put NETLIFY_CLIENT_ID
   wrangler secret put NETLIFY_CLIENT_SECRET
   wrangler secret put NETLIFY_REDIRECT_URI
   ```

   Or set them in your `wrangler.jsonc`:
   ```json
   {
     "vars": {
       "NETLIFY_CLIENT_ID": "your-client-id",
       "NETLIFY_CLIENT_SECRET": "your-client-secret", 
       "NETLIFY_REDIRECT_URI": "https://your-worker.your-subdomain.workers.dev/netlify/auth"
     }
   }
   ```

3. **Deploy the Worker**:
   ```bash
   npm run deploy
   ```

### Usage

1. **Initiate OAuth Flow**:
   Redirect users to:
   ```
   https://app.netlify.com/authorize?response_type=code&client_id=${YOUR_CLIENT_ID}&redirect_uri=${YOUR_REDIRECT_URI}&scope=deploy:sites
   ```

2. **Handle Callback**:
   After user authentication, Netlify will redirect to your worker's `/netlify/auth` endpoint with an authorization code.

3. **Success Redirect**:
   The worker will exchange the code for an access token and redirect to:
   ```
   https://demo.codeflowcanvas.io?auth=success&provider=netlify&state=${state}
   ```

4. **Error Handling**:
   If there's an error, users will be redirected to:
   ```
   https://demo.codeflowcanvas.io?auth=error&provider=netlify&error=${error_type}
   ```

### Endpoints

- `GET /netlify/auth` - OAuth callback endpoint
- All other paths - AI API proxy functionality

### Testing

Run the tests to verify the OAuth flow:

```bash
npm test
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

## Environment Variables

- `NETLIFY_CLIENT_ID` - Your Netlify OAuth app client ID
- `NETLIFY_CLIENT_SECRET` - Your Netlify OAuth app client secret  
- `NETLIFY_REDIRECT_URI` - The redirect URI configured in your Netlify OAuth app
- `OPENAI_APIKEY` - OpenAI API key for proxy functionality
- `GEMINI_APIKEY` - Gemini API key for proxy functionality
- `WRANGLER_ENV` - Environment indicator (dev/production) 