const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': '*',
};

export async function handleDeployCodeFlowCanvasToNetlify(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}
	const body: any = await request.json();
	const accessToken = body.netlifyAccessToken;

	if (!accessToken) {
		return new Response('No access token provided', {
			status: 400,
			headers: corsHeaders,
		});
	}
	try {
		// read contents from  assets/test.zip , we're inside a cloudflare worker
		const zip = await env.ASSETS.fetch(new URL('https://assets.local/test.zip'));
		const zipContents = await zip.arrayBuffer();

		const siteId = body.netlifySiteId;

		if (!siteId) {
			const createSite = await fetch(`https://api.netlify.com/api/v1/sites`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					//'Content-Type': 'application/json',
				},
			});
			const site: any = await createSite.json();

			// upload zip contents to netlify
			const uploadZip = await fetch(`https://api.netify.com/api/v1/sites/${site.site_id}/deploys`, {
				method: 'POST',
				body: zipContents,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/zip',
				},
			});
			if (uploadZip.status !== 200) {
				return new Response(JSON.stringify({ message: 'Error uploading zip to Netlify', error: uploadZip.statusText }), {
					status: 500,
					headers: corsHeaders,
				});
			}
			//const repsonseZip: any = await uploadZip.json();

			return new Response(
				JSON.stringify({
					siteId: site.site_id,
					payload: { ...site },
					uploadZip: { status: uploadZip.status, statusText: uploadZip.statusText },
				}),
				{ status: 200, headers: corsHeaders }
			);
		} else {
			// upload zip contents to netlify
			await fetch(`https://api.netify.com/api/v1/sites/${siteId}/deploys`, {
				method: 'POST',
				body: zipContents,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/zip',
				},
			});

			return new Response(
				JSON.stringify({
					siteId: siteId,
				}),
				{ status: 200, headers: corsHeaders }
			);
		}
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ message: 'Error deploying to Netlify', error: error }), {
			status: 500,
			headers: corsHeaders,
		});
	}
}
