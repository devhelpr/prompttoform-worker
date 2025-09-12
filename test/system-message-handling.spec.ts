import { describe, it, expect } from 'vitest';
import { processLLMRequestWithOpenAPI } from '../src/openapi-integration';

describe('System Message Handling', () => {
	it('should preserve existing system message without modification', async () => {
		const requestBody = JSON.stringify({
			messages: [
				{
					role: 'system',
					content: 'You are a specialized API documentation assistant.',
				},
				{
					role: 'user',
					content: 'Hello',
				},
			],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		expect(resultData.messages).toHaveLength(2);
		expect(resultData.messages[0].role).toBe('system');
		expect(resultData.messages[0].content).toBe('You are a specialized API documentation assistant.');
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should not create system message when none exists', async () => {
		const requestBody = JSON.stringify({
			messages: [
				{
					role: 'user',
					content: 'Hello',
				},
			],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		expect(resultData.messages).toHaveLength(1);
		expect(resultData.messages[0].role).toBe('user');
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should preserve multiple system messages without modification', async () => {
		const requestBody = JSON.stringify({
			messages: [
				{
					role: 'system',
					content: 'You are a specialized API documentation assistant.',
				},
				{
					role: 'system',
					content: 'Always be helpful and accurate.',
				},
				{
					role: 'user',
					content: 'Hello',
				},
			],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		expect(resultData.messages).toHaveLength(3);
		expect(resultData.messages[0].role).toBe('system');
		expect(resultData.messages[0].content).toBe('You are a specialized API documentation assistant.');
		expect(resultData.messages[1].content).toBe('Always be helpful and accurate.');
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should not modify messages when useOpenAPITool is false', async () => {
		const requestBody = JSON.stringify({
			messages: [
				{
					role: 'system',
					content: 'You are a specialized API documentation assistant.',
				},
				{
					role: 'user',
					content: 'Hello',
				},
			],
			useOpenAPITool: {
				useOpenAPITool: false,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		// Should remove useOpenAPITool parameter
		expect(resultData.useOpenAPITool).toBeUndefined();
		// Should preserve messages exactly
		expect(resultData.messages).toHaveLength(2);
		expect(resultData.messages[0].role).toBe('system');
		expect(resultData.messages[0].content).toBe('You are a specialized API documentation assistant.');
		expect(resultData.messages[1].role).toBe('user');
		expect(resultData.messages[1].content).toBe('Hello');
		// Should not add any tools
		expect(resultData.tools).toBeUndefined();
	});

	it('should preserve the original system message content exactly', async () => {
		const originalSystemMessage = 'You are a specialized API documentation assistant. Always provide accurate and helpful information.';
		const requestBody = JSON.stringify({
			messages: [
				{
					role: 'system',
					content: originalSystemMessage,
				},
				{
					role: 'user',
					content: 'Hello',
				},
			],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		expect(resultData.messages[0].content).toBe(originalSystemMessage);
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});

	it('should handle empty messages array', async () => {
		const requestBody = JSON.stringify({
			messages: [],
			useOpenAPITool: {
				useOpenAPITool: true,
				openApiUrls: ['https://api.example.com/openapi.json'],
			},
		});

		const result = await processLLMRequestWithOpenAPI(requestBody);
		const resultData = JSON.parse(result);

		expect(resultData.messages).toHaveLength(0);
		expect(resultData.tools).toHaveLength(1);
		expect(resultData.tools[0].function.name).toBe('get_openapi_documentation');
	});
});
