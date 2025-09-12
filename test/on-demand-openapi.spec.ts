import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processLLMRequestWithOpenAPI, executeAPICall } from '../src/openapi-integration';

// Mock the global fetch function
global.fetch = vi.fn();

describe('On-Demand OpenAPI Documentation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('processLLMRequestWithOpenAPI', () => {
		it('should add get_openapi_documentation function when useOpenAPITool is true', async () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: true,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			expect(resultData.tools).toHaveLength(1);
			expect(resultData.tools[0].type).toBe('function');
			expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
			expect(resultData.tools[0].function.description).toContain('Fetch OpenAPI/Swagger documentation');
			expect(resultData.tools[0].function.parameters.required).toContain('url');
			expect(resultData.messages).toHaveLength(1); // Original message only
			expect(resultData.messages[0].role).toBe('user');
		});

		it('should not add function when useOpenAPITool is false', async () => {
			const requestBody = JSON.stringify({
				messages: [{ role: 'user', content: 'Hello' }],
				useOpenAPITool: {
					useOpenAPITool: false,
					openApiUrls: ['https://api.example.com/openapi.json'],
				},
			});

			const result = await processLLMRequestWithOpenAPI(requestBody);
			const resultData = JSON.parse(result);

			// Should remove useOpenAPITool parameter
			expect(resultData.useOpenAPITool).toBeUndefined();
			// Should not add any tools
			expect(resultData.tools).toBeUndefined();
			// Should preserve other data
			expect(resultData.messages).toHaveLength(1);
			expect(resultData.messages[0].role).toBe('user');
		});

		it('should preserve existing tools when adding OpenAPI function', async () => {
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
			expect(resultData.tools[1].function.name).toBe('get_openapi_documentation');
		});
	});

	describe('executeAPICall', () => {
		it('should fetch and return OpenAPI specification in JSON format', async () => {
			const mockOpenAPISpec = {
				openapi: '3.0.0',
				info: {
					title: 'Test API',
					version: '1.0.0',
					description: 'A test API',
				},
				paths: {
					'/pets': {
						get: {
							summary: 'Get pets',
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
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/openapi.json',
				format: 'json',
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/openapi.json',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Accept: 'application/json, application/yaml, text/yaml, */*',
						'User-Agent': 'Form-Generator-Worker/1.0',
					}),
				})
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockOpenAPISpec);
			expect(result.format).toBe('json');
			expect(result.summary.title).toBe('Test API');
			expect(result.summary.version).toBe('1.0.0');
		});

		it('should handle YAML format requests', async () => {
			const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /pets:
    get:
      summary: Get pets
			`;

			const mockResponse = new Response(yamlContent, {
				status: 200,
				headers: { 'Content-Type': 'application/yaml' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/openapi.yaml',
				format: 'yaml',
			});

			expect(result.success).toBe(true);
			expect(result.format).toBe('yaml');
			expect(result.data.content).toBe(yamlContent);
			expect(result.data.contentType).toBe('yaml');
		});

		it('should return error for invalid URL', async () => {
			const result = await executeAPICall('get_openapi_documentation', {
				url: 'invalid-url',
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid URL format');
		});

		it('should return error for missing URL', async () => {
			const result = await executeAPICall('get_openapi_documentation', {});

			expect(result.success).toBe(false);
			expect(result.error).toBe('URL parameter is required');
		});

		it('should handle HTTP errors', async () => {
			const mockResponse = new Response('Not Found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/notfound.json',
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Failed to fetch OpenAPI specification: HTTP 404');
		});

		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/openapi.json',
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Network error');
		});

		it('should validate OpenAPI specification', async () => {
			const invalidSpec = { notOpenAPI: true };

			const mockResponse = new Response(JSON.stringify(invalidSpec), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/invalid.json',
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not contain a valid OpenAPI');
		});

		it('should handle Swagger 2.x specifications', async () => {
			const swaggerSpec = {
				swagger: '2.0',
				info: {
					title: 'Test API',
					version: '1.0.0',
				},
				paths: {
					'/pets': {
						get: {
							summary: 'Get pets',
						},
					},
				},
			};

			const mockResponse = new Response(JSON.stringify(swaggerSpec), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await executeAPICall('get_openapi_documentation', {
				url: 'https://api.example.com/swagger.json',
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(swaggerSpec);
		});

		it('should handle unknown function names', async () => {
			const result = await executeAPICall('unknown_function', {});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unknown function: unknown_function');
		});
	});
});
