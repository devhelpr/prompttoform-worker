/**
 * Examples showing how system message handling works with OpenAPI tool integration
 *
 * This demonstrates how the worker preserves existing system messages completely
 * and only adds the OpenAPI function to the tools array.
 */

// Example 1: Request with existing system message - preserved exactly
async function existingSystemMessageExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: 'You are a specialized API documentation assistant. Always provide accurate and helpful information about APIs.',
			},
			{
				role: 'user',
				content: 'I need to understand the GitHub API. Can you help me explore its endpoints?',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
		},
	};

	// The worker will preserve the system message exactly as-is
	// Only adds get_openapi_documentation function to the tools array
	// System message remains: "You are a specialized API documentation assistant. Always provide accurate and helpful information about APIs."

	console.log('Request with existing system message:', JSON.stringify(requestBody, null, 2));
}

// Example 2: Request without system message - no system message created
async function noSystemMessageExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: 'I need to understand the Pet Store API. Can you fetch its documentation?',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
		},
	};

	// The worker will not create any system message
	// Only adds get_openapi_documentation function to the tools array
	// Messages remain unchanged

	console.log('Request without system message:', JSON.stringify(requestBody, null, 2));
}

// Example 3: Request with multiple system messages - all preserved exactly
async function multipleSystemMessagesExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: 'You are a specialized API documentation assistant.',
			},
			{
				role: 'system',
				content: 'Always be helpful and accurate.',
			},
			{
				role: 'user',
				content: 'Help me understand the Stripe API.',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
		},
	};

	// The worker will preserve all system messages exactly as-is
	// Only adds get_openapi_documentation function to the tools array
	// All messages remain unchanged

	console.log('Request with multiple system messages:', JSON.stringify(requestBody, null, 2));
}

// Example 4: Request without useOpenAPITool - no changes
async function noOpenAPIToolExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: 'You are a specialized API documentation assistant.',
			},
			{
				role: 'user',
				content: 'Help me understand APIs.',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: false,
			openApiUrls: [],
		},
	};

	// The worker will not modify the request at all
	// System message remains: "You are a specialized API documentation assistant."

	console.log('Request without useOpenAPITool:', JSON.stringify(requestBody, null, 2));
}

// Example 5: Complex system message with instructions - preserved exactly
async function complexSystemMessageExample() {
	const requestBody = {
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You are an expert API analyst with the following capabilities:
1. Analyze API documentation thoroughly
2. Identify potential issues or improvements
3. Provide clear, actionable recommendations
4. Always consider security implications
5. Be precise and technical in your explanations

Your responses should be professional and detailed.`,
			},
			{
				role: 'user',
				content: 'I need to analyze the Twilio API. Can you help me understand its structure and identify any potential issues?',
			},
		],
		useOpenAPITool: {
			useOpenAPITool: true,
			openApiUrls: [],
		},
	};

	// The worker will preserve this complex system message exactly as-is
	// Only adds get_openapi_documentation function to the tools array
	// System message remains completely unchanged

	console.log('Request with complex system message:', JSON.stringify(requestBody, null, 2));
}

// Example 6: Show the actual transformation
function demonstrateTransformation() {
	console.log(`
System Message Handling Examples:

1. EXISTING SYSTEM MESSAGE:
   Input:  "You are a specialized API documentation assistant."
   Output: "You are a specialized API documentation assistant." (unchanged)
           + get_openapi_documentation function added to tools array

2. NO SYSTEM MESSAGE:
   Input:  No system message
   Output: No system message (unchanged)
           + get_openapi_documentation function added to tools array

3. MULTIPLE SYSTEM MESSAGES:
   Input:  ["You are a specialized API documentation assistant.", "Always be helpful."]
   Output: ["You are a specialized API documentation assistant.", "Always be helpful."] (unchanged)
           + get_openapi_documentation function added to tools array

4. NO OPENAPI TOOL:
   Input:  "You are a specialized API documentation assistant."
   Output: "You are a specialized API documentation assistant." (completely unchanged)

Key Benefits:
- No system message modifications
- No token waste on redundant information
- Function definition is already in tools array
- Complete preservation of user intent
	`);
}

// Export functions for use in other modules
export {
	existingSystemMessageExample,
	noSystemMessageExample,
	multipleSystemMessagesExample,
	noOpenAPIToolExample,
	complexSystemMessageExample,
	demonstrateTransformation,
};

// Example usage (uncomment to test)
// existingSystemMessageExample();
// noSystemMessageExample();
// multipleSystemMessagesExample();
// demonstrateTransformation();
