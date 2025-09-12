import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAPICall } from '../src/openapi-integration';

// Mock the global fetch function
global.fetch = vi.fn();

describe('Function Calling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('executeAPICall', () => {
		it('should execute a GET request with path parameters', async () => {
			const mockResponse = new Response(JSON.stringify({ id: 1, name: 'Test Pet' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets/{petId}',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall('api_get_pets_petId', { petId: '123' }, functionMetadata);

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/pets/123',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'User-Agent': 'Form-Generator-Worker/1.0',
					}),
				})
			);

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data).toEqual({ id: 1, name: 'Test Pet' });
		});

		it('should execute a GET request with query parameters', async () => {
			const mockResponse = new Response(JSON.stringify([{ id: 1, name: 'Pet 1' }]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall(
				'api_get_pets',
				{
					query_status: 'available',
					query_limit: '10',
				},
				functionMetadata
			);

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/pets?status=available&limit=10',
				expect.objectContaining({
					method: 'GET',
				})
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual([{ id: 1, name: 'Pet 1' }]);
		});

		it('should execute a POST request with request body', async () => {
			const mockResponse = new Response(JSON.stringify({ id: 1, name: 'New Pet' }), {
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets',
				method: 'POST',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const requestBody = { name: 'New Pet', status: 'available' };
			const result = await executeAPICall(
				'api_post_pets',
				{
					request_body: requestBody,
				},
				functionMetadata
			);

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/pets',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
					}),
					body: JSON.stringify(requestBody),
				})
			);

			expect(result.success).toBe(true);
			expect(result.status).toBe(201);
		});

		it('should handle custom headers', async () => {
			const mockResponse = new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall(
				'api_get_pets',
				{
					headers: {
						Authorization: 'Bearer token123',
						'X-Custom-Header': 'custom-value',
					},
				},
				functionMetadata
			);

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/pets',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'User-Agent': 'Form-Generator-Worker/1.0',
						Authorization: 'Bearer token123',
						'X-Custom-Header': 'custom-value',
					}),
				})
			);

			expect(result.success).toBe(true);
		});

		it('should handle API errors gracefully', async () => {
			const mockResponse = new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets/{petId}',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall('api_get_pets_petId', { petId: '999' }, functionMetadata);

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.data).toEqual({ error: 'Not found' });
		});

		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const functionMetadata = {
				path: '/pets',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall('api_get_pets', {}, functionMetadata);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Network error');
		});

		it('should handle non-JSON responses', async () => {
			const mockResponse = new Response('Plain text response', {
				status: 200,
				headers: { 'Content-Type': 'text/plain' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/pets',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall('api_get_pets', {}, functionMetadata);

			expect(result.success).toBe(true);
			expect(result.data).toBe('Plain text response');
		});

		it('should handle complex path parameters', async () => {
			const mockResponse = new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});

			(global.fetch as any).mockResolvedValue(mockResponse);

			const functionMetadata = {
				path: '/users/{userId}/orders/{orderId}',
				method: 'GET',
				serverUrl: 'https://api.example.com',
				operation: {},
			};

			const result = await executeAPICall(
				'api_get_users_userId_orders_orderId',
				{
					userId: '123',
					orderId: '456',
				},
				functionMetadata
			);

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/users/123/orders/456',
				expect.objectContaining({
					method: 'GET',
				})
			);

			expect(result.success).toBe(true);
		});
	});
});
