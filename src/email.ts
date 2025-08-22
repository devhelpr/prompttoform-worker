interface FormData {
	[key: string]: any;
}

interface EmailRequest {
	to: string;
	subject?: string;
	formData: FormData;
	from?: string;
}

export async function handleEmailFormData(request: Request, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};

	// Handle preflight requests
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	// Only allow POST requests
	if (request.method !== 'POST') {
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Method not allowed',
			}),
			{
				status: 405,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			}
		);
	}

	try {
		// Parse the request body
		const emailRequest: EmailRequest = await request.json();

		// Validate required fields
		if (!emailRequest.to || !emailRequest.formData) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Missing required fields: to and formData',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailRequest.to)) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Invalid email format',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}

		// Prepare email content
		const subject = emailRequest.subject || 'New Form Submission';
		const from = emailRequest.from || 'noreply@yourdomain.com';

		// Convert form data to readable format
		const formDataText = Object.entries(emailRequest.formData)
			.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
			.join('\n');

		const emailContent = `
New form submission received:

${formDataText}

---
Sent via Form Generator Worker
		`.trim();

		// Send email using Mailrelay API
		const mailrelayApiKey = env.MAILRELAY_API_KEY;
		const mailrelayDomain = env.MAILRELAY_DOMAIN;

		if (!mailrelayApiKey || !mailrelayDomain) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Email service not configured',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}

		// Prepare email data for Mailrelay
		const emailData = {
			to: emailRequest.to,
			from: from,
			subject: subject,
			html: emailContent.replace(/\n/g, '<br>'),
			text: emailContent,
		};

		// Send email via Mailrelay
		const mailrelayResponse = await fetch(`https://${mailrelayDomain}/api/v1/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${mailrelayApiKey}`,
			},
			body: JSON.stringify(emailData),
		});

		if (mailrelayResponse.ok) {
			const result = await mailrelayResponse.json();
			return new Response(
				JSON.stringify({
					success: true,
					message: 'Email sent successfully',
					// temp: todo! .. fix as any
					messageId: (result as any).messageId || 'unknown',
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		} else {
			console.error('Mailrelay API error:', await mailrelayResponse.text());
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Failed to send email',
					error: `Mailrelay API error: ${mailrelayResponse.status}`,
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}
	} catch (error) {
		console.error('Error processing email request:', error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			}
		);
	}
}
