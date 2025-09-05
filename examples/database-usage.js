/**
 * Example usage of the Database API endpoints
 * This file demonstrates how to interact with the form-generator-worker database API
 */

// Replace with your actual worker URL
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';

// Example form data
const sampleFormData = {
	name: 'John Doe',
	email: 'john@example.com',
	message: 'Hello from the contact form!',
	phone: '+1234567890',
	subject: 'General Inquiry',
	timestamp: new Date().toISOString(),
};

// Example: Store new form data
async function storeFormData() {
	try {
		console.log('📝 Storing form data...');

		const response = await fetch(`${WORKER_URL}/api/data`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(sampleFormData),
		});

		const result = await response.json();

		if (result.success) {
			console.log('✅ Data stored successfully!');
			console.log('📊 Stored data:', result.data);
			return result.data.id;
		} else {
			console.error('❌ Failed to store data:', result.message);
			return null;
		}
	} catch (error) {
		console.error('❌ Error storing data:', error.message);
		return null;
	}
}

// Example: Retrieve all form data
async function getAllFormData(limit = 10, offset = 0) {
	try {
		console.log('📋 Retrieving all form data...');

		const response = await fetch(`${WORKER_URL}/api/data?limit=${limit}&offset=${offset}`);
		const result = await response.json();

		if (result.success) {
			console.log('✅ Data retrieved successfully!');
			console.log(`📊 Found ${result.data.length} records`);
			console.log('📄 Data:', result.data);
			return result.data;
		} else {
			console.error('❌ Failed to retrieve data:', result.message);
			return [];
		}
	} catch (error) {
		console.error('❌ Error retrieving data:', error.message);
		return [];
	}
}

// Example: Get specific form data by ID
async function getFormData(id) {
	try {
		console.log(`📋 Retrieving form data with ID: ${id}`);

		const response = await fetch(`${WORKER_URL}/api/data/${id}`);
		const result = await response.json();

		if (result.success) {
			console.log('✅ Data retrieved successfully!');
			console.log('📄 Data:', result.data);
			return result.data;
		} else {
			console.error('❌ Failed to retrieve data:', result.message);
			return null;
		}
	} catch (error) {
		console.error('❌ Error retrieving data:', error.message);
		return null;
	}
}

// Example: Update form data
async function updateFormData(id, updatedData) {
	try {
		console.log(`📝 Updating form data with ID: ${id}`);

		const response = await fetch(`${WORKER_URL}/api/data/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updatedData),
		});

		const result = await response.json();

		if (result.success) {
			console.log('✅ Data updated successfully!');
			console.log('📄 Updated data:', result.data);
			return result.data;
		} else {
			console.error('❌ Failed to update data:', result.message);
			return null;
		}
	} catch (error) {
		console.error('❌ Error updating data:', error.message);
		return null;
	}
}

// Example: Delete form data
async function deleteFormData(id) {
	try {
		console.log(`🗑️ Deleting form data with ID: ${id}`);

		const response = await fetch(`${WORKER_URL}/api/data/${id}`, {
			method: 'DELETE',
		});

		const result = await response.json();

		if (result.success) {
			console.log('✅ Data deleted successfully!');
			return true;
		} else {
			console.error('❌ Failed to delete data:', result.message);
			return false;
		}
	} catch (error) {
		console.error('❌ Error deleting data:', error.message);
		return false;
	}
}

// Example: Complete workflow
async function runCompleteWorkflow() {
	console.log('🚀 Starting complete database workflow...\n');

	// Step 1: Store new data
	const storedId = await storeFormData();
	if (!storedId) {
		console.log('❌ Workflow stopped: Failed to store data');
		return;
	}

	console.log('\n' + '─'.repeat(50) + '\n');

	// Step 2: Retrieve all data
	await getAllFormData();

	console.log('\n' + '─'.repeat(50) + '\n');

	// Step 3: Get specific data
	await getFormData(storedId);

	console.log('\n' + '─'.repeat(50) + '\n');

	// Step 4: Update data
	const updatedData = {
		name: 'John Updated',
		email: 'john.updated@example.com',
		message: 'Updated message!',
		phone: '+1234567890',
		subject: 'Updated Subject',
		timestamp: new Date().toISOString(),
	};
	await updateFormData(storedId, updatedData);

	console.log('\n' + '─'.repeat(50) + '\n');

	// Step 5: Verify update
	await getFormData(storedId);

	console.log('\n' + '─'.repeat(50) + '\n');

	// Step 6: Delete data (uncomment to test deletion)
	// await deleteFormData(storedId);

	console.log('✅ Complete workflow finished!');
}

// Export functions for use in other modules
export { storeFormData, getAllFormData, getFormData, updateFormData, deleteFormData, runCompleteWorkflow };

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runCompleteWorkflow().catch(console.error);
}
