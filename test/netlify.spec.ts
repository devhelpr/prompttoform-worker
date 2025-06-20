// test/netlify.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Netlify OAuth endpoint', () => {
	it('should redirect to demo.codeflowcanvas.io on successful OAuth', async () => {
		// Mock the environment variables
		const mockEnv = {
			...env,
			NETLIFY_CLIENT_ID: 'test-client-id',
			NETLIFY_CLIENT_SECRET: 'test-client-secret',
			NETLIFY_REDIRECT_URI: 'https://your-worker.your-subdomain.workers.dev/netlify/auth',
			WRANGLER_ENV: 'dev',
		} as unknown as Env;

		// Create a request with authorization code
		const request = new IncomingRequest('https://your-worker.your-subdomain.workers.dev/netlify/auth?code=test-auth-code&state=test-state');

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv);
		await waitOnExecutionContext(ctx);

		// Check that the response is a redirect
		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toContain('https://demo.codeflowcanvas.io');
		expect(response.headers.get('Location')).toContain('auth=success');
		expect(response.headers.get('Location')).toContain('provider=netlify');
		expect(response.headers.get('Location')).toContain('state=test-state');
	});

	it('should handle OAuth errors', async () => {
		const mockEnv = {
			...env,
			NETLIFY_CLIENT_ID: 'test-client-id',
			NETLIFY_CLIENT_SECRET: 'test-client-secret',
			NETLIFY_REDIRECT_URI: 'https://your-worker.your-subdomain.workers.dev/netlify/auth',
			WRANGLER_ENV: 'dev',
		} as unknown as Env;

		// Create a request with an error parameter
		const request = new IncomingRequest('https://your-worker.your-subdomain.workers.dev/netlify/auth?error=access_denied');

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv);
		await waitOnExecutionContext(ctx);

		// Check that the response indicates an error
		expect(response.status).toBe(400);
		expect(await response.text()).toContain('OAuth Error: access_denied');
	});

	it('should handle missing authorization code', async () => {
		const mockEnv = {
			...env,
			NETLIFY_CLIENT_ID: 'test-client-id',
			NETLIFY_CLIENT_SECRET: 'test-client-secret',
			NETLIFY_REDIRECT_URI: 'https://your-worker.your-subdomain.workers.dev/netlify/auth',
			WRANGLER_ENV: 'dev',
		} as unknown as Env;

		// Create a request without authorization code
		const request = new IncomingRequest('https://your-worker.your-subdomain.workers.dev/netlify/auth');

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv);
		await waitOnExecutionContext(ctx);

		// Check that the response indicates missing code
		expect(response.status).toBe(400);
		expect(await response.text()).toContain('Missing authorization code');
	});

	it('should handle token exchange failures', async () => {
		const mockEnv = {
			...env,
			NETLIFY_CLIENT_ID: 'test-client-id',
			NETLIFY_CLIENT_SECRET: 'test-client-secret',
			NETLIFY_REDIRECT_URI: 'https://your-worker.your-subdomain.workers.dev/netlify/auth',
			WRANGLER_ENV: 'dev',
		} as unknown as Env;

		// Create a request with authorization code
		const request = new IncomingRequest('https://your-worker.your-subdomain.workers.dev/netlify/auth?code=invalid-code');

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv);
		await waitOnExecutionContext(ctx);

		// Check that the response is a redirect with error
		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toContain('https://demo.codeflowcanvas.io');
		expect(response.headers.get('Location')).toContain('auth=error');
		expect(response.headers.get('Location')).toContain('error=token_exchange_failed');
	});
});
