import { storeFormData, getFormData, getAllFormData, updateFormData, deleteFormData, initializeDatabase, FormData } from './database';

export async function handleDatabaseRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// Initialize database on first request
	try {
		await initializeDatabase(env.DB);
	} catch (error) {
		console.error('Database initialization error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Database initialization failed',
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	// CORS headers
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	};

	// Handle preflight requests
	if (method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	try {
		// POST /api/data - Store new form data
		if (method === 'POST' && path === '/api/data') {
			const contentType = request.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Content-Type must be application/json',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const body = await request.json();
			if (!body || typeof body !== 'object') {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Request body must be a valid JSON object',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const storedData = await storeFormData(env.DB, body);

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Data stored successfully',
					data: storedData,
				}),
				{
					status: 201,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// GET /api/data - Get all form data
		if (method === 'GET' && path === '/api/data') {
			const searchParams = url.searchParams;
			const limit = parseInt(searchParams.get('limit') || '100');
			const offset = parseInt(searchParams.get('offset') || '0');

			const allData = await getAllFormData(env.DB, limit, offset);

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Data retrieved successfully',
					data: allData,
					pagination: {
						limit,
						offset,
						count: allData.length,
					},
				}),
				{
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// GET /api/data/:id - Get specific form data
		if (method === 'GET' && path.match(/^\/api\/data\/(\d+)$/)) {
			const match = path.match(/^\/api\/data\/(\d+)$/);
			if (!match) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Invalid ID format',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const id = parseInt(match[1]);
			const data = await getFormData(env.DB, id);

			if (!data) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Data not found',
					}),
					{
						status: 404,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Data retrieved successfully',
					data,
				}),
				{
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// PUT /api/data/:id - Update specific form data
		if (method === 'PUT' && path.match(/^\/api\/data\/(\d+)$/)) {
			const match = path.match(/^\/api\/data\/(\d+)$/);
			if (!match) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Invalid ID format',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const id = parseInt(match[1]);
			const contentType = request.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Content-Type must be application/json',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const body = await request.json();
			if (!body || typeof body !== 'object') {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Request body must be a valid JSON object',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const updatedData = await updateFormData(env.DB, id, body);

			if (!updatedData) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Data not found',
					}),
					{
						status: 404,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Data updated successfully',
					data: updatedData,
				}),
				{
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// DELETE /api/data/:id - Delete specific form data
		if (method === 'DELETE' && path.match(/^\/api\/data\/(\d+)$/)) {
			const match = path.match(/^\/api\/data\/(\d+)$/);
			if (!match) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Invalid ID format',
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			const id = parseInt(match[1]);
			const deleted = await deleteFormData(env.DB, id);

			if (!deleted) {
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Data not found',
					}),
					{
						status: 404,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
			}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Data deleted successfully',
				}),
				{
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// If no matching route, return 404
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Endpoint not found',
			}),
			{
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Database API error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
}
