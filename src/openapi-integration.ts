/**
 * OpenAPI tool integration for LLM calls
 * This module handles the integration of OpenAPI/Swagger fetching into LLM requests
 */

interface OpenAPIToolConfig {
	useOpenAPITool: boolean;
	openApiUrls?: string[];
}

interface LLMRequest {
	messages?: any[];
	tools?: any[];
	[key: string]: any;
}

/**
 * Fetches OpenAPI specification from a URL
 */
async function fetchOpenAPISpec(url: string): Promise<any> {
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json, application/yaml, text/yaml, */*',
				'User-Agent': 'Form-Generator-Worker/1.0',
			},
			signal: AbortSignal.timeout(30000), // 30 seconds timeout
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type') || '';

		if (contentType.includes('application/json')) {
			return await response.json();
		} else if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
			// For YAML, return as text since we don't have a YAML parser
			const yamlText = await response.text();
			return {
				content: yamlText,
				contentType: 'yaml',
				note: 'YAML content returned as text. Consider converting to JSON for better parsing.',
			};
		} else {
			// Try to parse as JSON anyway
			const text = await response.text();
			return JSON.parse(text);
		}
	} catch (error) {
		console.error(`Failed to fetch OpenAPI spec from ${url}:`, error);
		throw error;
	}
}

/**
 * Validates if content is a valid OpenAPI/Swagger specification
 */
function isValidOpenAPISpec(content: any): boolean {
	if (typeof content !== 'object' || content === null) {
		return false;
	}

	// Check for OpenAPI 3.x
	if (content.openapi && typeof content.openapi === 'string') {
		return content.openapi.startsWith('3.');
	}

	// Check for Swagger 2.x
	if (content.swagger && typeof content.swagger === 'string') {
		return content.swagger.startsWith('2.');
	}

	// Check for common OpenAPI fields
	const hasInfo = content.info && typeof content.info === 'object';
	const hasPaths = content.paths && typeof content.paths === 'object';

	return hasInfo && hasPaths;
}

/**
 * Creates a single function for fetching OpenAPI/Swagger documentation
 */
function createOpenAPIDocumentationFunction(): any {
	return {
		type: 'function',
		function: {
			name: 'get_openapi_documentation',
			description:
				"Fetch OpenAPI/Swagger documentation from a URL. Use this when you need to understand an API specification, endpoints, parameters, or schemas. Extract URLs from the user's message or conversation context.",
			parameters: {
				type: 'object',
				properties: {
					url: {
						type: 'string',
						description:
							"The URL of the OpenAPI/Swagger specification (JSON or YAML format). Extract this URL from the user's message or conversation context.",
					},
					format: {
						type: 'string',
						enum: ['json', 'yaml'],
						description: 'Preferred format for the response (defaults to json)',
					},
				},
				required: ['url'],
			},
		},
	};
}

/**
 * Processes LLM request body to integrate OpenAPI tool if requested
 */
export function processLLMRequestWithOpenAPI(requestBody: string): string {
	try {
		const requestData: LLMRequest = JSON.parse(requestBody);

		console.log('processLLMRequestWithOpenAPI 1:');

		// Check if useOpenAPITool is present and true
		// const openApiConfig: OpenAPIToolConfig = requestData.useOpenAPITool;

		// if (!openApiConfig || !openApiConfig.useOpenAPITool) {
		// 	// No OpenAPI tool requested, but still remove the useOpenAPITool parameter
		// 	delete requestData.useOpenAPITool;
		// 	return JSON.stringify(requestData);
		// }

		// Initialize tools array if it doesn't exist
		if (!requestData.tools) {
			requestData.tools = [];
		}

		// Add the OpenAPI documentation function
		const openApiFunction = createOpenAPIDocumentationFunction();
		requestData.tools.push(openApiFunction);
		requestData.tool_choice = 'auto';
		console.log('processLLMRequestWithOpenAPI 2:', requestData.tools?.length ?? -1);

		// No need to modify system messages - the function is already defined in the tools array

		// Remove the useOpenAPITool config from the request before sending to LLM
		delete requestData.useOpenAPITool;

		return JSON.stringify(requestData);
	} catch (error) {
		console.error('Error processing LLM request with OpenAPI:', error);
		// Return original body if processing fails
		return requestBody;
	}
}

/**
 * Executes a function call from the LLM
 */
export async function executeAPICall(functionName: string, arguments_: any, functionMetadata?: any): Promise<any> {
	try {
		// Handle OpenAPI documentation fetching
		if (functionName === 'get_openapi_documentation') {
			const { url, format = 'json' } = arguments_;

			if (!url) {
				return {
					success: false,
					error: 'URL parameter is required',
				};
			}

			// Validate URL
			try {
				new URL(url);
			} catch {
				return {
					success: false,
					error: 'Invalid URL format',
				};
			}

			console.log(`Fetching OpenAPI documentation from: ${url}`);

			// Fetch the OpenAPI specification
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Accept: 'application/json, application/yaml, text/yaml, */*',
					'User-Agent': 'Form-Generator-Worker/1.0',
				},
				signal: AbortSignal.timeout(30000), // 30 seconds timeout
			});

			if (!response.ok) {
				return {
					success: false,
					error: `Failed to fetch OpenAPI specification: HTTP ${response.status} ${response.statusText}`,
				};
			}

			const contentType = response.headers.get('content-type') || '';
			let specData: any;

			// Handle different content types
			if (contentType.includes('application/json')) {
				specData = await response.json();
			} else if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
				const yamlText = await response.text();
				return {
					success: true,
					data: {
						content: yamlText,
						contentType: 'yaml',
						url: url,
						note: 'YAML content returned as text. Consider converting to JSON for better parsing.',
					},
					format: 'yaml',
				};
			} else {
				// Try to parse as JSON anyway
				try {
					const text = await response.text();
					specData = JSON.parse(text);
				} catch (parseError) {
					return {
						success: false,
						error: `Unsupported content type: ${contentType}. Please provide a JSON or YAML OpenAPI specification.`,
					};
				}
			}

			// Validate that it's actually an OpenAPI/Swagger specification
			if (!isValidOpenAPISpec(specData)) {
				return {
					success: false,
					error: 'The provided URL does not contain a valid OpenAPI 3.x or Swagger 2.x specification',
				};
			}

			// Format the response based on requested format
			if (format === 'yaml') {
				// For YAML format, we'll return a summary since we don't have a YAML serializer
				return {
					success: true,
					data: {
						title: specData.info?.title || 'Unknown API',
						version: specData.info?.version || 'Unknown version',
						description: specData.info?.description || 'No description available',
						endpoints: Object.keys(specData.paths || {}),
						servers: specData.servers || [],
						note: 'Full specification available in JSON format. Use format: "json" to get complete details.',
						url: url,
					},
					format: 'yaml',
				};
			}

			// Return full JSON specification
			return {
				success: true,
				data: specData,
				format: 'json',
				url: url,
				summary: {
					title: specData.info?.title || 'Unknown API',
					version: specData.info?.version || 'Unknown version',
					description: specData.info?.description || 'No description available',
					endpoints: Object.keys(specData.paths || {}),
					servers: specData.servers || [],
				},
			};
		}

		// Handle other function calls (if any)
		return {
			success: false,
			error: `Unknown function: ${functionName}`,
		};
	} catch (error) {
		console.error(`Error executing function call for ${functionName}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Checks if a request body contains OpenAPI tool configuration
 */
export function hasOpenAPIToolConfig(requestBody: string): boolean {
	try {
		const requestData = JSON.parse(requestBody);
		return !!(requestData.useOpenAPITool && requestData.useOpenAPITool.useOpenAPITool === true);
	} catch {
		return false;
	}
}
