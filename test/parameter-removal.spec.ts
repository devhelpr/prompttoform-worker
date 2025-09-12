import { describe, it, expect } from 'vitest';
import { processLLMRequestWithOpenAPI } from '../src/openapi-integration';

describe('Parameter Removal', () => {
	it('should remove useOpenAPITool parameter when processing OpenAPI tool', async () => {
		const requestBody = JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: 'Hello' }],
			useOpenAPITool: {
				useOpenAPITool: true,
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should not contain useOpenAPITool parameter
		expect(resultData.useOpenAPITool).toBeUndefined();

		// Should contain the OpenAPI function
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should remove useOpenAPITool parameter when not processing OpenAPI tool', async () => {
		const requestBody = JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: 'Hello' }],
			useOpenAPITool: {
				useOpenAPITool: false,
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should not contain useOpenAPITool parameter
		expect(resultData.useOpenAPITool).toBeUndefined();

		// Should still add the OpenAPI tool (since conditional logic is handled outside this function)
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should preserve other parameters while removing useOpenAPITool', async () => {
		const requestBody = JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: 'Hello' }],
			temperature: 0.7,
			max_tokens: 1000,
			useOpenAPITool: {
				useOpenAPITool: true,
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should preserve other parameters
		expect(resultData.model).toBe('gpt-4o-mini');
		expect(resultData.temperature).toBe(0.7);
		expect(resultData.max_tokens).toBe(1000);
		expect(resultData.messages).toHaveLength(1);

		// Should not contain useOpenAPITool parameter
		expect(resultData.useOpenAPITool).toBeUndefined();
	});

	it('should handle nested useOpenAPITool structure', async () => {
		const requestBody = JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: 'Hello' }],
			useOpenAPITool: {
				useOpenAPITool: true,
				someOtherProperty: 'should be removed with the whole object',
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should not contain useOpenAPITool parameter at all
		expect(resultData.useOpenAPITool).toBeUndefined();

		// Should contain the OpenAPI function
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should handle request without useOpenAPITool parameter', async () => {
		const requestBody = JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: 'Hello' }],
			temperature: 0.7,
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should preserve original parameters and add OpenAPI tool
		expect(resultData.model).toBe('gpt-4o-mini');
		expect(resultData.temperature).toBe(0.7);
		expect(resultData.messages).toHaveLength(1);
		expect(resultData.useOpenAPITool).toBeUndefined();
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});
});
