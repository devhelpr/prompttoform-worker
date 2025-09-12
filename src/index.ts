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
import { handleOpenAPIRequest } from './openapi';
import { processLLMRequestWithOpenAPI, hasOpenAPIToolConfig, executeAPICall } from './openapi-integration';

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

		// Route to OpenAPI/Swagger handler
		if (path === '/api/openapi' || path === '/api/swagger') {
			return handleOpenAPIRequest(request, env);
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

		// Handle multipart form data requests
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

				// The original formData is already validated, no need to recreate it
				// Create a new request with the validated formData
				// Don't set Content-Type header - let FormData set it automatically with correct boundary
				const newHeaders = new Headers();
				// Copy all headers except Content-Type (which will be set by FormData)
				for (const [key, value] of request.headers.entries()) {
					if (key.toLowerCase() !== 'content-type') {
						newHeaders.set(key, value);
					}
				}

				request = new Request(request.url, {
					method: request.method,
					headers: newHeaders,
					body: formData,
				});
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
			// For multipart requests, don't set Content-Type header
			// Let the FormData object set the correct boundary automatically
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

		// Process request body for OpenAPI tool integration
		let requestBody: BodyInit | null = request.body;
		let originalRequestData: any = null;
		if (request.method === 'POST' && !isMultipart && request.body) {
			try {
				// Clone the request to read the body without consuming it
				const clonedRequest = request.clone();
				const bodyText = await clonedRequest.text();

				// Store original request data for later use
				originalRequestData = JSON.parse(bodyText);

				// Check if OpenAPI tool integration is requested
				if (hasOpenAPIToolConfig(bodyText)) {
					console.log('OpenAPI tool integration requested, processing...');
					const processedBody = await processLLMRequestWithOpenAPI(bodyText);
					requestBody = processedBody;
				}
			} catch (error) {
				console.error('Error processing request body for OpenAPI integration:', error);
				// Continue with original body if processing fails
			}
		}

		const proxyRequest = new Request(`${apiUrl}${pathSegment}`, {
			method: request.method,
			headers,
			body: requestBody,
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

			// Check if this is an LLM response with tool calls that need to be executed
			const contentType = response.headers.get('content-type') || '';
			if (contentType.includes('application/json') && request.method === 'POST') {
				try {
					const responseText = await response.text();
					const responseData = JSON.parse(responseText);

					// Check if the response contains tool calls
					if (responseData.choices && responseData.choices[0]?.message?.tool_calls) {
						console.log('LLM response contains tool calls, executing...');

						const toolCalls = responseData.choices[0].message.tool_calls;
						const toolResults = [];

						// Execute each tool call
						for (const toolCall of toolCalls) {
							if (toolCall.function && toolCall.function.name === 'get_openapi_documentation') {
								try {
									const functionName = toolCall.function.name;
									const arguments_ = JSON.parse(toolCall.function.arguments);

									const result = await executeAPICall(functionName, arguments_);
									toolResults.push({
										tool_call_id: toolCall.id,
										role: 'tool',
										name: functionName,
										content: JSON.stringify(result),
									});
								} catch (error) {
									console.error('Error executing tool call:', error);
									toolResults.push({
										tool_call_id: toolCall.id,
										role: 'tool',
										name: toolCall.function.name,
										content: JSON.stringify({
											success: false,
											error: error instanceof Error ? error.message : 'Unknown error',
										}),
									});
								}
							}
						}

						// If we have tool results, we need to make another request to the LLM with the results
						if (toolResults.length > 0) {
							console.log(`Executed ${toolResults.length} tool calls, sending results back to LLM`);

							// Add tool results to the conversation
							const followUpRequest = {
								...originalRequestData,
								messages: [...originalRequestData.messages, responseData.choices[0].message, ...toolResults],
							};

							// Remove the useOpenAPITool config for the follow-up request
							delete followUpRequest.useOpenAPITool;

							// Make follow-up request to LLM
							const followUpResponse = await fetch(proxyRequest.url, {
								method: 'POST',
								headers: proxyRequest.headers,
								body: JSON.stringify(followUpRequest),
							});

							return new Response(followUpResponse.body, {
								status: followUpResponse.status,
								headers: {
									'Content-Type': followUpResponse.headers.get('Content-Type') || 'application/json',
									...corsHeaders,
								},
							});
						}
					}

					// Return original response if no tool calls or no OpenAPI tools
					return new Response(responseText, {
						status: response.status,
						headers: {
							'Content-Type': response.headers.get('Content-Type') || 'application/json',
							...corsHeaders,
						},
					});
				} catch (error) {
					console.error('Error processing LLM response:', error);
					// Return original response if processing fails
				}
			}

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
