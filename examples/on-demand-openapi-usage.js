/**
 * Example usage of On-Demand OpenAPI Documentation Fetching
 *
 * This demonstrates how the LLM can fetch OpenAPI/Swagger documentation
 * on-demand when it needs to understand an API.
 */

// Example 1: Basic on-demand documentation fetching
async function basicDocumentationFetching() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'I need to understand the Pet Store API. Can you fetch its documentation and tell me what endpoints are available?',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [], // No pre-specified URLs - LLM will fetch on demand
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
	console.log('LLM Response with on-demand documentation:', data);
}

// Example 2: Multiple API exploration
async function multipleAPIExploration() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: `I need to understand these APIs:
				1. Pet Store API: https://petstore3.swagger.io/api/v3/openapi.json
				2. JSONPlaceholder API: https://jsonplaceholder.typicode.com/openapi.json
				3. GitHub API: https://api.github.com/openapi.json
				
				Please fetch their documentation and compare their authentication methods and available endpoints.`,
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
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
	console.log('Multiple API comparison:', data);
}

// Example 3: API analysis and recommendations
async function apiAnalysisAndRecommendations() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: `I'm building a new e-commerce API. Please analyze the Pet Store API documentation and give me recommendations on:
				1. What endpoints I should include
				2. What authentication methods to use
				3. What response formats to support
				4. Any best practices I should follow
				
				Fetch the Pet Store API docs from: https://petstore3.swagger.io/api/v3/openapi.json`,
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
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
	console.log('API analysis and recommendations:', data);
}

// Example 4: Error handling and validation
async function errorHandlingExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content:
					'Please fetch the documentation from this invalid URL: https://invalid-url.com/api.json and also try this valid one: https://petstore3.swagger.io/api/v3/openapi.json',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
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
	console.log('Error handling example:', data);
}

// Example 5: YAML vs JSON format handling
async function formatHandlingExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: `I need to understand this API. Please fetch its documentation in both JSON and YAML formats:
				1. JSON: https://petstore3.swagger.io/api/v3/openapi.json
				2. YAML: https://petstore3.swagger.io/api/v3/openapi.yaml
				
				Compare the formats and tell me which one is easier to read.`,
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
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
	console.log('Format handling example:', data);
}

// Example 6: How the function calling works internally
function explainOnDemandFunctionCalling() {
	console.log(`
On-Demand OpenAPI Documentation Fetching Flow:

1. Client sends request with useOpenAPITool: true
2. Worker adds get_openapi_documentation function to LLM request
3. LLM receives request with available function
4. LLM decides to call get_openapi_documentation with a URL
5. LLM returns tool_calls with function arguments
6. Worker intercepts response and executes the function
7. Worker fetches OpenAPI specification from the provided URL
8. Worker validates and returns the specification to LLM
9. LLM processes the documentation and returns final response

Function Definition:
{
  "type": "function",
  "function": {
    "name": "get_openapi_documentation",
    "description": "Fetch OpenAPI/Swagger documentation from a URL...",
    "parameters": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The URL of the OpenAPI/Swagger specification"
        },
        "format": {
          "type": "string",
          "enum": ["json", "yaml"],
          "description": "Preferred format for the response"
        }
      },
      "required": ["url"]
    }
  }
}

Example LLM Function Call:
{
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "get_openapi_documentation",
        "arguments": "{\\"url\\": \\"https://api.example.com/openapi.json\\", \\"format\\": \\"json\\"}"
      }
    }
  ]
}

Worker executes: GET https://api.example.com/openapi.json
Returns: Full OpenAPI specification to LLM
	`);
}

// Export functions for use in other modules
export {
	basicDocumentationFetching,
	multipleAPIExploration,
	apiAnalysisAndRecommendations,
	errorHandlingExample,
	formatHandlingExample,
	explainOnDemandFunctionCalling,
};

// Example usage (uncomment to test)
// basicDocumentationFetching();
// multipleAPIExploration();
// apiAnalysisAndRecommendations();
// explainOnDemandFunctionCalling();
