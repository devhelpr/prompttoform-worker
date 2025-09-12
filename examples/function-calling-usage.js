/**
 * Example usage of OpenAPI Function Calling
 *
 * This demonstrates how to use the OpenAPI function calling feature
 * where the LLM can actually call API endpoints based on OpenAPI specifications.
 */

// Example 1: Basic function calling setup
async function basicFunctionCalling() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'Get me a list of users from the API',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: ['https://petstore3.swagger.io/api/v3/openapi.json'],
		},
	};

	const response = await fetch('https://your-worker-domain.com/api/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-url': 'https://api.openai.com/v1',
			'api-path': 'chat/completions',
			Authorization: 'Bearer YOUR_OPENAI_API_KEY',
		},
		body: JSON.stringify(requestBody),
	});

	const data = await response.json();
	console.log('LLM Response:', data);
}

// Example 2: Multiple API specifications
async function multipleAPIs() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'I need to get user data from the user service and then create an order in the order service',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: ['https://user-service.example.com/openapi.json', 'https://order-service.example.com/openapi.json'],
		},
	};

	const response = await fetch('https://your-worker-domain.com/api/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-url': 'https://api.openai.com/v1',
			'api-path': 'chat/completions',
			Authorization: 'Bearer YOUR_OPENAI_API_KEY',
		},
		body: JSON.stringify(requestBody),
	});

	const data = await response.json();
	console.log('LLM Response with multiple APIs:', data);
}

// Example 3: Custom API with authentication
async function authenticatedAPICall() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'Get my profile information and then update my email to newemail@example.com',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: ['https://api.example.com/openapi.json'],
		},
	};

	const response = await fetch('https://your-worker-domain.com/api/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-url': 'https://api.openai.com/v1',
			'api-path': 'chat/completions',
			Authorization: 'Bearer YOUR_OPENAI_API_KEY',
		},
		body: JSON.stringify(requestBody),
	});

	const data = await response.json();
	console.log('Authenticated API call response:', data);
}

// Example 4: Error handling
async function errorHandling() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'Try to get data from a non-existent endpoint',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: ['https://petstore3.swagger.io/api/v3/openapi.json'],
		},
	};

	try {
		const response = await fetch('https://your-worker-domain.com/api/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-url': 'https://api.openai.com/v1',
				'api-path': 'chat/completions',
				Authorization: 'Bearer YOUR_OPENAI_API_KEY',
			},
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();
		console.log('Error handling response:', data);
	} catch (error) {
		console.error('Request failed:', error);
	}
}

// Example 5: Complex workflow
async function complexWorkflow() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: `I need to:
				1. Get all available pets from the store
				2. Find a pet with status "available"
				3. Create an order for that pet
				4. Get the order details
					
				Please help me with this workflow.`,
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: ['https://petstore3.swagger.io/api/v3/openapi.json'],
		},
	};

	const response = await fetch('https://your-worker-domain.com/api/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-url': 'https://api.openai.com/v1',
			'api-path': 'chat/completions',
			Authorization: 'Bearer YOUR_OPENAI_API_KEY',
		},
		body: JSON.stringify(requestBody),
	});

	const data = await response.json();
	console.log('Complex workflow response:', data);
}

// Example 6: How the function calling works internally
function explainFunctionCalling() {
	console.log(`
OpenAPI Function Calling Flow:

1. Client sends request with useOpenAPITool: true
2. Worker fetches OpenAPI specification from provided URLs
3. Worker creates function definitions for each API endpoint
4. Worker adds these functions to the LLM request
5. LLM receives the request with available functions
6. LLM decides to call a function and returns tool_calls
7. Worker intercepts the response and executes the API calls
8. Worker sends the API results back to the LLM
9. LLM processes the results and returns final response

Example function definition created:
{
  "type": "function",
  "function": {
    "name": "api_get_pets",
    "description": "List all pets",
    "parameters": {
      "type": "object",
      "properties": {
        "query_status": {
          "type": "string",
          "description": "Query parameter: status"
        },
        "headers": {
          "type": "object",
          "description": "Additional headers to include in the request"
        }
      }
    },
    "metadata": {
      "path": "/pets",
      "method": "GET",
      "serverUrl": "https://petstore3.swagger.io/api/v3",
      "operation": { ... }
    }
  }
}

When LLM calls this function:
{
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "api_get_pets",
        "arguments": "{\\"query_status\\": \\"available\\"}"
      }
    }
  ]
}

Worker executes: GET https://petstore3.swagger.io/api/v3/pets?status=available
	`);
}

// Export functions for use in other modules
export { basicFunctionCalling, multipleAPIs, authenticatedAPICall, errorHandling, complexWorkflow, explainFunctionCalling };

// Example usage (uncomment to test)
// basicFunctionCalling();
// multipleAPIs();
// complexWorkflow();
// explainFunctionCalling();
