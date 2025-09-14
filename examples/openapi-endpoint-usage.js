/**
 * Example: Using the /openapi endpoint
 *
 * This example shows how to access the OpenAPI specification
 * for the Form Generator Worker API.
 */

// Example 1: Get the OpenAPI specification
async function getOpenAPISpec() {
	try {
		const response = await fetch('https://form-generator-worker.maikel-f16.workers.dev/openapi');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const spec = await response.json();
		console.log('OpenAPI Specification:', spec);
		return spec;
	} catch (error) {
		console.error('Error fetching OpenAPI spec:', error);
	}
}

// Example 2: Check if the API supports OpenAPI tool integration
async function checkOpenAPIToolSupport() {
	try {
		const spec = await getOpenAPISpec();

		const proxyEndpoint = spec.paths['/proxy'];
		const hasOpenAPITool = proxyEndpoint.post.requestBody.content['application/json'].schema.properties.useOpenAPITool;

		console.log('OpenAPI Tool Integration Supported:', !!hasOpenAPITool);
		return !!hasOpenAPITool;
	} catch (error) {
		console.error('Error checking OpenAPI tool support:', error);
		return false;
	}
}

// Example 3: Get available endpoints
async function getAvailableEndpoints() {
	try {
		const spec = await getOpenAPISpec();

		const endpoints = Object.keys(spec.paths).map((path) => {
			const methods = Object.keys(spec.paths[path]);
			return {
				path,
				methods: methods.filter((method) => method !== 'parameters'),
			};
		});

		console.log('Available Endpoints:', endpoints);
		return endpoints;
	} catch (error) {
		console.error('Error getting endpoints:', error);
		return [];
	}
}

// Example 4: Get endpoint details
async function getEndpointDetails(path) {
	try {
		const spec = await getOpenAPISpec();

		if (!spec.paths[path]) {
			throw new Error(`Endpoint ${path} not found`);
		}

		const endpoint = spec.paths[path];
		const details = {};

		Object.keys(endpoint).forEach((method) => {
			if (method !== 'parameters') {
				details[method] = {
					summary: endpoint[method].summary,
					description: endpoint[method].description,
					parameters: endpoint[method].parameters || [],
					responses: Object.keys(endpoint[method].responses || {}),
				};
			}
		});

		console.log(`Endpoint Details for ${path}:`, details);
		return details;
	} catch (error) {
		console.error(`Error getting details for ${path}:`, error);
		return null;
	}
}

// Example 5: Validate API request against OpenAPI spec
async function validateRequest(endpoint, method, requestData) {
	try {
		const spec = await getOpenAPISpec();

		if (!spec.paths[endpoint] || !spec.paths[endpoint][method]) {
			throw new Error(`Endpoint ${method.toUpperCase()} ${endpoint} not found`);
		}

		const operation = spec.paths[endpoint][method];
		const schema = operation.requestBody?.content?.['application/json']?.schema;

		if (schema) {
			// Basic validation - in a real implementation, you'd use a JSON schema validator
			console.log('Request schema found:', schema);
			console.log('Required fields:', schema.required || []);
			console.log('Request data:', requestData);

			// Check if required fields are present
			if (schema.required) {
				const missingFields = schema.required.filter((field) => !(field in requestData));
				if (missingFields.length > 0) {
					throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
				}
			}
		}

		console.log('Request validation passed');
		return true;
	} catch (error) {
		console.error('Request validation failed:', error);
		return false;
	}
}

// Example 6: Generate API client code
async function generateAPIClient() {
	try {
		const spec = await getOpenAPISpec();

		console.log('// Generated API Client');
		console.log('class FormGeneratorAPI {');
		console.log('  constructor(baseUrl = "https://form-generator-worker.maikel-f16.workers.dev") {');
		console.log('    this.baseUrl = baseUrl;');
		console.log('  }');
		console.log('');

		Object.keys(spec.paths).forEach((path) => {
			Object.keys(spec.paths[path]).forEach((method) => {
				if (method !== 'parameters') {
					const operation = spec.paths[path][method];
					const methodName = operation.operationId || `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`;

					console.log(`  async ${methodName}() {`);
					console.log(`    const response = await fetch(\`\${this.baseUrl}${path}\`, {`);
					console.log(`      method: '${method.toUpperCase()}'`);
					console.log(`    });`);
					console.log(`    return response.json();`);
					console.log(`  }`);
					console.log('');
				}
			});
		});

		console.log('}');
	} catch (error) {
		console.error('Error generating API client:', error);
	}
}

// Example usage
console.log('OpenAPI Endpoint Usage Examples:');
console.log('================================');

// Run examples
getOpenAPISpec()
	.then(() => checkOpenAPIToolSupport())
	.then(() => getAvailableEndpoints())
	.then(() => getEndpointDetails('/proxy'))
	.then(() => validateRequest('/email/form-data', 'post', { to: 'test@example.com', formData: {} }))
	.then(() => generateAPIClient())
	.catch(console.error);

console.log('\nHow to use:');
console.log('1. GET /openapi - Returns the complete OpenAPI specification');
console.log('2. No authentication required');
console.log('3. CORS enabled for all origins');
console.log('4. Available at: https://form-generator-worker.maikel-f16.workers.dev/openapi');
