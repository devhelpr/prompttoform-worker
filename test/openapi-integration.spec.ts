import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processLLMRequestWithOpenAPI, hasOpenAPIToolConfig } from '../src/openapi-integration';

// Mock the global fetch function
global.fetch = vi.fn();

describe('OpenAPI Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('hasOpenAPIToolConfig', () => {
		it('should detect OpenAPI tool config in request body', () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			expect(hasOpenAPIToolConfig(requestBody)).toBe(true);
		});

		it('should return false when useOpenAPITool is not present', () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
			});

			expect(hasOpenAPIToolConfig(requestBody)).toBe(false);
		});

		it('should return false when useOpenAPITool is false', () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: false,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			expect(hasOpenAPIToolConfig(requestBody)).toBe(false);
		});

		it('should handle invalid JSON gracefully', () => {
			const requestBody = 'invalid json';

			expect(hasOpenAPIToolConfig(requestBody)).toBe(false);
		});
	});

	describe('processLLMRequestWithOpenAPI', () => {
		it('should return original body when useOpenAPITool is not present', async () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);

			expect(result).toBe(requestBody);
		});

		it('should return original body when useOpenAPITool is false', async () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: false,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);

			expect(result).toBe(requestBody);
		});

		it('should process request with OpenAPI tool integration', async () => {
			const mockOpenAPISpec = {
				openapi: '3.0.0',
				info: {
					title: 'Test API',
					version: '1.0.0',
					description: 'A test API',
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

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.useOpenAPITool).toBeUndefined(); // Should be removed
			expect(resultData.tools).toBeDefined();
			expect(resultData.tools).toHaveLength(1);
			expect(resultData.tools[0].type).toBe('function');
			expect(resultData.tools[0].function.name).toBe('get_openapi_specification');
			expect(resultData.messages).toHaveLength(2); // Original + system message
			expect(resultData.messages[0].role).toBe('system');
			expect(resultData.messages[0].content).toContain('Test API');
		});

		it('should handle multiple OpenAPI URLs', async () => {
			const mockOpenAPISpec1 = {
				openapi: '3.0.0',
				info: { title: 'API 1', version: '1.0.0' },
				paths: { '/users': {} },
			};

			const mockOpenAPISpec2 = {
				swagger: '2.0',
				info: { title: 'API 2', version: '2.0.0' },
				paths: { '/orders': {} },
			};

			(global.fetch as any)
				.mockResolvedValueOnce(
					new Response(JSON.stringify(mockOpenAPISpec1), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					})
				)
				.mockResolvedValueOnce(
					new Response(JSON.stringify(mockOpenAPISpec2), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					})
				);

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api1.example.com/openapi.json', 'https://api2.example.com/swagger.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toHaveLength(2);
			expect(resultData.messages).toHaveLength(3); // Original + 2 system messages
		});

		it('should handle invalid OpenAPI specifications gracefully', async () => {
			const invalidSpec = { notOpenAPI: true };

			const mockResponse = new Response(JSON.stringify(invalidSpec), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/invalid.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toBeUndefined();
			expect(resultData.messages).toHaveLength(1); // Only original message
		});

		it('should handle network errors gracefully', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toBeUndefined();
			expect(resultData.messages).toHaveLength(1); // Only original message
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
			`;

			const mockResponse = new Response(yamlContent, {
				status: 200,
				headers: {
					'Content-Type': 'application/yaml',
				},
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.yaml'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toBeUndefined(); // YAML content is not valid OpenAPI spec
			expect(resultData.messages).toHaveLength(1); // Only original message
		});

		it('should preserve existing tools array', async () => {
			const mockOpenAPISpec = {
				openapi: '3.0.0',
				info: { title: 'Test API', version: '1.0.0' },
				paths: { '/users': {} },
			};

			const mockResponse = new Response(JSON.stringify(mockOpenAPISpec), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [
					{
						type: 'function',
						function: {
							name: 'existing_tool',
							description: 'An existing tool',
						},
					},
				],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toHaveLength(2);
			expect(resultData.tools[0].function.name).toBe('existing_tool');
			expect(resultData.tools[1].function.name).toBe('get_openapi_specification');
		});

		it('should handle malformed JSON gracefully', async () => {
			const requestBody = 'invalid json';

			const result = await processLLMRequestWithOpenAPI(requestBody);

			expect(result).toBe(requestBody);
		});
	});
});
