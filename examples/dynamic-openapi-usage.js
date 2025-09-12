/**
 * Example: Dynamic OpenAPI URL Extraction
 *
 * This example shows how the LLM can extract OpenAPI URLs from user messages
 * and call the get_openapi_documentation function dynamically.
 */

// Example 1: Simple OpenAPI tool activation
const simpleRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'user',
			content: 'Can you help me understand the API at https://api.example.com/openapi.json? I need to know what endpoints are available.',
		},
	],
	useOpenAPITool: {
		useOpenAPITool: true,
	},
};

// Example 2: Multiple URLs in conversation
const multipleUrlsRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'user',
			content:
				'I have two APIs I need to understand:\n1. https://api.service1.com/swagger.json\n2. https://api.service2.com/openapi.yaml\nCan you help me compare their endpoints?',
		},
	],
	useOpenAPITool: {
		useOpenAPITool: true,
	},
};

// Example 3: Contextual URL extraction
const contextualRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'system',
			content: 'You are an API documentation expert. Help users understand APIs by fetching their OpenAPI specifications.',
		},
		{
			role: 'user',
			content:
				"I'm working with a payment API. The documentation is at https://payments.example.com/api-docs/openapi.json. What payment methods does it support?",
		},
	],
	useOpenAPITool: {
		useOpenAPITool: true,
	},
};

// Example 4: YAML format request
const yamlRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'user',
			content: 'Please analyze this API specification: https://api.example.com/swagger.yaml',
		},
	],
	useOpenAPITool: {
		useOpenAPITool: true,
	},
};

// Example 5: No OpenAPI tool (disabled)
const disabledRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'user',
			content: 'Just a regular conversation, no API analysis needed.',
		},
	],
	useOpenAPITool: {
		useOpenAPITool: false,
	},
};

// Example 6: Complex conversation with mixed content
const complexRequest = {
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'system',
			content: 'You are a helpful assistant that can analyze APIs and answer general questions.',
		},
		{
			role: 'user',
			content:
				"Hi! I need help with two things:\n1. What's the weather like today?\n2. Can you analyze this API: https://weather-api.example.com/openapi.json",
		},
	],
	useOpenAPITool: {
		useOpenAPITool: true,
	},
};

console.log('Dynamic OpenAPI Usage Examples:');
console.log('================================');

console.log('\n1. Simple URL extraction:');
console.log(JSON.stringify(simpleRequest, null, 2));

console.log('\n2. Multiple URLs:');
console.log(JSON.stringify(multipleUrlsRequest, null, 2));

console.log('\n3. Contextual extraction:');
console.log(JSON.stringify(contextualRequest, null, 2));

console.log('\n4. YAML format:');
console.log(JSON.stringify(yamlRequest, null, 2));

console.log('\n5. Disabled tool:');
console.log(JSON.stringify(disabledRequest, null, 2));

console.log('\n6. Complex conversation:');
console.log(JSON.stringify(complexRequest, null, 2));

console.log('\nHow it works:');
console.log('- The LLM receives the get_openapi_documentation function');
console.log('- It analyzes the user message for OpenAPI/Swagger URLs');
console.log('- It calls the function with the extracted URL(s)');
console.log('- The worker fetches the specification and returns it to the LLM');
console.log('- The LLM can then provide detailed API analysis based on the spec');
