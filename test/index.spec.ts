// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// see for outgoing fetch mocks: https://blog.cloudflare.com/workers-vitest-integration/#declarative-request-mocking

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Request worker', () => {
	// it('responds with Hello World! (unit style)', async () => {
	// 	const request = new IncomingRequest('http://example.com');
	// 	// Create an empty context to pass to `worker.fetch()`.
	// 	const ctx = createExecutionContext();
	// 	const response = await worker.fetch(request, env, ctx);
	// 	// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
	// 	await waitOnExecutionContext(ctx);
	// 	expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	// });
	// it('responds with Hello World! (integration style)', async () => {
	// 	const response = await SELF.fetch('https://example.com');
	// 	expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	// });

	it('test', async () => {
		expect(true).toBe(true);
	});

	it('should handle multipart form data with valid files', async () => {
		// Create a mock FormData with a valid image file
		const formData = new FormData();
		const mockFile = new File(['mock image content'], 'test.png', { type: 'image/png' });
		formData.append('file', mockFile);
		formData.append('prompt', 'Test prompt');

		const request = new IncomingRequest('https://example.com', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				'system-key': 'openai',
				Origin: 'https://app.prompttoform.ai/',
			},
			body: formData,
		});

		// Mock the fetch to avoid actual API calls
		const mockResponse = new Response('{"choices": [{"message": {"content": "Test response"}}]}', {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});

		// Mock fetch globally
		global.fetch = async () => mockResponse;

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
	});

	it('should reject invalid file types', async () => {
		const formData = new FormData();
		const mockFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });
		formData.append('file', mockFile);

		const request = new IncomingRequest('https://example.com', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				'system-key': 'openai',
				Origin: 'https://app.prompttoform.ai/',
			},
			body: formData,
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		const responseData = await response.json();
		expect(responseData.error).toBe('Invalid file type');
	});

	it('should reject files that are too large', async () => {
		const formData = new FormData();
		// Create a mock file that's larger than 10MB
		const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
		const mockFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
		formData.append('file', mockFile);

		const request = new IncomingRequest('https://example.com', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				'system-key': 'openai',
				Origin: 'https://app.prompttoform.ai/',
			},
			body: formData,
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		const responseData = await response.json();
		expect(responseData.error).toBe('File too large');
	});

	it('should handle JSON requests normally', async () => {
		const request = new IncomingRequest('https://example.com', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				'content-type': 'application/json',
				'system-key': 'openai',
				Origin: 'https://app.prompttoform.ai/',
			},
			body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
		});

		// Mock the fetch to avoid actual API calls
		const mockResponse = new Response('{"choices": [{"message": {"content": "Test response"}}]}', {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});

		// Mock fetch globally
		global.fetch = async () => mockResponse;

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
	});

	it('should forward form data parameters along with files', async () => {
		const formData = new FormData();
		const mockFile = new File(['mock image content'], 'test.png', { type: 'image/png' });
		formData.append('file', mockFile);
		formData.append('model', 'gpt-4');
		formData.append('messages', JSON.stringify([{ role: 'user', content: 'Analyze this image' }]));
		formData.append('temperature', '0.7');

		const request = new IncomingRequest('https://example.com', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				'system-key': 'openai',
				Origin: 'https://app.prompttoform.ai/',
			},
			body: formData,
		});

		// Mock the fetch to capture the forwarded request
		let capturedRequest: Request | null = null;
		global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			capturedRequest = input instanceof Request ? input : new Request(input, init);
			return new Response('{"choices": [{"message": {"content": "Test response"}}]}', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		};

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(capturedRequest).not.toBeNull();

		// Verify that the request was forwarded with the correct content type
		if (capturedRequest) {
			const contentType = capturedRequest.headers.get('content-type');
			// Content-type should contain multipart/form-data with boundary
			if (contentType) {
				expect(contentType).toContain('multipart/form-data');
				expect(contentType).toContain('boundary=');
			}
			expect(capturedRequest.method).toBe('POST');
		}
	});
});
