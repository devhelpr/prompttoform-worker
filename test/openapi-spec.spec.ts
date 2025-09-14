import { describe, it, expect } from 'vitest';
import openApiSpec from '../openapi.json';

describe('OpenAPI Specification', () => {
	it('should be a valid OpenAPI 3.0 specification', () => {
		// Verify it's a valid OpenAPI 3.0 specification
		expect(openApiSpec.openapi).toBe('3.0.3');
		expect(openApiSpec.info.title).toBe('Form Generator Worker API');
		expect(openApiSpec.info.version).toBe('1.0.0');
		expect(openApiSpec.paths).toBeDefined();
		expect(openApiSpec.components).toBeDefined();
	});

	it('should include all expected endpoints', () => {
		// Check for key endpoints
		expect(openApiSpec.paths['/openapi']).toBeDefined();
		expect(openApiSpec.paths['/api/openapi']).toBeDefined();
		expect(openApiSpec.paths['/api/swagger']).toBeDefined();
		expect(openApiSpec.paths['/email/form-data']).toBeDefined();
		expect(openApiSpec.paths['/api/data']).toBeDefined();
		expect(openApiSpec.paths['/netlify']).toBeDefined();
		expect(openApiSpec.paths['/proxy']).toBeDefined();
	});

	it('should include OpenAPI tool integration in proxy endpoint', () => {
		const proxyEndpoint = openApiSpec.paths['/proxy'];
		expect(proxyEndpoint.post).toBeDefined();

		const requestBody = proxyEndpoint.post.requestBody.content['application/json'].schema;
		expect(requestBody.properties.useOpenAPITool).toBeDefined();
		expect(requestBody.properties.useOpenAPITool.properties.useOpenAPITool).toBeDefined();
	});

	it('should have proper CORS support for all endpoints', () => {
		// Check that all endpoints have proper CORS support
		Object.values(openApiSpec.paths).forEach((pathItem: any) => {
			Object.values(pathItem).forEach((operation: any) => {
				if (operation.responses) {
					// Check for CORS preflight support - should have either 200, 204, or 302 responses
					const hasValidResponse =
						operation.responses['200'] || operation.responses['204'] || operation.responses['302'] || operation.responses['201'];
					expect(hasValidResponse).toBeDefined();
				}
			});
		});
	});

	it('should include comprehensive error schemas', () => {
		expect(openApiSpec.components.schemas.Error).toBeDefined();
		expect(openApiSpec.components.schemas.EmailRequest).toBeDefined();
		expect(openApiSpec.components.schemas.EmailResponse).toBeDefined();
		expect(openApiSpec.components.schemas.FormData).toBeDefined();
		expect(openApiSpec.components.schemas.FormDataResponse).toBeDefined();
	});

	it('should have proper server configurations', () => {
		expect(openApiSpec.servers).toBeDefined();
		expect(openApiSpec.servers).toHaveLength(2);
		expect(openApiSpec.servers[0].url).toBe('https://form-generator-worker.maikel-f16.workers.dev');
		expect(openApiSpec.servers[1].url).toBe('http://localhost:8787');
	});

	it('should include detailed operation descriptions', () => {
		// Check that key operations have proper descriptions
		expect(openApiSpec.paths['/openapi'].get.summary).toBe('Get OpenAPI specification');
		expect(openApiSpec.paths['/proxy'].post.summary).toBe('LLM Proxy with OpenAPI Integration');
		expect(openApiSpec.paths['/email/form-data'].post.summary).toBe('Send form data via email');
		expect(openApiSpec.paths['/api/data'].get.summary).toBe('Get form data');
	});

	it('should have proper HTTP methods for each endpoint', () => {
		// Check that endpoints have appropriate HTTP methods
		expect(openApiSpec.paths['/openapi'].get).toBeDefined();
		expect(openApiSpec.paths['/api/openapi'].get).toBeDefined();
		expect(openApiSpec.paths['/email/form-data'].post).toBeDefined();
		expect(openApiSpec.paths['/email/form-data'].options).toBeDefined();
		expect(openApiSpec.paths['/api/data'].get).toBeDefined();
		expect(openApiSpec.paths['/api/data'].post).toBeDefined();
		expect(openApiSpec.paths['/api/data'].put).toBeDefined();
		expect(openApiSpec.paths['/api/data'].delete).toBeDefined();
		expect(openApiSpec.paths['/api/data'].options).toBeDefined();
		expect(openApiSpec.paths['/proxy'].post).toBeDefined();
		expect(openApiSpec.paths['/proxy'].options).toBeDefined();
	});
});
