/**
 * OpenAPI/Swagger handler for fetching and returning API specifications
 */

interface OpenAPIResponse {
	success: boolean;
	data?: any;
	error?: string;
	url?: string;
}

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 */
function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Checks if the response content is likely an OpenAPI/Swagger specification
 */
function isOpenAPISpec(content: any): boolean {
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
 * Fetches OpenAPI/Swagger specification from a URL
 */
export async function handleOpenAPIRequest(request: Request, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Methods': '*',
		'Content-Type': 'application/json',
	};

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	// Only allow GET requests
	if (request.method !== 'GET') {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Only GET requests are allowed for OpenAPI/Swagger fetching',
			}),
			{
				status: 405,
				headers: corsHeaders,
			}
		);
	}

	try {
		const url = new URL(request.url);
		const openApiUrl = url.searchParams.get('url');

		if (!openApiUrl) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Missing required parameter: url',
					message: 'Please provide a URL parameter with the OpenAPI/Swagger specification URL',
				}),
				{
					status: 400,
					headers: corsHeaders,
				}
			);
		}

		// Validate URL
		if (!isValidUrl(openApiUrl)) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Invalid URL format',
					message: 'Please provide a valid HTTP or HTTPS URL',
					url: openApiUrl,
				}),
				{
					status: 400,
					headers: corsHeaders,
				}
			);
		}

		console.log(`Fetching OpenAPI/Swagger spec from: ${openApiUrl}`);

		// Fetch the OpenAPI/Swagger specification
		const response = await fetch(openApiUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json, application/yaml, text/yaml, */*',
				'User-Agent': 'Form-Generator-Worker/1.0',
			},
			// Add timeout to prevent hanging requests
			signal: AbortSignal.timeout(30000), // 30 seconds timeout
		});

		if (!response.ok) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Failed to fetch OpenAPI specification',
					message: `HTTP ${response.status}: ${response.statusText}`,
					url: openApiUrl,
				}),
				{
					status: response.status,
					headers: corsHeaders,
				}
			);
		}

		const contentType = response.headers.get('content-type') || '';
		let specData: any;

		// Handle different content types
		if (contentType.includes('application/json')) {
			specData = await response.json();
		} else if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
			// For YAML content, we'll return it as text since we don't have a YAML parser
			const yamlText = await response.text();
			return new Response(
				JSON.stringify({
					success: true,
					data: yamlText,
					contentType: 'yaml',
					url: openApiUrl,
					message: 'YAML content returned as text. Consider converting to JSON for better parsing.',
				}),
				{
					status: 200,
					headers: corsHeaders,
				}
			);
		} else {
			// Try to parse as JSON anyway
			try {
				const text = await response.text();
				specData = JSON.parse(text);
			} catch (parseError) {
				return new Response(
					JSON.stringify({
						success: false,
						error: 'Unsupported content type',
						message: `Content type '${contentType}' is not supported. Please provide a JSON or YAML OpenAPI specification.`,
						url: openApiUrl,
					}),
					{
						status: 400,
						headers: corsHeaders,
					}
				);
			}
		}

		// Validate that it's actually an OpenAPI/Swagger specification
		if (!isOpenAPISpec(specData)) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Invalid OpenAPI/Swagger specification',
					message: 'The provided URL does not contain a valid OpenAPI 3.x or Swagger 2.x specification',
					url: openApiUrl,
					hint: 'Make sure the URL points to a valid OpenAPI or Swagger specification file',
				}),
				{
					status: 400,
					headers: corsHeaders,
				}
			);
		}

		// Return the successful response
		const result: OpenAPIResponse = {
			success: true,
			data: specData,
			url: openApiUrl,
		};

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: corsHeaders,
		});
	} catch (error) {
		console.error('OpenAPI fetch error:', error);

		let errorMessage = 'Unknown error occurred';
		let statusCode = 500;

		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				errorMessage = 'Request timeout - the OpenAPI specification took too long to fetch';
				statusCode = 408;
			} else if (error.message.includes('fetch') || error.message.includes('Network error')) {
				errorMessage = 'Network error - unable to reach the provided URL';
				statusCode = 502;
			} else {
				errorMessage = error.message;
			}
		}

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
				message: 'Failed to fetch OpenAPI specification',
			}),
			{
				status: statusCode,
				headers: corsHeaders,
			}
		);
	}
}
