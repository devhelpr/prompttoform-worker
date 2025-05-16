/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const allowedOrigin = ['https://app.prompttoform.ai/', 'https://demo.codeflowcanvas.io/', 'https://ocif-generator.vercel.app/'];
		const isDev = env.WRANGLER_ENV === 'dev';

		const origin = request.headers.get('Origin') || '';
		let clientAuth = request.headers.get('Authorization') ?? undefined;
		const systemKey = request.headers.get('system-key');
		let addkeyToUrl = false;
		let useSystemKey = false;

		if (systemKey === 'openai') {
			clientAuth = `Bearer ${env.OPENAI_APIKEY}`;
			useSystemKey = true;
		} else if (systemKey === 'gemini') {
			clientAuth = env.GEMINI_APIKEY;
			addkeyToUrl = true;
			useSystemKey = true;
		}

		if (!isDev && !allowedOrigin.find((o) => o.startsWith(origin))) {
			return new Response('Forbidden: invalid origin', { status: 403 });
		}

		const corsHeaders = {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Methods': '*',
		};
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					...corsHeaders,
				},
			});
		}

		let apiUrl = request.headers.get('api-url');
		const path = request.headers.get('api-path');

		if (!apiUrl || !path) {
			throw new Error(`Missing api-url or api-path ${apiUrl} ${path}`);
		}

		const apiPath = path !== '-' ? `/${path}` : '';

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (clientAuth && !addkeyToUrl) {
			headers['Authorization'] = clientAuth;
		}
		if (addkeyToUrl && useSystemKey) {
			apiUrl = `${apiUrl}${clientAuth}`;
		}

		const proxyRequest = new Request(`${apiUrl}${apiPath}`, {
			method: request.method,
			headers,
			body: request.body,
		});

		try {
			const response = await fetch(proxyRequest);
			return new Response(response.body, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('Content-Type') || 'application/json',
					...corsHeaders,
				},
			});
		} catch (err) {
			return new Response('Error connecting to AI Gateway', { status: 502 });
		}
	},
} satisfies ExportedHandler<Env>;
