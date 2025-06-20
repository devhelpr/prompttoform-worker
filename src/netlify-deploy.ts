const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': '*',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const binary = String.fromCharCode(...new Uint8Array(buffer));
	return btoa(binary);
}

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

			//zipContents should be a base64 encoded string
			const zipContentsBase64 = arrayBufferToBase64(zipContents);

			const zipBlob = new Blob([zipContents], { type: 'application/zip' });
			const formData = new FormData();
			formData.append('file', zipBlob, 'test.zip');

			// upload zip contents to netlify
			const uploadZip = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}/deploys`, {
				method: 'POST',
				body: zipContents,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/zip',
				},
				//body: formData,
			});
			if (!uploadZip.ok) {
				let errorText = '';
				try {
					const contentType = uploadZip.headers.get('content-type') || '';
					if (contentType.includes('application/json')) {
						const errorJson = await uploadZip.json();
						errorText = JSON.stringify(errorJson);
					} else {
						errorText = await uploadZip.text();
					}
				} catch (e) {
					errorText = `Failed to parse error body: ${e}`;
				}

				return new Response(
					JSON.stringify({
						message: 'Error uploading zip to Netlify',
						status: uploadZip.status,
						statusText: uploadZip.statusText,
						details: errorText,
						zipContentsBase64: zipContentsBase64,
						siteId: site.site_id,
					}),
					{
						status: 500,
						headers: corsHeaders,
					}
				);
			}
			//const repsonseZip: any = await uploadZip.json();

			return new Response(
				JSON.stringify({
					siteId: site.site_id,
					payload: { ...site },
					uploadZip: { status: uploadZip.status, statusText: uploadZip.statusText },
					siteUrl: `https://${site.default_domain}`,
				}),
				{ status: 200, headers: corsHeaders }
			);
		} else {
			const zipBlob = new Blob([zipContents], { type: 'application/zip' });
			const formData = new FormData();
			formData.append('file', zipBlob, 'test.zip');
			// upload zip contents to netlify
			const uploadZip = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
				method: 'POST',
				body: zipContents,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/zip',
				},
				//body: formData,
			});

			if (!uploadZip.ok) {
				let errorText = '';
				try {
					const contentType = uploadZip.headers.get('content-type') || '';
					if (contentType.includes('application/json')) {
						const errorJson = await uploadZip.json();
						errorText = JSON.stringify(errorJson);
					} else {
						errorText = await uploadZip.text();
					}
				} catch (e) {
					errorText = `Failed to parse error body: ${e}`;
				}

				return new Response(
					JSON.stringify({
						message: 'Error uploading zip to Netlify',
						status: uploadZip.status,
						statusText: uploadZip.statusText,
						details: errorText,
						siteId: siteId,
					}),
					{
						status: 500,
						headers: corsHeaders,
					}
				);
			}

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
