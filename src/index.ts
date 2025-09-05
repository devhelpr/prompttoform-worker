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

import { handleNetlifyAuth, handleCodeFlowCanvasNetlifyAuth } from './netlify';
import { handleDeployCodeFlowCanvasToNetlify } from './netlify-deploy';
import { handleEmailFormData } from './email';
import { handleDatabaseRequest } from './database-api';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/netlify/code-flow-canvas') {
			return handleCodeFlowCanvasNetlifyAuth(request, env);
		}
		if (path === '/netlify/deploy-code-flow-canvas') {
			return handleDeployCodeFlowCanvasToNetlify(request, env);
		}

		if (path === '/netlify/auth-prompttoform') {
			return handleCodeFlowCanvasNetlifyAuth(request, env);
		}
		if (path === '/netlify/deploy-form-preview') {
			return await handleDeployCodeFlowCanvasToNetlify(request, env);
		}

		// Route to Netlify OAuth handler
		if (path === '/netlify') {
			return handleNetlifyAuth(request, env);
		}

		// Route to email form data handler
		if (path === '/email/form-data') {
			return handleEmailFormData(request, env);
		}

		// Route to database API handler
		if (path.startsWith('/api/data')) {
			return handleDatabaseRequest(request, env);
		}

		// Existing proxy functionality
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

		let isPrompttoformPRBranch = false;
		if (!isDev) {
			//*.prompttoform.pages.dev
			if (origin.endsWith('.prompttoform.pages.dev')) {
				isPrompttoformPRBranch = true;
			}
		}

		if (!isPrompttoformPRBranch && !isDev && !allowedOrigin.find((o) => o.startsWith(origin))) {
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
		const apiPath = request.headers.get('api-path');

		if (!apiUrl || !apiPath) {
			throw new Error(`Missing api-url or api-path ${apiUrl} ${apiPath}`);
		}

		let pathSegment = apiPath !== '-' ? `/${apiPath}` : '';

		// Detect content type and handle file uploads
		const contentType = request.headers.get('content-type') || '';
		const isMultipart = contentType.includes('multipart/form-data');

		// Validate file types if multipart request
		if (isMultipart) {
			try {
				// Clone the request to avoid consuming the body
				const clonedRequest = request.clone();
				const formData = await clonedRequest.formData();
				const files = Array.from(formData.entries()).filter(([_, value]) => value instanceof File);

				// Validate file types
				for (const [key, file] of files) {
					if (file instanceof File) {
						const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

						if (!allowedTypes.includes(file.type)) {
							return new Response(
								JSON.stringify({
									error: 'Invalid file type',
									message: `File type ${file.type} is not supported. Allowed types: PDF, JPEG, PNG, GIF, WebP, SVG`,
									allowedTypes,
								}),
								{
									status: 400,
									headers: {
										'Content-Type': 'application/json',
										...corsHeaders,
									},
								}
							);
						}

						// Check file size (limit to 10MB)
						if (file.size > 10 * 1024 * 1024) {
							return new Response(
								JSON.stringify({
									error: 'File too large',
									message: 'File size must be less than 10MB',
								}),
								{
									status: 400,
									headers: {
										'Content-Type': 'application/json',
										...corsHeaders,
									},
								}
							);
						}
					}
				}
			} catch (error) {
				return new Response(
					JSON.stringify({
						error: 'Invalid form data',
						message: 'Failed to parse multipart form data',
					}),
					{
						status: 400,
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders,
						},
					}
				);
			}
		}

		const headers: Record<string, string> = {};

		// Set content type based on request type
		if (isMultipart) {
			// For multipart requests, let the browser set the content-type with boundary
			// Don't override it
		} else {
			headers['Content-Type'] = 'application/json';
		}

		if (clientAuth && !addkeyToUrl) {
			headers['Authorization'] = clientAuth;
		}
		if (addkeyToUrl && useSystemKey) {
			apiUrl = `${apiUrl}${clientAuth}`;
		}

		if (apiUrl.endsWith('/') && pathSegment.startsWith('/')) {
			pathSegment = pathSegment.slice(1);
		}
		if (pathSegment.startsWith('//')) {
			pathSegment = pathSegment.slice(1);
		}
		console.log(`${apiUrl} - ${pathSegment}`);
		const proxyRequest = new Request(`${apiUrl}${pathSegment}`, {
			method: request.method,
			headers,
			body: request.body,
		});

		try {
			const response = await fetch(proxyRequest).catch((err) => {
				console.log('Proxy error:', {
					error: err instanceof Error ? err.message : String(err),
					stack: err instanceof Error ? err.stack : undefined,
					apiUrl: `${apiUrl}${pathSegment}`,
					method: request.method,
					status: err instanceof Response ? err.status : undefined,
				});
				return new Response('Error connecting to AI Gateway', { status: 502 });
			});
			return new Response(response.body, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('Content-Type') || 'application/json',
					...corsHeaders,
				},
			});
		} catch (err) {
			console.log('Proxy error:', {
				error: err instanceof Error ? err.message : String(err),
				stack: err instanceof Error ? err.stack : undefined,
				apiUrl: `${apiUrl}${pathSegment}`,
				method: request.method,
				status: err instanceof Response ? err.status : undefined,
			});
			return new Response('Error connecting to AI Gateway', { status: 502 });
		}
	},
} satisfies ExportedHandler<Env>;
