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

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const allowedOrigin = ['https://prompttotorm.ai'];
		const isDev = env.WRANGLER_ENV === 'dev';

		const origin = 'http://localhost'; //request.headers.get('Origin') ||
		const clientAuth = request.headers.get('Authorization');

		if (!isDev && !allowedOrigin.find((o) => o.startsWith(origin))) {
			return new Response('Forbidden: invalid origin', { status: 403 });
		}

		let headers = {};
		//const originUrl = new URL(origin);
		//const originHost = `${originUrl.protocol}//${originUrl.hostname}`;

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': '*',
					'Access-Control-Allow-Headers': '*',
				},
			});
		}

		headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Methods': '*',
		};

		const apiUrl = request.headers.get('api-url');
		const path = request.headers.get('api-path');

		if (!apiUrl || !path) {
			throw new Error(`Missing x-api-url or x-path ${apiUrl} ${path}`);
		}

		const proxyRequest = new Request(`${apiUrl}/${path}`, {
			method: request.method,
			headers: {
				Authorization: clientAuth || '',
				'Content-Type': 'application/json',
			},
			body: request.body,
		});

		try {
			const response = await fetch(proxyRequest);
			return new Response(response.body, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('Content-Type') || 'application/json',
					...headers,
				},
			});
		} catch (err) {
			return new Response('Error connecting to AI Gateway', { status: 502 });
		}
	},
} satisfies ExportedHandler<Env>;
