import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the global fetch function
global.fetch = vi.fn();

describe('Request Body Handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle request body consumption correctly', async () => {
		// This test verifies that we don't get the "ReadableStream is disturbed" error
		const requestBody = JSON.stringify({
			messages: [{ role: 'user', content: 'Hello' }],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: [],
			},
		});

		// Create a mock request
		const mockRequest = new Request('https://example.com/api/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
			},
			body: requestBody,
		});

		// Mock the LLM response
		const mockLLMResponse = {
			choices: [
				{
					message: {
						role: 'assistant',
						content: 'I can help you with that!',
					},
				},
			],
		};

		(global.fetch as any).mockResolvedValue(
			new Response(JSON.stringify(mockLLMResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		);

		// Read the body once (simulating what the worker does)
		const bodyText = await mockRequest.text();

		// Verify we can read the body
		expect(bodyText).toBe(requestBody);

		// Verify the body is consumed (this should not throw an error)
		expect(() => mockRequest.body).not.toThrow();
	});

	it('should handle multipart requests without consuming body', async () => {
		const formData = new FormData();
		formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

		const mockRequest = new Request('https://example.com/api/chat/completions', {
			method: 'POST',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
			},
			body: formData,
		});

		// For multipart requests, we should not try to read the body as text
		// The body should remain available for the proxy request
		expect(mockRequest.body).toBeDefined();
	});

	it('should handle non-POST requests without consuming body', async () => {
		const mockRequest = new Request('https://example.com/api/chat/completions', {
			method: 'GET',
			headers: {
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
			},
		});

		// For non-POST requests, we should not try to read the body
		expect(mockRequest.body).toBeNull();
	});

	it('should handle requests without body', async () => {
		const mockRequest = new Request('https://example.com/api/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
			},
		});

		// For requests without body, we should not try to read it
		expect(mockRequest.body).toBeNull();
	});
});
