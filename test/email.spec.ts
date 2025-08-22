import { describe, it, expect, vi } from 'vitest';
import { handleEmailFormData } from '../src/email';

// Mock environment variables
const mockEnv = {
	MAILRELAY_API_KEY: 'test-api-key',
	MAILRELAY_DOMAIN: 'test.mailrelay.com',
} as any;

// Mock fetch
global.fetch = vi.fn();

describe('Email Form Data Handler', () => {
	it('should handle valid email request', async () => {
		const mockResponse = {
			ok: true,
			json: () => Promise.resolve({ messageId: 'test-message-id' }),
		};
		(fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('http://localhost/email/form-data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: 'test@example.com',
				subject: 'Test Subject',
				formData: {
					name: 'Test User',
					email: 'user@example.com',
				},
			}),
		});

		const response = await handleEmailFormData(request, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.success).toBe(true);
		expect(result.message).toBe('Email sent successfully');
		expect(result.messageId).toBe('test-message-id');
	});

	it('should handle missing required fields', async () => {
		const request = new Request('http://localhost/email/form-data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				subject: 'Test Subject',
				// Missing 'to' and 'formData'
			}),
		});

		const response = await handleEmailFormData(request, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(400);
		expect(result.success).toBe(false);
		expect(result.message).toBe('Missing required fields: to and formData');
	});

	it('should handle invalid email format', async () => {
		const request = new Request('http://localhost/email/form-data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: 'invalid-email',
				formData: {
					name: 'Test User',
				},
			}),
		});

		const response = await handleEmailFormData(request, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(400);
		expect(result.success).toBe(false);
		expect(result.message).toBe('Invalid email format');
	});

	it('should handle missing email configuration', async () => {
		const request = new Request('http://localhost/email/form-data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: 'test@example.com',
				formData: {
					name: 'Test User',
				},
			}),
		});

		const response = await handleEmailFormData(request, {} as any);
		const result = await response.json();

		expect(response.status).toBe(500);
		expect(result.success).toBe(false);
		expect(result.message).toBe('Email service not configured');
	});

	it('should handle Mailrelay API errors', async () => {
		const mockResponse = {
			ok: false,
			status: 500,
			text: () => Promise.resolve('Internal server error'),
		};
		(fetch as any).mockResolvedValue(mockResponse);

		const request = new Request('http://localhost/email/form-data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: 'test@example.com',
				formData: {
					name: 'Test User',
				},
			}),
		});

		const response = await handleEmailFormData(request, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(500);
		expect(result.success).toBe(false);
		expect(result.message).toBe('Failed to send email');
		expect(result.error).toContain('Mailrelay API error: 500');
	});

	it('should handle OPTIONS request for CORS', async () => {
		const request = new Request('http://localhost/email/form-data', {
			method: 'OPTIONS',
		});

		const response = await handleEmailFormData(request, mockEnv);

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
	});

	it('should handle non-POST requests', async () => {
		const request = new Request('http://localhost/email/form-data', {
			method: 'GET',
		});

		const response = await handleEmailFormData(request, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(405);
		expect(result.success).toBe(false);
		expect(result.message).toBe('Method not allowed');
	});
});
