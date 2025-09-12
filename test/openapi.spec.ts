import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOpenAPIRequest } from '../src/openapi';

// Mock the global fetch function
global.fetch = vi.fn();

describe('OpenAPI Handler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle CORS preflight requests', async () => {
		const request = new Request('https://example.com/api/openapi', {
			method: 'OPTIONS',
		});

		const response = await handleOpenAPIRequest(request, {} as any);

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
	});

	it('should reject non-GET requests', async () => {
		const request = new Request('https://example.com/api/openapi', {
			method: 'POST',
		});

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(405);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Only GET requests are allowed');
	});

	it('should return error when URL parameter is missing', async () => {
		const request = new Request('https://example.com/api/openapi');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Missing required parameter: url');
	});

	it('should return error for invalid URL format', async () => {
		const request = new Request('https://example.com/api/openapi?url=invalid-url');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Invalid URL format');
	});

	it('should successfully fetch and return OpenAPI specification', async () => {
		const mockOpenAPISpec = {
			openapi: '3.0.0',
			info: {
				title: 'Test API',
				version: '1.0.0',
			},
			paths: {
				'/users': {
					get: {
						summary: 'Get users',
						responses: {
							'200': {
								description: 'Success',
							},
						},
					},
				},
			},
		};

		const mockResponse = new Response(JSON.stringify(mockOpenAPISpec), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		(global.fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/openapi.json');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data).toEqual(mockOpenAPISpec);
		expect(body.url).toBe('https://api.example.com/openapi.json');
	});

	it('should handle Swagger 2.x specifications', async () => {
		const mockSwaggerSpec = {
			swagger: '2.0',
			info: {
				title: 'Test API',
				version: '1.0.0',
			},
			paths: {
				'/users': {
					get: {
						summary: 'Get users',
						responses: {
							'200': {
								description: 'Success',
							},
						},
					},
				},
			},
		};

		const mockResponse = new Response(JSON.stringify(mockSwaggerSpec), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		(global.fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/swagger.json');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data).toEqual(mockSwaggerSpec);
	});

	it('should return error for invalid OpenAPI specification', async () => {
		const invalidSpec = {
			notOpenAPI: true,
			someOtherData: 'value',
		};

		const mockResponse = new Response(JSON.stringify(invalidSpec), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		(global.fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/invalid.json');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Invalid OpenAPI/Swagger specification');
	});

	it('should handle network errors', async () => {
		(global.fetch as any).mockRejectedValue(new Error('Network error'));

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/openapi.json');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(502);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Network error');
	});

	it('should handle timeout errors', async () => {
		const timeoutError = new Error('Request timeout');
		timeoutError.name = 'AbortError';
		(global.fetch as any).mockRejectedValue(timeoutError);

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/openapi.json');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(408);
		expect(body.success).toBe(false);
		expect(body.error).toContain('Request timeout');
	});

	it('should handle YAML content', async () => {
		const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success
		`;

		const mockResponse = new Response(yamlContent, {
			status: 200,
			headers: {
				'Content-Type': 'application/yaml',
			},
		});

		(global.fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('https://example.com/api/openapi?url=https://api.example.com/openapi.yaml');

		const response = await handleOpenAPIRequest(request, {} as any);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.contentType).toBe('yaml');
		expect(body.data).toBe(yamlContent);
	});
});
