/**
 * Netlify OAuth Handler
 * Handles the OAuth callback from Netlify after user authentication
 */
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': '*',
};

export async function handleNetlifyAuth(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				...corsHeaders,
			},
		});
	}

	// Handle OAuth errors
	if (error) {
		return new Response(`OAuth Error: ${error}`, {
			status: 400,
			headers: {
				'Content-Type': 'text/plain',
				...corsHeaders,
			},
		});
	}

	// Check if we have the authorization code
	if (!code) {
		return new Response('Missing authorization code', {
			status: 400,
			headers: {
				'Content-Type': 'text/plain',
			},
		});
	}

	try {
		// Exchange the authorization code for an access token
		const tokenResponse = await exchangeCodeForToken(code, env);

		// Store the access token (you might want to store this in a database or KV store)
		// For now, we'll just redirect with success

		// Redirect to demo.codeflowcanvas.io with success
		const redirectUrl = new URL('https://demo.codeflowcanvas.io');
		redirectUrl.searchParams.set('auth', 'success');
		redirectUrl.searchParams.set('provider', 'netlify');
		redirectUrl.searchParams.set('access_token', tokenResponse.access_token); //temp

		// Optionally include the state parameter if it was provided
		if (state) {
			redirectUrl.searchParams.set('state', state);
		}

		return new Response(null, {
			status: 302,
			headers: {
				...corsHeaders,
				Location: redirectUrl.toString(),
			},
		});
	} catch (error) {
		console.error('Error exchanging code for token:', error);

		// Redirect to demo.codeflowcanvas.io with error
		const redirectUrl = new URL('https://demo.codeflowcanvas.io');
		redirectUrl.searchParams.set('auth', 'error');
		redirectUrl.searchParams.set('provider', 'netlify');
		redirectUrl.searchParams.set('error', 'token_exchange_failed');

		return new Response(null, {
			status: 302,
			headers: {
				...corsHeaders,
				Location: redirectUrl.toString(),
			},
		});
	}
}

async function exchangeCodeForToken(code: string, env: Env): Promise<any> {
	const tokenUrl = 'https://api.netlify.com/oauth/token';

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: code,
		client_id: env.NETLIFY_CLIENT_ID,
		client_secret: env.NETLIFY_CLIENT_SECRET,
		redirect_uri: env.NETLIFY_REDIRECT_URI,
	});

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
	}

	return await response.json();
}

export async function handleCodeFlowCanvasNetlifyAuth(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');
	const workerRedirect = 'https://form-generator-worker.maikel-f16.workers.dev/netlify';
	//const redirectUrl = new URL('https://demo.codeflowcanvas.io');

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				...corsHeaders,
			},
		});
	}
	const redirectUrl = `https://app.netlify.com/authorize?response_type=code&scope=public&client_id=${env.NETLIFY_CLIENT_ID}&redirect_uri=${workerRedirect}`;

	return new Response(null, {
		status: 302,
		headers: {
			...corsHeaders,
			Location: redirectUrl,
		},
	});
}
