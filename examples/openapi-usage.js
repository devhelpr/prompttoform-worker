/**
 * Example usage of the OpenAPI/Swagger tool
 *
 * This demonstrates how to use the new OpenAPI/Swagger fetching functionality
 * that can be called by LLMs to retrieve API specifications.
 */

// Example 1: Fetch OpenAPI 3.x specification
async function fetchOpenAPISpec() {
	const response = await fetch('https://your-worker-domain.com/api/openapi?url=https://petstore3.swagger.io/api/v3/openapi.json');
	const data = await response.json();

	if (data.success) {
		console.log('OpenAPI Specification:', data.data);
		console.log('API Title:', data.data.info.title);
		console.log('API Version:', data.data.info.version);
		console.log('Available Endpoints:', Object.keys(data.data.paths));
	} else {
		console.error('Error:', data.error);
	}
}

// Example 2: Fetch Swagger 2.x specification
async function fetchSwaggerSpec() {
	const response = await fetch('https://your-worker-domain.com/api/swagger?url=https://petstore.swagger.io/v2/swagger.json');
	const data = await response.json();

	if (data.success) {
		console.log('Swagger Specification:', data.data);
		console.log('API Title:', data.data.info.title);
		console.log('API Version:', data.data.info.version);
		console.log('Available Endpoints:', Object.keys(data.data.paths));
	} else {
		console.error('Error:', data.error);
	}
}

// Example 3: Handle YAML content
async function fetchYAMLSpec() {
	const response = await fetch('https://your-worker-domain.com/api/openapi?url=https://api.example.com/openapi.yaml');
	const data = await response.json();

	if (data.success) {
		if (data.contentType === 'yaml') {
			console.log('YAML Content:', data.data);
			console.log('Note: YAML content is returned as text. Consider converting to JSON for better parsing.');
		} else {
			console.log('JSON Specification:', data.data);
		}
	} else {
		console.error('Error:', data.error);
	}
}

// Example 4: Error handling
async function handleErrors() {
	try {
		const response = await fetch('https://your-worker-domain.com/api/openapi?url=https://invalid-url.com/spec.json');
		const data = await response.json();

		if (!data.success) {
			console.error('API Error:', data.error);
			console.error('Message:', data.message);
		}
	} catch (error) {
		console.error('Network Error:', error.message);
	}
}

// Example 5: LLM Integration
// This is how an LLM might use this tool to understand an API
async function llmAPIAnalysis(apiUrl) {
	const response = await fetch(`https://your-worker-domain.com/api/openapi?url=${encodeURIComponent(apiUrl)}`);
	const data = await response.json();

	if (data.success) {
		const spec = data.data;

		// Extract useful information for LLM
		const apiInfo = {
			title: spec.info?.title || 'Unknown API',
			version: spec.info?.version || 'Unknown Version',
			description: spec.info?.description || 'No description available',
			endpoints: Object.keys(spec.paths || {}),
			methods: new Set(),
			parameters: new Set(),
		};

		// Analyze endpoints and methods
		Object.entries(spec.paths || {}).forEach(([path, methods]) => {
			Object.keys(methods).forEach((method) => {
				if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
					apiInfo.methods.add(method.toUpperCase());
				}
			});
		});

		// Convert Set to Array for JSON serialization
		apiInfo.methods = Array.from(apiInfo.methods);
		apiInfo.parameters = Array.from(apiInfo.parameters);

		return {
			success: true,
			apiInfo,
			fullSpec: spec,
		};
	} else {
		return {
			success: false,
			error: data.error,
		};
	}
}

// Export functions for use in other modules
export { fetchOpenAPISpec, fetchSwaggerSpec, fetchYAMLSpec, handleErrors, llmAPIAnalysis };

// Example usage (uncomment to test)
// fetchOpenAPISpec();
// fetchSwaggerSpec();
// llmAPIAnalysis('https://petstore3.swagger.io/api/v3/openapi.json');
